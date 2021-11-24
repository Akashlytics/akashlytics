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
const { PerformanceObserver, performance } = require("perf_hooks");
import { blocksDb, txsDb } from "@src/akash/dataStore";
import { Deployment, Transaction, Message, Block, Bid, Lease, Op, BlockStatistic, DeploymentGroup, DeploymentGroupResource, sequelize } from "@src/db/schema";
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

async function getTx(txHash) {
  try {
    const tx = await txsDb.get(txHash);
    return JSON.parse(tx);
  } catch (err) {
    if (!err.notFound) throw err;

    return null;
  }
}

async function tryAndLog(fn, obj) {
  try {
    await fn();
  } catch (err) {
    console.log(obj);
    throw err;
  }
}

export async function rebuildStatsTables() {
  await Bid.drop();
  await Lease.drop();
  await DeploymentGroupResource.drop();
  await DeploymentGroup.drop();
  await Deployment.drop();
  await BlockStatistic.drop();
  await BlockStatistic.sync({ force: true });
  await Deployment.sync({ force: true });
  await DeploymentGroup.sync({ force: true });
  await DeploymentGroupResource.sync({ force: true });
  await Lease.sync({ force: true });
  await Bid.sync({ force: true });

  // console.log('Setting "isProcessed" to false');
  await Message.update(
    {
      isProcessed: false
    },
    { where: {} }
  );

  await processMessages();
}

const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);

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

  const latestHeight: number = await Block.max("height");

  const messages = await Message.findAll({
    attributes: ["id", "type", "index", "indexInBlock"],
    where: {
      isInterestingType: true,
      isProcessed: false
    },
    include: [
      {
        model: Transaction,
        attributes: ["hash", "height"],
        where: {
          hasProcessingError: false,
          hasDownloadError: false
        },
        include: [
          {
            model: Block,
            attributes: ["datetime"]
          }
        ]
      }
    ],
    order: [
      [Transaction, "height", "ASC"],
      [Transaction, "index", "ASC"],
      ["index", "ASC"]
    ]
  });

  console.log("Found " + messages.length + " messages");

  let latestStatsHeight = 0;
  let previousBlockStats: BlockStatistic =
    (await BlockStatistic.findOne({
      order: [["height", "DESC"]]
    })) || BlockStatistic.build({ activeLeaseCount: 0, totalLeaseCount: 0, totalUAktSpent: 0 });
  let processedMessageCount = 0;
  messageTimes["stats"] = [];
  messageTimes["statsA"] = [];
  messageTimes["statsB"] = [];
  messageTimes["statsC"] = [];
  messageTimes["statsInsert"] = [];
  messageTimes["statsSave"] = [];

  const groupedMessages = groupBy(messages, (x) => x.transaction.height);

  if (previousBlockStats.height > Object.values(groupedMessages)[0][0].transaction.height) {
    throw "Invalid block stats";
  }

  let shouldStop = false;
  for (const height of Object.keys(groupedMessages)) {
    for (let msg of groupedMessages[height]) {
      //const height = msg.transaction.height;
      const time = msg.transaction.block.datetime;

      processingStatus = `Processing message ${msg.index} of block #${height}`;
      //console.log(processingStatus);

      const progress = ((processedMessageCount * 100) / messages.length).toFixed(2);
      console.log(`Processing message ${processedMessageCount} / ${messages.length} (${progress}%)  -  Block #${height} - ${msg.type}`);

      const blockData = await getBlockByHeight(msg.transaction.height);

      const tx = blockData.block.data.txs.find((t) => sha256(Buffer.from(t, "base64")).toUpperCase() === msg.transaction.hash);
      let encodedMessage = decodeTxRaw(fromBase64(tx)).body.messages[msg.index].value;

      await processMessage(msg, encodedMessage, height, time);

      processedMessageCount++;
      //console.log(`Processing message ${processedMessageCount} / ${messages.length} (${progress}%)  -  Block #${height} - ${msg.type}`);
    }

    //console.time("compute");
    const timeA = performance.now();
    const activeLeaseCount = await Lease.count({ where: { closedHeight: { [Op.is]: null } } });
    const timeB = performance.now();
    const totalLeaseCount = await Lease.count();
    const timeC = performance.now();
    const totalResources = await getTotalResources();
    const timeD = performance.now();
    const blockStats = await BlockStatistic.create({
      height: height,
      activeLeaseCount: activeLeaseCount,
      totalLeaseCount: totalLeaseCount,
      activeCPU: totalResources.cpuSum,
      activeMemory: totalResources.memorySum,
      activeStorage: totalResources.storageSum,
      totalUAktSpent: previousBlockStats.totalUAktSpent + totalResources.priceSum
    });
    previousBlockStats = blockStats;
    const timeE = performance.now();
    blockStats.totalUAktSpent += 10;
    blockStats.save();
    const timeF = performance.now();

    messageTimes["stats"].push(timeF - timeA);
    messageTimes["statsA"].push(timeB - timeA);
    messageTimes["statsB"].push(timeC - timeB);
    messageTimes["statsC"].push(timeD - timeC);
    messageTimes["statsInsert"].push(timeE - timeD);
    messageTimes["statsSave"].push(timeF - timeE);

    if (processedMessageCount > 2000) break;
    //console.timeEnd("compute");
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

async function getTotalResources() {
  const totalResources = await Lease.findAll({
    attributes: ["cpuUnits", "memoryQuantity", "storageQuantity", "price"],
    where: {
      closedHeight: { [Op.is]: null }
    }
  });

  //console.log(JSON.stringify(totalResources, null, 2));
  //if(totalResources.length > 0)throw "stop";

  return {
    cpuSum: totalResources.map((x) => x.cpuUnits).reduce((a, b) => a + b, 0),
    memorySum: totalResources.map((x) => x.memoryQuantity).reduce((a, b) => a + b, 0),
    storageSum: totalResources.map((x) => x.storageQuantity).reduce((a, b) => a + b, 0),
    priceSum: totalResources.map((x) => x.price).reduce((a, b) => a + b, 0)
  };
}

let messageTimes = [];

async function processMessage(msg, encodedMessage, height, time) {
  let a = performance.now();

  if (msg.type === "/akash.deployment.v1beta1.MsgCreateDeployment") {
    await handleCreateDeployment(encodedMessage, height, time);
  } else if (msg.type === "/akash.deployment.v1beta1.MsgCloseDeployment") {
    await handleCloseDeployment(encodedMessage, height, time);
  } else if (msg.type === "/akash.market.v1beta1.MsgCreateLease") {
    await handleCreateLease(encodedMessage, height, time);
  } else if (msg.type === "/akash.market.v1beta1.MsgCloseLease") {
    await handleCloseLease(encodedMessage, height, time);
  } else if (msg.type === "/akash.market.v1beta1.MsgCreateBid") {
    await handleCreateBid(encodedMessage, height, time);
  } else if (msg.type === "/akash.market.v1beta1.MsgCloseBid") {
    await handleCloseBid(encodedMessage, height, time);
  } else if (msg.type === "/akash.deployment.v1beta1.MsgDepositDeployment") {
    await handleDepositDeployment(encodedMessage, height, time);
  } else if (msg.type === "/akash.market.v1beta1.MsgWithdrawLease") {
    await handleWithdrawLease(encodedMessage, height, time);
  }

  let processingTime = performance.now() - a;
  if (!messageTimes[msg.type]) {
    messageTimes[msg.type] = [];
  }
  messageTimes[msg.type].push(processingTime);

  await msg.update({
    isProcessed: true
  });
}

async function handleCreateDeployment(encodedMessage, height, time) {
  const decodedMessage = MsgCreateDeployment.decode(encodedMessage);

  const t = await sequelize.transaction();
  try {
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
      { transaction: t }
    );

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
        { transaction: t }
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
          { transaction: t }
        );
      }
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error(err);
    throw err;
  }
}

async function handleCloseDeployment(encodedMessage, height, time) {
  const decodedMessage = MsgCloseDeployment.decode(encodedMessage);

  const t = await sequelize.transaction();

  try {
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
      ]
    });

    for (let lease of deployment.leases) {
      const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
      const blockCount = height - startBlock;
      const amount = Math.min(lease.price * blockCount, deployment.balance); // TODO : Handle proportional distribution

      lease.withdrawnAmount += amount;
      lease.lastWithdrawHeight = height;
      deployment.balance -= amount;

      lease.endDate = time;
      lease.closedHeight = height;
      await lease.save({ transaction: t });
    }

    await deployment.save({ transaction: t }); // TODO: Save closed date/height
    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error(err);
    throw err;
  }
}

async function handleCreateLease(encodedMessage, height, time) {
  const decodedMessage = MsgCreateLease.decode(encodedMessage);
  const bid = await Bid.findOne({
    where: {
      owner: decodedMessage.bid_id.owner,
      dseq: decodedMessage.bid_id.dseq.toNumber(),
      gseq: decodedMessage.bid_id.gseq,
      oseq: decodedMessage.bid_id.oseq,
      provider: decodedMessage.bid_id.provider
    }
  });

  const deploymentGroupId = getDeploymentGroupIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber(), decodedMessage.bid_id.gseq);
  const deploymentGroups = await DeploymentGroupResource.findAll({
    attributes: ["count", "cpuUnits", "memoryQuantity", "storageQuantity"],
    where: {
      deploymentGroupId: deploymentGroupId
    }
  });

  await Lease.create({
    id: uuid.v4(),
    deploymentId: getDeploymentIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber()),
    deploymentGroupId: deploymentGroupId,
    owner: decodedMessage.bid_id.owner,
    dseq: decodedMessage.bid_id.dseq.toNumber(),
    oseq: decodedMessage.bid_id.oseq,
    gseq: decodedMessage.bid_id.gseq,
    provider: decodedMessage.bid_id.provider,
    startDate: time,
    createdHeight: height,
    price: bid.price,

    // Stats
    cpuUnits: deploymentGroups.map((x) => x.cpuUnits * x.count).reduce((a, b) => a + b, 0),
    memoryQuantity: deploymentGroups.map((x) => x.memoryQuantity * x.count).reduce((a, b) => a + b, 0),
    storageQuantity: deploymentGroups.map((x) => x.storageQuantity * x.count).reduce((a, b) => a + b, 0)
  });
}

async function handleCloseLease(encodedMessage, height, time) {
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
    }
  });

  const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
  const blockCount = height - startBlock;
  const amount = Math.min(lease.price * blockCount, lease.deployment.balance); // TODO : Handle proportional distribution

  lease.withdrawnAmount += amount;
  lease.lastWithdrawHeight = height;
  lease.deployment.balance -= amount;

  lease.endDate = time;
  lease.closedHeight = height;
  await lease.save();
  await lease.deployment.save();
}

async function handleCreateBid(encodedMessage, height, time) {
  const decodedMessage = MsgCreateBid.decode(encodedMessage);

  await Bid.create({
    owner: decodedMessage.order_id.owner,
    dseq: decodedMessage.order_id.dseq.toNumber(),
    gseq: decodedMessage.order_id.gseq,
    oseq: decodedMessage.order_id.oseq,
    provider: decodedMessage.provider,
    price: parseInt(decodedMessage.price.amount),
    state: "-",
    datetime: time
  });
}

async function handleCloseBid(encodedMessage, height, time) {
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
    }
  });

  for (let lease of deployment.leases) {
    const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
    const blockCount = height - startBlock;
    const amount = Math.min(lease.price * blockCount, deployment.balance); // TODO : Handle proportional distribution

    lease.withdrawnAmount += amount;
    lease.lastWithdrawHeight = height;
    deployment.balance -= amount;

    lease.endDate = time;
    lease.closedHeight = height;
    await lease.save();
  }

  await Bid.destroy({
    where: {
      owner: decodedMessage.bid_id.owner,
      dseq: decodedMessage.bid_id.dseq.toNumber(),
      gseq: decodedMessage.bid_id.gseq,
      oseq: decodedMessage.bid_id.oseq,
      provider: decodedMessage.bid_id.provider
    }
  });
}

async function handleDepositDeployment(encodedMessage, height, time) {
  const decodedMessage = MsgDepositDeployment.decode(encodedMessage);

  const deployment = await Deployment.findOne({
    where: {
      id: getDeploymentIdFromCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber())
    },
    include: [
      {
        model: Lease
      }
    ]
  });

  deployment.deposit += parseFloat(decodedMessage.amount.amount);
  deployment.balance += parseFloat(decodedMessage.amount.amount);
  await deployment.save();
}
// messageTimes["withdrawA"] = [];
// messageTimes["withdrawB"] = [];
// messageTimes["withdrawC"] = [];
// messageTimes["withdrawD"] = [];
async function handleWithdrawLease(encodedMessage, height, time) {
  const perfA = performance.now();
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
    }
  });
  //messageTimes["withdrawA"].push(performance.now() - perfA);
  const perfB = performance.now();

  const t = await sequelize.transaction();

  try {
    const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
    const blockCount = height - startBlock;
    const amount = Math.min(lease.price * blockCount, lease.deployment.balance);
    lease.withdrawnAmount += amount;
    lease.lastWithdrawHeight = height;
    lease.deployment.balance -= amount;
    await lease.save({ transaction: t });
    //messageTimes["withdrawB"].push(performance.now() - perfB);
    const perfC = performance.now();

    //console.table([{ startBlock, blockCount, amount, price: lease.price, balance: lease.deployment.balance }]);

    if (lease.deployment.balance == 0) {
      await Lease.update(
        {
          closedHeight: height
        },
        {
          where: {
            deploymentId: getDeploymentIdFromCache(owner, dseq)
          },
          transaction: t
        }
      );
      //messageTimes["withdrawC"].push(performance.now() - perfC);

      //lease.deployment.closedHeight = height;
    }
    const perfD = performance.now();

    await lease.deployment.save({ transaction: t });
    //messageTimes["withdrawD"].push(performance.now() - perfC);
    await t.commit();
  } catch (err) {
    await t.rollback();
  }
}
