const base64js = require("base64-js");
const {
  MsgCreateDeployment,
  MsgCloseDeployment,
  MsgCreateLease,
  MsgCloseLease,
  MsgCreateBid,
  MsgCloseBid,
  MsgDepositDeployment,
  MsgWithdrawLease,
  MsgCreateProvider,
  MsgUpdateProvider,
  MsgDeleteProvider,
  MsgDeleteProviderAttributes,
  MsgSignProviderAttributes
} = require("./ProtoAkashTypes");
import * as v1beta2 from "./ProtoAkashTypes_v1beta2";
const uuid = require("uuid");
const sha256 = require("js-sha256");
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

export let processingStatus = null;

const v3Height = 5629650;

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

    console.log('Setting "isProcessed" to false');
    await Message.update(
      {
        isProcessed: false
      },
      { where: {} }
    );
    await Transaction.update(
      {
        isProcessed: false
      },
      { where: {} }
    );
    await Block.update(
      {
        isProcessed: false
      },
      { where: {} }
    );

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
    let lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize);
    while (firstBlockToProcess <= lastUnprocessedHeight) {
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
      let shouldRefreshPredictedHeights = false;

      try {
        for (const block of blocks) {
          const getBlockByHeightTimer = benchmark.startTimer("getBlockByHeight");
          const blockData = await getBlockByHeight(blockHeightToKey(block.height));
          getBlockByHeightTimer.end();

          for (const transaction of block.transactions) {
            for (let msg of transaction.messages) {
              processingStatus = `Processing message ${msg.indexInBlock} of block #${block.height}`;

              console.log(`Processing message ${msg.type} - Block #${block.height}`);

              shouldRefreshPredictedHeights = shouldRefreshPredictedHeights || this.checkShouldRefreshPredictedCloseHeight(msg);

              const decodeTimer = benchmark.startTimer("decodeTx");
              const tx = blockData.block.data.txs.find((t) => sha256(Buffer.from(t, "base64")).toUpperCase() === transaction.hash);
              const encodedMessage = decodeTxRaw(fromBase64(tx)).body.messages[msg.index].value;
              decodeTimer.end();

              await benchmark.measure("processMessage", async () => {
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
            shouldRefreshPredictedHeights = false;
          }

          if (predictedClosedHeights.includes(block.height)) {
            totalResources = await this.getTotalResources(blockGroupTransaction, firstBlockToProcess);
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
      lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize);
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

  @benchmark.measureMethod
  private checkShouldRefreshPredictedCloseHeight(msg: Message): boolean {
    return [
      "/akash.deployment.v1beta1.MsgCreateDeployment",
      "/akash.deployment.v1beta1.MsgCloseDeployment",
      "/akash.market.v1beta1.MsgCreateLease",
      "/akash.market.v1beta1.MsgCloseLease",
      "/akash.market.v1beta1.MsgCloseBid",
      "/akash.deployment.v1beta1.MsgDepositDeployment",
      "/akash.deployment.v1beta2.MsgCreateDeployment",
      "/akash.deployment.v1beta2.MsgCloseDeployment",
      "/akash.market.v1beta2.MsgCreateLease",
      "/akash.market.v1beta2.MsgCloseLease",
      "/akash.market.v1beta2.MsgCloseBid",
      "/akash.deployment.v1beta2.MsgDepositDeployment"
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

  private async processMessage(msg, encodedMessage, height, blockGroupTransaction) {
    if (!Object.keys(this.messageHandlers).includes(msg.type)) {
      throw Error("No handler for message of type: " + msg.type);
    }

    await benchmark.measureAsync(msg.type, async () => {
      await this.messageHandlers[msg.type](encodedMessage, height, blockGroupTransaction, msg);
    });
  }

  private async handleCreateDeployment(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCreateDeployment.decode(encodedMessage);

    const created = await Deployment.create(
      {
        id: uuid.v4(),
        owner: decodedMessage.id.owner,
        dseq: decodedMessage.id.dseq.toNumber(),
        deposit: parseInt(decodedMessage.deposit.amount),
        balance: parseInt(decodedMessage.deposit.amount),
        createdHeight: height,
        state: "-",
        escrowAccountTransferredAmount: 0
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
            cpuUnits: parseInt(groupResource.resources.cpu.units.val),
            memoryQuantity: parseInt(groupResource.resources.memory.quantity.val),
            storageQuantity: parseInt(groupResource.resources.storage.quantity.val),
            count: groupResource.count,
            price: parseFloat(groupResource.price.amount) // TODO: handle denom
          },
          { transaction: blockGroupTransaction }
        );
      }
    }
  }

  private async handleCreateDeploymentV2(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = v1beta2.MsgCreateDeployment.decode(encodedMessage);

    const created = await Deployment.create(
      {
        id: uuid.v4(),
        owner: decodedMessage.id.owner,
        dseq: decodedMessage.id.dseq.toNumber(),
        deposit: parseInt(decodedMessage.deposit.amount),
        balance: parseInt(decodedMessage.deposit.amount),
        createdHeight: height,
        state: "-",
        escrowAccountTransferredAmount: 0
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
            cpuUnits: parseInt(groupResource.resources.cpu.units.val),
            memoryQuantity: parseInt(groupResource.resources.memory.quantity.val),
            storageQuantity: groupResource.resources.storage.map((x) => parseInt(x.quantity.val)).reduce((a, b) => a + b, 0),
            count: groupResource.count,
            price: parseFloat(groupResource.price.amount) // TODO: handle denom
          },
          { transaction: blockGroupTransaction }
        );
      }
    }
  }

  private async handleCloseDeployment(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCloseDeployment.decode(encodedMessage);

    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber())
      },
      include: [
        {
          model: Lease,
          required: false,
          where: {
            closedHeight: { [Op.is]: null }
          }
        }
      ],
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = deployment.id;

    for (let lease of deployment.leases) {
      const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
      const blockCount = height - startBlock;
      const amount = Math.min(lease.price * blockCount, deployment.balance); // TODO : Handle proportional distribution

      lease.withdrawnAmount += amount;
      lease.lastWithdrawHeight = height;
      deployment.balance -= amount;

      lease.closedHeight = height;
      await lease.save({ transaction: blockGroupTransaction });
    }
  }

  private async handleCreateLease(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCreateLease.decode(encodedMessage);
    const bid = await Bid.findOne({
      where: {
        owner: decodedMessage.bid_id.owner,
        dseq: decodedMessage.bid_id.dseq.toNumber(),
        gseq: decodedMessage.bid_id.gseq,
        oseq: decodedMessage.bid_id.oseq,
        provider: decodedMessage.bid_id.provider
      },
      transaction: blockGroupTransaction
    });

    const deploymentGroupId = getDeploymentGroupIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber(), decodedMessage.bid_id.gseq);
    const deploymentGroups = await DeploymentGroupResource.findAll({
      attributes: ["count", "cpuUnits", "memoryQuantity", "storageQuantity"],
      where: {
        deploymentGroupId: deploymentGroupId
      },
      transaction: blockGroupTransaction
    });

    const deploymentId = getDeploymentIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber());

    const deployment = await Deployment.findOne({
      attributes: ["balance"],
      where: {
        id: deploymentId
      },
      transaction: blockGroupTransaction
    });
    const predictedClosedHeight = Math.ceil(height + deployment.balance / bid.price);

    await Lease.create(
      {
        id: uuid.v4(),
        deploymentId: deploymentId,
        deploymentGroupId: deploymentGroupId,
        owner: decodedMessage.bid_id.owner,
        dseq: decodedMessage.bid_id.dseq.toNumber(),
        oseq: decodedMessage.bid_id.oseq,
        gseq: decodedMessage.bid_id.gseq,
        provider: decodedMessage.bid_id.provider,
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

    msg.relatedDeploymentId = deploymentId;

    this.totalLeaseCount++;
  }

  private async handleCloseLease(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCloseLease.decode(encodedMessage);

    let lease = await Lease.findOne({
      where: {
        deploymentId: getDeploymentIdFromCache(decodedMessage.lease_id.owner, decodedMessage.lease_id.dseq.toNumber()),
        oseq: decodedMessage.lease_id.oseq,
        gseq: decodedMessage.lease_id.gseq,
        provider: decodedMessage.lease_id.provider,
        closedHeight: { [Op.is]: null }
      },
      include: {
        model: Deployment
      },
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = lease.deployment.id;

    const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
    const blockCount = height - startBlock;
    const amount = Math.min(lease.price * blockCount, lease.deployment.balance); // TODO : Handle proportional distribution

    lease.withdrawnAmount += amount;
    lease.lastWithdrawHeight = height;
    lease.deployment.balance -= amount;

    lease.closedHeight = height;
    await lease.save({ transaction: blockGroupTransaction });
    await lease.deployment.save({ transaction: blockGroupTransaction });
  }

  private async handleCreateBid(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCreateBid.decode(encodedMessage);

    await Bid.create(
      {
        owner: decodedMessage.order_id.owner,
        dseq: decodedMessage.order_id.dseq.toNumber(),
        gseq: decodedMessage.order_id.gseq,
        oseq: decodedMessage.order_id.oseq,
        provider: decodedMessage.provider,
        price: parseInt(decodedMessage.price.amount),
        createdHeight: height
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = getDeploymentIdFromCache(decodedMessage.order_id.owner, decodedMessage.order_id.dseq.toNumber());
  }

  private async handleCreateBidV2(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = v1beta2.MsgCreateBid.decode(encodedMessage);

    await Bid.create(
      {
        owner: decodedMessage.order_id.owner,
        dseq: decodedMessage.order_id.dseq.toNumber(),
        gseq: decodedMessage.order_id.gseq,
        oseq: decodedMessage.order_id.oseq,
        provider: decodedMessage.provider,
        price: parseFloat(decodedMessage.price.amount),
        createdHeight: height
      },
      { transaction: blockGroupTransaction }
    );

    msg.relatedDeploymentId = getDeploymentIdFromCache(decodedMessage.order_id.owner, decodedMessage.order_id.dseq.toNumber());
  }

  private async handleCloseBid(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCloseBid.decode(encodedMessage);

    const deployment = await Deployment.findOne({
      where: {
        id: getDeploymentIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber())
      },
      include: {
        model: Lease,
        required: false,
        where: {
          closedHeight: { [Op.is]: null },
          gseq: decodedMessage.bid_id.gseq,
          oseq: decodedMessage.bid_id.oseq,
          provider: decodedMessage.bid_id.provider
        }
      },
      transaction: blockGroupTransaction
    });

    msg.relatedDeploymentId = deployment.id;

    for (let lease of deployment.leases) {
      const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
      const blockCount = height - startBlock;
      const amount = Math.min(lease.price * blockCount, deployment.balance); // TODO : Handle proportional distribution

      lease.withdrawnAmount += amount;
      lease.lastWithdrawHeight = height;
      deployment.balance -= amount;

      lease.closedHeight = height;
      await lease.save({ transaction: blockGroupTransaction });
    }

    await Bid.destroy({
      where: {
        owner: decodedMessage.bid_id.owner,
        dseq: decodedMessage.bid_id.dseq.toNumber(),
        gseq: decodedMessage.bid_id.gseq,
        oseq: decodedMessage.bid_id.oseq,
        provider: decodedMessage.bid_id.provider
      },
      transaction: blockGroupTransaction
    });
  }

  private async handleDepositDeployment(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgDepositDeployment.decode(encodedMessage);

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

    for (const lease of deployment.leases) {
      lease.predictedClosedHeight = Math.ceil((lease.lastWithdrawHeight || lease.createdHeight) + deployment.balance / lease.price);
      await lease.save({ transaction: blockGroupTransaction });
    }
  }

  private async handleWithdrawLease(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgWithdrawLease.decode(encodedMessage);

    const owner = decodedMessage.lease_id.owner;
    const dseq = decodedMessage.lease_id.dseq.toNumber();

    let lease = await Lease.findOne({
      attributes: ["id", "price", "lastWithdrawHeight", "createdHeight", "withdrawnAmount"],
      where: {
        owner: owner,
        dseq: dseq,
        gseq: decodedMessage.lease_id.gseq,
        oseq: decodedMessage.lease_id.oseq
      },
      include: {
        model: Deployment,
        attributes: ["id", "balance"]
      },
      transaction: blockGroupTransaction
    });

    const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
    const blockCount = height - startBlock;
    const amount = Math.min(lease.price * blockCount, lease.deployment.balance);
    lease.withdrawnAmount += amount;
    lease.lastWithdrawHeight = height;
    lease.deployment.balance -= amount;
    await lease.save({ transaction: blockGroupTransaction });

    if (lease.deployment.balance <= 0) {
      await Lease.update(
        {
          closedHeight: height
        },
        {
          where: {
            deploymentId: getDeploymentIdFromCache(owner, dseq)
          },
          transaction: blockGroupTransaction
        }
      );
    }

    await lease.deployment.save({ transaction: blockGroupTransaction });

    msg.relatedDeploymentId = lease.deployment.id;
  }

  private async handleCreateProvider(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgCreateProvider.decode(encodedMessage);

    await Provider.create(
      {
        owner: decodedMessage.owner,
        hostUri: decodedMessage.host_uri,
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

  private async handleUpdateProvider(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgUpdateProvider.decode(encodedMessage);

    await Provider.update(
      {
        hostUri: decodedMessage.host_uri,
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

  private async handleDeleteProvider(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgDeleteProvider.decode(encodedMessage);

    await Provider.destroy({
      where: { owner: decodedMessage.owner },
      transaction: blockGroupTransaction
    });
    await ProviderAttribute.destroy({
      where: {
        provider: decodedMessage.owner
      },
      transaction: blockGroupTransaction
    });
    await ProviderAttributeSignature.destroy({
      where: { provider: decodedMessage.owner },
      transaction: blockGroupTransaction
    });

    this.activeProviderCount--;
  }

  private async handleSignProviderAttributes(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgSignProviderAttributes.decode(encodedMessage);

    const provider = await Provider.findOne({ where: { owner: decodedMessage.owner }, transaction: blockGroupTransaction });

    if (!provider) {
      console.warn(`Provider ${decodedMessage.provider} not found`);
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

  private async handleDeleteSignProviderAttributes(encodedMessage, height, blockGroupTransaction, msg: Message) {
    const decodedMessage = MsgDeleteProviderAttributes.decode(encodedMessage);

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
