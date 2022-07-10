import base64js from "base64-js";
import * as v1beta1 from "../proto/akash/v1beta1";
import * as v1beta2 from "../proto/akash/v1beta2";
import * as uuid from "uuid";
import { sha256 } from "js-sha256";
import { blockHeightToKey, blocksDb, txsDb } from "@src/akash/dataStore";
import {
  Deployment,
  Transaction,
  Message,
  Block,
  Bid,
  Lease,
  Op,
  DeploymentGroup,
  DeploymentGroupResource,
  sequelize,
  Provider,
  ProviderAttribute,
  ProviderAttributeSignature
} from "@src/db/schema";
import { AuthInfo, TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import * as benchmark from "../shared/utils/benchmark";
import { accountSettle } from "@src/shared/utils/akashPaymentSettle";
import { lastBlockToSync } from "@src/shared/constants";
import { decodeAkashType, uint8arrayToString } from "@src/shared/utils/protobuf";

export let processingStatus = null;

function fromBase64(base64String) {
  if (!base64String.match(/^[a-zA-Z0-9+/]*={0,2}$/)) {
    throw new Error("Invalid base64 string format");
  }
  return base64js.toByteArray(base64String);
}
/**
 * Takes a serialized TxRaw (the bytes stored in Tendermint) and decodes it into something usable.
 */
function decodeTxRaw(tx) {
  const txRaw = TxRaw.decode(tx);
  return {
    authInfo: AuthInfo.decode(txRaw.authInfoBytes),
    body: TxBody.decode(txRaw.bodyBytes),
    signatures: txRaw.signatures
  };
}

async function getBlockByHeight(height) {
  const content = await blocksDb.get(height);
  return JSON.parse(content);
}

let deploymentIdCache = [];
function addToDeploymentIdCache(owner, dseq, id) {
  deploymentIdCache[owner + "_" + dseq] = id;
}
function getDeploymentIdFromCache(owner, dseq) {
  return deploymentIdCache[owner + "_" + dseq];
}

let deploymentGroupIdCache = [];
function addToDeploymentGroupIdCache(owner, dseq, gseq, id) {
  deploymentGroupIdCache[owner + "_" + dseq + "_" + gseq] = id;
}
function getDeploymentGroupIdFromCache(owner, dseq, gseq) {
  return deploymentGroupIdCache[owner + "_" + dseq + "_" + gseq];
}

class StatsProcessor {
  private totalLeaseCount = 0;
  private activeProviderCount = 0;

  public async rebuildStatsTables() {
    console.log("Disabling foreign key checks");

    await sequelize.query("PRAGMA foreign_keys=0");

    console.log('Setting "isProcessed" to false');
    await Message.update(
      {
        isProcessed: false,
        relatedDeploymentId: null
      },
      { where: { isProcessed: true } }
    );
    await Transaction.update(
      {
        isProcessed: false
      },
      { where: { isProcessed: true } }
    );
    await Block.update(
      {
        isProcessed: false
      },
      { where: { isProcessed: true } }
    );

    console.log("Rebuilding stats tables...");
    await Bid.drop();
    await Lease.drop();
    await Provider.drop();
    await ProviderAttribute.drop();
    await ProviderAttributeSignature.drop();
    await DeploymentGroupResource.drop();
    await DeploymentGroup.drop();
    await Deployment.drop();
    await Deployment.sync({ force: true });
    await DeploymentGroup.sync({ force: true });
    await DeploymentGroupResource.sync({ force: true });
    await ProviderAttributeSignature.sync({ force: true });
    await ProviderAttribute.sync({ force: true });
    await Provider.sync({ force: true });
    await Lease.sync({ force: true });
    await Bid.sync({ force: true });

    console.log("Enabling foreign key checks");
    await sequelize.query("PRAGMA foreign_keys=0");

    await this.processMessages();
  }

  public async processMessages() {
    processingStatus = "Processing messages";

    console.log("Fetching deployment id cache...");

    const existingDeployments = await Deployment.findAll({
      attributes: ["id", "owner", "dseq"]
    });

    existingDeployments.forEach((d) => addToDeploymentIdCache(d.owner, d.dseq, d.id));

    const existingDeploymentGroups = await DeploymentGroup.findAll({
      attributes: ["id", "owner", "dseq", "gseq"]
    });
    existingDeploymentGroups.forEach((d) => addToDeploymentGroupIdCache(d.owner, d.dseq, d.gseq, d.id));

    console.log("Querying unprocessed messages...");

    const groupSize = 10_000;
    this.totalLeaseCount = await Lease.count();
    this.activeProviderCount = await Provider.count();

    let previousProcessedBlock = await Block.findOne({
      where: {
        isProcessed: true
      },
      order: [["height", "DESC"]]
    });
    const firstUnprocessedHeight: number = await Block.min("height", {
      where: {
        isProcessed: false
      }
    });
    const lastUnprocessedHeight: number = await Block.max("height", {
      where: {
        isProcessed: false
      }
    });

    let firstBlockToProcess = firstUnprocessedHeight;
    let lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize, lastBlockToSync);
    while (firstBlockToProcess <= Math.min(lastUnprocessedHeight, lastBlockToSync)) {
      console.log(`Loading blocks ${firstBlockToProcess} to ${lastBlockToProcess}`);

      const getBlocksTimer = benchmark.startTimer("getBlocks");
      const blocks = await Block.findAll({
        attributes: ["height"],
        where: {
          isProcessed: false,
          height: { [Op.gte]: firstBlockToProcess, [Op.lte]: lastBlockToProcess }
        },
        include: [
          {
            model: Transaction,
            required: false,
            where: {
              isProcessed: false,
              hasProcessingError: false
            },
            include: [
              {
                model: Message,
                required: false,
                where: {
                  isInterestingType: true,
                  isProcessed: false
                }
              }
            ]
          }
        ],
        order: [
          ["height", "ASC"],
          [Transaction, "index", "ASC"],
          [Transaction, Message, "index", "ASC"]
        ]
      });
      getBlocksTimer.end();

      const blockGroupTransaction = await sequelize.transaction();

      let totalResources = await this.getTotalResources(blockGroupTransaction, firstBlockToProcess);

      let predictedClosedHeights = await this.getFuturePredictedCloseHeights(firstBlockToProcess, lastBlockToProcess, blockGroupTransaction);

      try {
        for (const block of blocks) {
          const getBlockByHeightTimer = benchmark.startTimer("getBlockByHeight");
          const blockData = await getBlockByHeight(blockHeightToKey(block.height));
          getBlockByHeightTimer.end();

          let shouldRefreshPredictedHeights = false;

          for (const transaction of block.transactions) {
            for (const msg of transaction.messages) {
              processingStatus = `Processing message ${msg.indexInBlock} of block #${block.height}`;

              console.log(`Processing message ${msg.type} - Block #${block.height}`);

              shouldRefreshPredictedHeights = shouldRefreshPredictedHeights || this.checkShouldRefreshPredictedCloseHeight(msg);

              const decodeTimer = benchmark.startTimer("decodeTx");
              const tx = blockData.block.data.txs.find((t) => sha256(Buffer.from(t, "base64")).toUpperCase() === transaction.hash);
              const encodedMessage = decodeTxRaw(fromBase64(tx)).body.messages[msg.index].value;
              decodeTimer.end();

              await benchmark.measureAsync("processMessage", async () => {
                await this.processMessage(msg, encodedMessage, block.height, blockGroupTransaction);
              });

              if (msg.relatedDeploymentId) {
                await benchmark.measureAsync("saveRelatedDeploymentId", async () => {
                  await msg.save({ transaction: blockGroupTransaction });
                });
              }
            }
          }

          if (shouldRefreshPredictedHeights) {
            predictedClosedHeights = await this.getFuturePredictedCloseHeights(firstBlockToProcess, lastBlockToProcess, blockGroupTransaction);
          }

          if (shouldRefreshPredictedHeights || predictedClosedHeights.includes(block.height)) {
            totalResources = await this.getTotalResources(blockGroupTransaction, block.height);
          }

          await benchmark.measureAsync("blockUpdate", async () => {
            await block.update(
              {
                isProcessed: true,
                activeProviderCount: this.activeProviderCount,
                activeLeaseCount: totalResources.count,
                totalLeaseCount: this.totalLeaseCount,
                activeCPU: totalResources.cpuSum,
                activeMemory: totalResources.memorySum,
                activeStorage: totalResources.storageSum,
                totalUAktSpent: (previousProcessedBlock?.totalUAktSpent || 0) + totalResources.priceSum
              },
              { transaction: blockGroupTransaction }
            );
          });
          previousProcessedBlock = block;
        }

        await benchmark.measureAsync("transactionUpdate", async () => {
          await Transaction.update(
            {
              isProcessed: true
            },
            {
              where: {
                height: { [Op.gte]: firstBlockToProcess, [Op.lte]: lastBlockToProcess }
              },
              transaction: blockGroupTransaction
            }
          );
        });

        await benchmark.measureAsync("MsgUpdate", async () => {
          await Message.update(
            {
              isProcessed: true
            },
            {
              where: {
                height: { [Op.gte]: firstBlockToProcess, [Op.lte]: lastBlockToProcess }
              },
              transaction: blockGroupTransaction
            }
          );
        });

        await benchmark.measureAsync("blockGroupTransactionCommit", async () => {
          await blockGroupTransaction.commit();
        });
      } catch (err) {
        await blockGroupTransaction.rollback();
        throw err;
      }

      firstBlockToProcess += groupSize;
      lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize, lastBlockToSync);
    }

    processingStatus = null;
  }

  @benchmark.measureMethodAsync
  private async getFuturePredictedCloseHeights(firstBlock: number, lastBlock: number, blockGroupTransaction) {
    const leases = await Lease.findAll({
      attributes: ["predictedClosedHeight"],
      where: {
        predictedClosedHeight: { [Op.gte]: firstBlock, [Op.lte]: lastBlock }
      },
      transaction: blockGroupTransaction
    });

    return leases.map((x) => x.predictedClosedHeight);
  }

  private checkShouldRefreshPredictedCloseHeight(msg: Message): boolean {
    return [
      // v1beta1
      "/akash.deployment.v1beta1.MsgCreateDeployment",
      "/akash.deployment.v1beta1.MsgCloseDeployment",
      "/akash.market.v1beta1.MsgCreateLease",
      "/akash.market.v1beta1.MsgCloseLease",
      "/akash.market.v1beta1.MsgCloseBid",
      "/akash.deployment.v1beta1.MsgDepositDeployment",
      "/akash.market.v1beta1.MsgWithdrawLease",
      // v1beta2
      "/akash.deployment.v1beta2.MsgCreateDeployment",
      "/akash.deployment.v1beta2.MsgCloseDeployment",
      "/akash.market.v1beta2.MsgCreateLease",
      "/akash.market.v1beta2.MsgCloseLease",
      "/akash.market.v1beta2.MsgCloseBid",
      "/akash.deployment.v1beta2.MsgDepositDeployment",
      "/akash.market.v1beta2.MsgWithdrawLease"
    ].includes(msg.type);
  }

  @benchmark.measureMethodAsync
  private async getTotalResources(blockGroupTransaction, height) {
    const totalResources = await Lease.findAll({
      attributes: ["cpuUnits", "memoryQuantity", "storageQuantity", "price"],
      where: {
        closedHeight: { [Op.is]: null },
        predictedClosedHeight: { [Op.gt]: height }
      },
      transaction: blockGroupTransaction
    });

    return {
      count: totalResources.length,
      cpuSum: totalResources.map((x) => x.cpuUnits).reduce((a, b) => a + b, 0),
      memorySum: totalResources.map((x) => x.memoryQuantity).reduce((a, b) => a + b, 0),
      storageSum: totalResources.map((x) => x.storageQuantity).reduce((a, b) => a + b, 0),
      priceSum: totalResources.map((x) => x.price).reduce((a, b) => a + b, 0)
    };
  }

  public hasMessageHandlerFor(messageType: string): boolean {
    return Object.keys(this.messageHandlers).includes(messageType);
  }

  private messageHandlers: { [key: string]: (encodedMessage, height: number, blockGroupTransaction, msg: Message) => Promise<void> } = {
    "/akash.deployment.v1beta1.MsgCreateDeployment": this.handleCreateDeployment,
    "/akash.deployment.v1beta1.MsgCloseDeployment": this.handleCloseDeployment,
    "/akash.market.v1beta1.MsgCreateLease": this.handleCreateLease,
    "/akash.market.v1beta1.MsgCloseLease": this.handleCloseLease,
    "/akash.market.v1beta1.MsgCreateBid": this.handleCreateBid,
    "/akash.market.v1beta1.MsgCloseBid": this.handleCloseBid,
    "/akash.deployment.v1beta1.MsgDepositDeployment": this.handleDepositDeployment,
    "/akash.market.v1beta1.MsgWithdrawLease": this.handleWithdrawLease,
    "/akash.provider.v1beta1.MsgCreateProvider": this.handleCreateProvider,
    "/akash.provider.v1beta1.MsgUpdateProvider": this.handleUpdateProvider,
    "/akash.provider.v1beta1.MsgDeleteProvider": this.handleDeleteProvider,
    "/akash.audit.v1beta1.MsgSignProviderAttributes": this.handleSignProviderAttributes,
    "/akash.audit.v1beta1.MsgDeleteProviderAttributes": this.handleDeleteSignProviderAttributes,
    // v1beta2 types
    "/akash.deployment.v1beta2.MsgCreateDeployment": this.handleCreateDeploymentV2,
    "/akash.deployment.v1beta2.MsgCloseDeployment": this.handleCloseDeployment,
    "/akash.market.v1beta2.MsgCreateLease": this.handleCreateLease,
    "/akash.market.v1beta2.MsgCloseLease": this.handleCloseLease,
    "/akash.market.v1beta2.MsgCreateBid": this.handleCreateBidV2,
    "/akash.market.v1beta2.MsgCloseBid": this.handleCloseBid,
    "/akash.deployment.v1beta2.MsgDepositDeployment": this.handleDepositDeployment,
    "/akash.market.v1beta2.MsgWithdrawLease": this.handleWithdrawLease,
    "/akash.provider.v1beta2.MsgCreateProvider": this.handleCreateProvider,
    "/akash.provider.v1beta2.MsgUpdateProvider": this.handleUpdateProvider,
    "/akash.provider.v1beta2.MsgDeleteProvider": this.handleDeleteProvider,
    "/akash.audit.v1beta2.MsgSignProviderAttributes": this.handleSignProviderAttributes,
    "/akash.audit.v1beta2.MsgDeleteProviderAttributes": this.handleDeleteSignProviderAttributes
  };

  private async processMessage(msg, encodedMessage, height: number, blockGroupTransaction) {
    if (!Object.keys(this.messageHandlers).includes(msg.type)) {
      throw Error("No handler for message of type: " + msg.type);
    }

    await benchmark.measureAsync(msg.type, async () => {
      const decodedMessage = decodeAkashType(msg.type, encodedMessage);
      await this.messageHandlers[msg.type].bind(this)(decodedMessage, height, blockGroupTransaction, msg);
    });
  }

  private async handleCreateDeployment(decodedMessage: v1beta1.MsgCreateDeployment, height: number, blockGroupTransaction, msg: Message) {
    const created = await Deployment.create(
      {
        id: uuid.v4(),
        owner: decodedMessage.id.owner,
        dseq: decodedMessage.id.dseq.toNumber(),
        deposit: parseInt(decodedMessage.deposit.amount),
        balance: parseInt(decodedMessage.deposit.amount),
        withdrawnAmount: 0,
        createdHeight: height,
        closedHeight: null
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = created.id;

    addToDeploymentIdCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber(), created.id);

    for (const group of decodedMessage.groups) {
      const createdGroup = await DeploymentGroup.create(
        {
          id: uuid.v4(),
          deploymentId: created.id,
          owner: created.owner,
          dseq: created.dseq,
          gseq: decodedMessage.groups.indexOf(group) + 1
        },
        { transaction: blockGroupTransaction }
      );
      addToDeploymentGroupIdCache(createdGroup.owner, createdGroup.dseq, createdGroup.gseq, createdGroup.id);

      for (const groupResource of group.resources) {
        await DeploymentGroupResource.create(
          {
            deploymentGroupId: createdGroup.id,
            cpuUnits: parseInt(uint8arrayToString(groupResource.resources.cpu.units.val)),
            memoryQuantity: parseInt(uint8arrayToString(groupResource.resources.memory.quantity.val)),
            storageQuantity: parseInt(uint8arrayToString(groupResource.resources.storage.quantity.val)),
            count: groupResource.count,
            price: parseFloat(groupResource.price.amount) // TODO: handle denom
          },
          { transaction: blockGroupTransaction }
        );
      }
    }
  }

  private async handleCreateDeploymentV2(decodedMessage: v1beta2.MsgCreateDeployment, height: number, blockGroupTransaction, msg: Message) {
    const created = await Deployment.create(
      {
        id: uuid.v4(),
        owner: decodedMessage.id.owner,
        dseq: decodedMessage.id.dseq.toNumber(),
        deposit: parseInt(decodedMessage.deposit.amount),
        balance: parseInt(decodedMessage.deposit.amount),
        withdrawnAmount: 0,
        createdHeight: height,
        closedHeight: null
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = created.id;

    addToDeploymentIdCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber(), created.id);

    for (const group of decodedMessage.groups) {
      const createdGroup = await DeploymentGroup.create(
        {
          id: uuid.v4(),
          deploymentId: created.id,
          owner: created.owner,
          dseq: created.dseq,
          gseq: decodedMessage.groups.indexOf(group) + 1
        },
        { transaction: blockGroupTransaction }
      );
      addToDeploymentGroupIdCache(createdGroup.owner, createdGroup.dseq, createdGroup.gseq, createdGroup.id);

      for (const groupResource of group.resources) {
        await DeploymentGroupResource.create(
          {
            deploymentGroupId: createdGroup.id,
            cpuUnits: parseInt(uint8arrayToString(groupResource.resources.cpu.units.val)),
            memoryQuantity: parseInt(uint8arrayToString(groupResource.resources.memory.quantity.val)),
            storageQuantity: groupResource.resources.storage.map((x) => parseInt(uint8arrayToString(x.quantity.val))).reduce((a, b) => a + b, 0),
            count: groupResource.count,
            price: parseFloat(groupResource.price.amount) // TODO: handle denom
          },
          { transaction: blockGroupTransaction }
        );
      }
    }
  }

  private async handleCloseDeployment(decodedMessage: v1beta1.MsgCloseDeployment, height: number, blockGroupTransaction, msg: Message) {
    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber())
      },
      include: [{ model: Lease }],
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = deployment.id;

    await accountSettle(deployment, height, blockGroupTransaction);

    for (const lease of deployment.leases) {
      if (!lease.closedHeight) {
        lease.closedHeight = height;
        await lease.save({ transaction: blockGroupTransaction });
      }
    }

    deployment.closedHeight = height;
    await deployment.save({ transaction: blockGroupTransaction });
  }

  private async handleCreateLease(decodedMessage: v1beta1.MsgCreateLease, height: number, blockGroupTransaction, msg: Message) {
    const bid = await Bid.findOne({
      where: {
        owner: decodedMessage.bidId.owner,
        dseq: decodedMessage.bidId.dseq.toNumber(),
        gseq: decodedMessage.bidId.gseq,
        oseq: decodedMessage.bidId.oseq,
        provider: decodedMessage.bidId.provider
      },
      transaction: blockGroupTransaction
    });

    const deploymentGroupId = getDeploymentGroupIdFromCache(decodedMessage.bidId.owner, decodedMessage.bidId.dseq.toNumber(), decodedMessage.bidId.gseq);
    const deploymentGroups = await DeploymentGroupResource.findAll({
      attributes: ["count", "cpuUnits", "memoryQuantity", "storageQuantity"],
      where: {
        deploymentGroupId: deploymentGroupId
      },
      transaction: blockGroupTransaction
    });

    const deploymentId = getDeploymentIdFromCache(decodedMessage.bidId.owner, decodedMessage.bidId.dseq.toNumber());

    const deployment = await Deployment.findOne({
      where: {
        id: deploymentId
      },
      include: [{ model: Lease }],
      transaction: blockGroupTransaction
    });

    const { blockRate } = await accountSettle(deployment, height, blockGroupTransaction);

    const predictedClosedHeight = Math.ceil(height + deployment.balance / (blockRate + bid.price));

    await Lease.create(
      {
        id: uuid.v4(),
        deploymentId: deploymentId,
        deploymentGroupId: deploymentGroupId,
        owner: decodedMessage.bidId.owner,
        dseq: decodedMessage.bidId.dseq.toNumber(),
        oseq: decodedMessage.bidId.oseq,
        gseq: decodedMessage.bidId.gseq,
        providerAddress: decodedMessage.bidId.provider,
        createdHeight: height,
        predictedClosedHeight: predictedClosedHeight,
        price: bid.price,

        // Stats
        cpuUnits: deploymentGroups.map((x) => x.cpuUnits * x.count).reduce((a, b) => a + b, 0),
        memoryQuantity: deploymentGroups.map((x) => x.memoryQuantity * x.count).reduce((a, b) => a + b, 0),
        storageQuantity: deploymentGroups.map((x) => x.storageQuantity * x.count).reduce((a, b) => a + b, 0)
      },
      { transaction: blockGroupTransaction }
    );

    await Lease.update({ predictedClosedHeight: predictedClosedHeight }, { where: { deploymentId: deploymentId }, transaction: blockGroupTransaction });

    msg.relatedDeploymentId = deploymentId;

    this.totalLeaseCount++;
  }

  private async handleCloseLease(decodedMessage: v1beta1.MsgCloseLease, height: number, blockGroupTransaction, msg: Message) {
    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.leaseId.owner, decodedMessage.leaseId.dseq.toNumber())
      },
      include: [{ model: Lease }],
      transaction: blockGroupTransaction
    });

    const lease = deployment.leases.find(
      (x) => x.oseq === decodedMessage.leaseId.oseq && x.gseq === decodedMessage.leaseId.gseq && x.providerAddress === decodedMessage.leaseId.provider
    );

    if (!lease) throw new Error("Lease not found");

    msg.relatedDeploymentId = deployment.id;

    const { blockRate } = await accountSettle(deployment, height, blockGroupTransaction);

    lease.closedHeight = height;
    await lease.save({ transaction: blockGroupTransaction });

    if (!deployment.leases.some((x) => !x.closedHeight)) {
      deployment.closedHeight = height;
      await deployment.save({ transaction: blockGroupTransaction });
    } else {
      const predictedClosedHeight = deployment.balance / (blockRate - lease.price);
      await Lease.update({ predictedClosedHeight: predictedClosedHeight }, { where: { deploymentId: deployment.id }, transaction: blockGroupTransaction });
    }
  }

  private async handleCreateBid(decodedMessage: v1beta1.MsgCreateBid, height: number, blockGroupTransaction, msg: Message) {
    await Bid.create(
      {
        owner: decodedMessage.order.owner,
        dseq: decodedMessage.order.dseq.toNumber(),
        gseq: decodedMessage.order.gseq,
        oseq: decodedMessage.order.oseq,
        provider: decodedMessage.provider,
        price: parseInt(decodedMessage.price.amount),
        createdHeight: height
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = getDeploymentIdFromCache(decodedMessage.order.owner, decodedMessage.order.dseq.toNumber());
  }

  private async handleCreateBidV2(decodedMessage: v1beta2.MsgCreateBid, height: number, blockGroupTransaction, msg: Message) {
    await Bid.create(
      {
        owner: decodedMessage.order.owner,
        dseq: decodedMessage.order.dseq.toNumber(),
        gseq: decodedMessage.order.gseq,
        oseq: decodedMessage.order.oseq,
        provider: decodedMessage.provider,
        price: parseFloat(decodedMessage.price.amount),
        createdHeight: height
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = getDeploymentIdFromCache(decodedMessage.order.owner, decodedMessage.order.dseq.toNumber());
  }

  private async handleCloseBid(decodedMessage: v1beta1.MsgCloseBid, height: number, blockGroupTransaction, msg: Message) {
    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.bidId.owner, decodedMessage.bidId.dseq.toNumber())
      },
      include: [{ model: Lease }],
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = deployment.id;

    const lease = deployment.leases.find(
      (x) => x.oseq === decodedMessage.bidId.oseq && x.gseq === decodedMessage.bidId.gseq && x.providerAddress === decodedMessage.bidId.provider
    );

    if (lease) {
      const { blockRate } = await accountSettle(deployment, height, blockGroupTransaction);

      lease.closedHeight = height;
      await lease.save({ transaction: blockGroupTransaction });

      if (!deployment.leases.some((x) => !x.closedHeight)) {
        deployment.closedHeight = height;
        await deployment.save({ transaction: blockGroupTransaction });
      } else {
        const predictedClosedHeight = deployment.balance / (blockRate - lease.price);
        await Lease.update({ predictedClosedHeight: predictedClosedHeight }, { where: { deploymentId: deployment.id }, transaction: blockGroupTransaction });
      }
    }

    await Bid.destroy({
      where: {
        owner: decodedMessage.bidId.owner,
        dseq: decodedMessage.bidId.dseq.toNumber(),
        gseq: decodedMessage.bidId.gseq,
        oseq: decodedMessage.bidId.oseq,
        provider: decodedMessage.bidId.provider
      },
      transaction: blockGroupTransaction
    });
  }

  private async handleDepositDeployment(decodedMessage: v1beta1.MsgDepositDeployment, height: number, blockGroupTransaction, msg: Message) {
    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber())
      },
      include: [
        {
          model: Lease
        }
      ],
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = deployment.id;

    deployment.deposit += parseFloat(decodedMessage.amount.amount);
    deployment.balance += parseFloat(decodedMessage.amount.amount);
    await deployment.save({ transaction: blockGroupTransaction });

    const blockRate = deployment.leases
      .filter((x) => !x.closedHeight)
      .map((x) => x.price)
      .reduce((a, b) => a + b, 0);

    for (const lease of deployment.leases) {
      lease.predictedClosedHeight = Math.ceil((deployment.lastWithdrawHeight || lease.createdHeight) + deployment.balance / blockRate);
      await lease.save({ transaction: blockGroupTransaction });
    }
  }

  private async handleWithdrawLease(decodedMessage: v1beta1.MsgWithdrawLease, height: number, blockGroupTransaction, msg: Message) {
    const owner = decodedMessage.bidId.owner;
    const dseq = decodedMessage.bidId.dseq.toNumber();
    const gseq = decodedMessage.bidId.gseq;
    const oseq = decodedMessage.bidId.oseq;
    const provider = decodedMessage.bidId.provider;

    const deployment = await Deployment.findOne({
      where: {
        owner: owner,
        dseq: dseq
      },
      include: [{ model: Lease }],
      transaction: blockGroupTransaction
    });

    if (!deployment) throw new Error(`Deployment not found for owner: ${owner} and dseq: ${dseq}`);

    const lease = deployment.leases.find((x) => x.gseq === gseq && x.oseq === oseq && x.providerAddress === provider);

    if (!lease) throw new Error(`Lease not found for gseq: ${gseq}, oseq: ${oseq} and provider: ${provider}`);

    await accountSettle(deployment, height, blockGroupTransaction);

    msg.relatedDeploymentId = deployment.id;
  }

  private async handleCreateProvider(decodedMessage: v1beta1.MsgCreateProvider, height: number, blockGroupTransaction, msg: Message) {
    await Provider.create(
      {
        owner: decodedMessage.owner,
        hostUri: decodedMessage.hostUri,
        createdHeight: height,
        email: decodedMessage.info?.email,
        website: decodedMessage.info?.website
      },
      { transaction: blockGroupTransaction }
    );

    await ProviderAttribute.bulkCreate(
      decodedMessage.attributes.map((attribute) => ({
        provider: decodedMessage.owner,
        key: attribute.key,
        value: attribute.value
      })),
      { transaction: blockGroupTransaction }
    );

    this.activeProviderCount++;
  }

  private async handleUpdateProvider(decodedMessage: v1beta1.MsgUpdateProvider, height: number, blockGroupTransaction, msg: Message) {
    await Provider.update(
      {
        hostUri: decodedMessage.hostUri,
        createdHeight: height,
        email: decodedMessage.info?.email,
        website: decodedMessage.info?.website
      },
      {
        where: {
          owner: decodedMessage.owner
        },
        transaction: blockGroupTransaction
      }
    );

    await ProviderAttribute.destroy({
      where: {
        provider: decodedMessage.owner
      },
      transaction: blockGroupTransaction
    });
    await ProviderAttribute.bulkCreate(
      decodedMessage.attributes.map((attribute) => ({
        provider: decodedMessage.owner,
        key: attribute.key,
        value: attribute.value
      })),
      { transaction: blockGroupTransaction }
    );
  }

  private async handleDeleteProvider(decodedMessage: v1beta1.MsgDeleteProvider, height: number, blockGroupTransaction, msg: Message) {
    await Provider.update(
      {
        deletedHeight: height
      },
      {
        where: { owner: decodedMessage.owner },
        transaction: blockGroupTransaction
      }
    );

    this.activeProviderCount--;
  }

  private async handleSignProviderAttributes(decodedMessage: v1beta1.MsgSignProviderAttributes, height: number, blockGroupTransaction, msg: Message) {
    const provider = await Provider.findOne({ where: { owner: decodedMessage.owner }, transaction: blockGroupTransaction });

    if (!provider) {
      console.warn(`Provider ${decodedMessage.owner} not found`);
      return;
    }

    for (const attribute of decodedMessage.attributes) {
      const existingAttributeSignature = await ProviderAttributeSignature.findOne({
        where: {
          provider: decodedMessage.owner,
          auditor: decodedMessage.auditor,
          key: attribute.key
        },
        transaction: blockGroupTransaction
      });

      if (existingAttributeSignature) {
        await existingAttributeSignature.update(
          {
            value: attribute.value
          },
          { transaction: blockGroupTransaction }
        );
      } else {
        await ProviderAttributeSignature.create(
          {
            provider: decodedMessage.owner,
            auditor: decodedMessage.auditor,
            key: attribute.key,
            value: attribute.value
          },
          { transaction: blockGroupTransaction }
        );
      }
    }
  }

  private async handleDeleteSignProviderAttributes(decodedMessage: v1beta1.MsgDeleteProviderAttributes, height: number, blockGroupTransaction, msg: Message) {
    await ProviderAttributeSignature.destroy({
      where: {
        provider: decodedMessage.owner,
        auditor: decodedMessage.auditor,
        key: { [Op.in]: decodedMessage.keys }
      },
      transaction: blockGroupTransaction
    });
  }
}

export const statsProcessor = new StatsProcessor();
