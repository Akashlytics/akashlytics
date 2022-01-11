const base64js = require("base64-js");
const {
  MsgCreateDeployment,
  MsgCloseDeployment,
  MsgCreateLease,
  MsgCloseLease,
  MsgCreateBid,
  MsgCloseBid,
  MsgDepositDeployment,
  MsgWithdrawLease
} = require("./ProtoAkashTypes");
const uuid = require("uuid");
const sha256 = require("js-sha256");
const { performance } = require("perf_hooks");
import { blocksDb, txsDb } from "@src/akash/dataStore";
import { Deployment, Transaction, Message, Block, Bid, Lease, Op, DeploymentGroup, DeploymentGroupResource, sequelize } from "@src/db/schema";
import { AuthInfo, TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

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

export async function rebuildStatsTables() {
  await Bid.drop();
  await Lease.drop();
  await DeploymentGroupResource.drop();
  await DeploymentGroup.drop();
  await Deployment.drop();
  await Deployment.sync({ force: true });
  await DeploymentGroup.sync({ force: true });
  await DeploymentGroupResource.sync({ force: true });
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

  await processMessages();
}

let totalLeaseCount = 0;
export async function processMessages() {
  processingStatus = "Processing messages";
  console.time("processMessages");

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
  totalLeaseCount = await Lease.count();

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

  messageTimes["stats"] = [];

  let firstBlockToProcess = firstUnprocessedHeight;
  let lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize);
  while (firstBlockToProcess <= lastUnprocessedHeight) {
    console.log(`Loading blocks ${firstBlockToProcess} to ${lastBlockToProcess}`);

    const blocks = await Block.findAll({
      attributes: ["height", "datetime"],
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

    let processedMessageCount = 0;

    const blockGroupTransaction = await sequelize.transaction();
    try {
      for (const block of blocks) {
        const blockData = await getBlockByHeight(block.height);
        console.log(`Processing block ${block.height} / ${lastUnprocessedHeight}`);

        for (const transaction of block.transactions) {
          for (let msg of transaction.messages) {
            processingStatus = `Processing message ${msg.indexInBlock} of block #${block.height}`;

            console.log(`Processing message ${msg.type} - Block #${block.height}`);

            const tx = blockData.block.data.txs.find((t) => sha256(Buffer.from(t, "base64")).toUpperCase() === transaction.hash);
            let encodedMessage = decodeTxRaw(fromBase64(tx)).body.messages[msg.index].value;

            await processMessage(msg, encodedMessage, block.height, block.datetime, blockGroupTransaction);

            if (msg.relatedDeploymentId) {
              await msg.save({ transaction: blockGroupTransaction });
            }

            processedMessageCount++;
          }

          await transaction.update(
            {
              isProcessed: true
            },
            { transaction: blockGroupTransaction }
          );
        }

        const statsA = performance.now();
        const totalResources = await getTotalResources(blockGroupTransaction, block.height);
        await block.update(
          {
            isProcessed: true,
            activeLeaseCount: totalResources.count,
            totalLeaseCount: totalLeaseCount,
            activeCPU: totalResources.cpuSum,
            activeMemory: totalResources.memorySum,
            activeStorage: totalResources.storageSum,
            totalUAktSpent: (previousProcessedBlock?.totalUAktSpent || 0) + totalResources.priceSum
          },
          { transaction: blockGroupTransaction }
        );
        previousProcessedBlock = block;

        messageTimes["stats"].push(performance.now() - statsA);
      }

      blockGroupTransaction.commit();
    } catch (err) {
      blockGroupTransaction.rollback();
      throw err;
    }

    firstBlockToProcess += groupSize;
    lastBlockToProcess = Math.min(lastUnprocessedHeight, firstBlockToProcess + groupSize);
  }

  processingStatus = null;
  console.timeEnd("processMessages");

  const all = Object.values(messageTimes)
    .map((x) => x.reduce((a, b) => a + b, 0))
    .reduce((a, b) => a + b, 0);

  console.table(
    Object.keys(messageTimes)
      .map((key) => {
        const total = Math.round(messageTimes[key].reduce((a, b) => a + b, 0));
        return {
          type: key,
          count: messageTimes[key].length,
          total: total + "ms",
          percentage: Math.round((total / all) * 100),
          average: Math.round((total / messageTimes[key].length) * 100) / 100 + "ms"
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
  );
}

async function getTotalResources(blockGroupTransaction, height) {
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

let messageTimes = [];

async function processMessage(msg, encodedMessage, height, time, blockGroupTransaction) {
  let a = performance.now();

  if (msg.type === "/akash.deployment.v1beta1.MsgCreateDeployment") {
    await handleCreateDeployment(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.deployment.v1beta1.MsgCloseDeployment") {
    await handleCloseDeployment(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.market.v1beta1.MsgCreateLease") {
    await handleCreateLease(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.market.v1beta1.MsgCloseLease") {
    await handleCloseLease(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.market.v1beta1.MsgCreateBid") {
    await handleCreateBid(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.market.v1beta1.MsgCloseBid") {
    await handleCloseBid(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.deployment.v1beta1.MsgDepositDeployment") {
    await handleDepositDeployment(encodedMessage, height, time, blockGroupTransaction, msg);
  } else if (msg.type === "/akash.market.v1beta1.MsgWithdrawLease") {
    await handleWithdrawLease(encodedMessage, height, time, blockGroupTransaction, msg);
  }

  await msg.update(
    {
      isProcessed: true
    },
    { transaction: blockGroupTransaction }
  );

  let processingTime = performance.now() - a;
  if (!messageTimes[msg.type]) {
    messageTimes[msg.type] = [];
  }
  messageTimes[msg.type].push(processingTime);
}

async function handleCreateDeployment(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
  const decodedMessage = MsgCreateDeployment.decode(encodedMessage);

  const created = await Deployment.create(
    {
      id: uuid.v4(),
      owner: decodedMessage.id.owner,
      dseq: decodedMessage.id.dseq.toNumber(),
      deposit: parseInt(decodedMessage.deposit.amount),
      balance: parseInt(decodedMessage.deposit.amount),
      startDate: time,
      createdHeight: height,
      datetime: time,
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
          price: parseInt(groupResource.price.amount) // TODO: handle denom
        },
        { transaction: blockGroupTransaction }
      );
    }
  }
}

async function handleCloseDeployment(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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

async function handleCreateLease(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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
      startDate: time,
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

  totalLeaseCount++;
}

async function handleCloseLease(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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

async function handleCreateBid(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
  const decodedMessage = MsgCreateBid.decode(encodedMessage);

  await Bid.create(
    {
      owner: decodedMessage.order_id.owner,
      dseq: decodedMessage.order_id.dseq.toNumber(),
      gseq: decodedMessage.order_id.gseq,
      oseq: decodedMessage.order_id.oseq,
      provider: decodedMessage.provider,
      price: parseInt(decodedMessage.price.amount),
      state: "-",
      datetime: time
    },
    { transaction: blockGroupTransaction }
  );

  msg.relatedDeploymentId = getDeploymentIdFromCache(decodedMessage.order_id.owner, decodedMessage.order_id.dseq.toNumber());
}

async function handleCloseBid(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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

async function handleDepositDeployment(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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

async function handleWithdrawLease(encodedMessage, height, time, blockGroupTransaction, msg: Message) {
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

  if (lease.deployment.balance == 0) {
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
