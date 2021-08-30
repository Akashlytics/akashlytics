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
import { blocksDb, txsDb } from "@src/akash/dataStore";
import { Deployment, Transaction, Message, Block, Bid, Lease, Op, Sequelize } from "@src/db/schema";
const { performance } = require("perf_hooks");

import { AuthInfo, TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
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
  await Deployment.drop();
  await Deployment.sync({ force: true });
  await Lease.sync({ force: true });
  await Bid.sync({ force: true });
  await Message.update(
    {
      isProcessed: false
    },
    { where: {} }
  );

  await processMessages();
}

export async function processMessages() {
  console.time("processMessages");

  console.log("Fetching deployment id cache...");

  const existingDeployments = await Deployment.findAll({
    attributes: ["id", "owner", "dseq"]
  });
  deploymentIdCache = [];
  existingDeployments.forEach((d) => addToDeploymentIdCache(d.owner, d.dseq, d.id));

  console.log("Querying unprocessed messages...");

  const latestHeight: number = await Block.max("height");

  const messages = await Message.findAll({
    attributes: ["id", "type", "index"],
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

  let processedMessageCount = 0;

  for (let msg of messages) {
    const height = msg.transaction.height;
    const time = msg.transaction.block.datetime;
    const blockData = await getBlockByHeight(msg.transaction.height);

    const tx = blockData.block.data.txs.find((t) => sha256(Buffer.from(t, "base64")).toUpperCase() === msg.transaction.hash);
    let encodedMessage = decodeTxRaw(fromBase64(tx)).body.messages[msg.index].value;

    await processMessage(msg, encodedMessage, height, time);

    processedMessageCount++;
    const progress = ((processedMessageCount * 100) / messages.length).toFixed(2);
    console.log(`Processing message ${processedMessageCount} / ${messages.length} (${progress}%)  -  Block #${height} - ${msg.type}`);
  }

  const totalDeployment = await Deployment.count({
    distinct: true,
    include: {
      model: Lease,
      required: true
    }
  });

  const activeDeployment = await Deployment.findAll({
    include: {
      model: Lease,
      required: true,
      attributes: [],
      where: {
        closedHeight: { [Op.is]: null }
      }
    }
  });
  let ids = activeDeployment.map((x) => x.id);
  ids.filter(function (item, pos) {
    return ids.indexOf(item) == pos;
  });

  const latestDeployment = await Deployment.max("startDate");
  const totalLeases = await Lease.count();
  const activeLeases = await Lease.findAll({
    where: {
      endDate: {
        [Op.is]: null
      }
    }
  });

  const allDeployments = await Deployment.findAll({
    include: {
      model: Lease,
      required: true
    }
  });
  let sumUAkt = 0;
  for (let d of allDeployments) {
    let deploymentSum = 0;
    for (let l of d.leases) {
      const endBlock = l.closedHeight || latestHeight;
      const qty = endBlock - l.createdHeight;
      const calculated = qty * l.price;
      deploymentSum += calculated;
    }
    const calculatedCapped = Math.min(deploymentSum, d.deposit);
    
    sumUAkt += calculatedCapped;
  }

  console.table([
    {
      totalDeployment,
      activeDeployment: ids.length,
      latestDeployment,
      totalLeases,
      activeLeases: activeLeases.length,
      sumUAkt,
      sumAkt: sumUAkt / 1000000
    }
  ]);

  console.timeEnd("processMessages");
}

//let messageTimes = [];

async function processMessage(msg, encodedMessage, height, time) {
  //let a = performance.now();
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

  // let processingTime = performance.now() - a;
  // if (!messageTimes[msg.type]) {
  //   messageTimes[msg.type] = [];
  // }
  // messageTimes[msg.type].push(processingTime);

  await msg.update({
    isProcessed: true
  });
}

async function handleCreateDeployment(encodedMessage, height, time) {
  const decodedMessage = MsgCreateDeployment.decode(encodedMessage);

  try {
    const created = await Deployment.create({
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
    });

    addToDeploymentIdCache(decodedMessage.id.owner, decodedMessage.id.dseq.toNumber(), created.id);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function handleCloseDeployment(encodedMessage, height, time) {
  const decodedMessage = MsgCloseDeployment.decode(encodedMessage);

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
      await lease.save();
    }

    await deployment.save(); // TODO: Save closed date/height
  } catch (err) {
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

  await Lease.create({
    id: uuid.v4(),
    deploymentId: getDeploymentIdFromCache(decodedMessage.bid_id.owner, decodedMessage.bid_id.dseq.toNumber()),
    owner: decodedMessage.bid_id.owner,
    dseq: decodedMessage.bid_id.dseq.toNumber(),
    oseq: decodedMessage.bid_id.oseq,
    gseq: decodedMessage.bid_id.gseq,
    provider: decodedMessage.bid_id.provider,
    startDate: time,
    createdHeight: height,
    state: "-", // TODO
    price: bid.price
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
  await deployment.save();
}

async function handleWithdrawLease(encodedMessage, height, time) {
  const decodedMessage = MsgWithdrawLease.decode(encodedMessage);

  let lease = await Lease.findOne({
    attributes: ["id", "owner", "dseq", "price", "lastWithdrawHeight", "createdHeight", "withdrawnAmount"],
    where: {
      owner: decodedMessage.lease_id.owner,
      dseq: decodedMessage.lease_id.dseq.toNumber(),
      gseq: decodedMessage.lease_id.gseq,
      oseq: decodedMessage.lease_id.oseq
    },
    include: {
      model: Deployment,
      attributes: ["id", "balance"]
    }
  });

  const startBlock = lease.lastWithdrawHeight || lease.createdHeight;
  const blockCount = height - startBlock;
  const amount = Math.min(lease.price * blockCount, lease.deployment.balance);
  lease.withdrawnAmount += amount;
  lease.lastWithdrawHeight = height;
  lease.deployment.balance -= amount;
  await lease.save();

  //console.table([{ startBlock, blockCount, amount, price: lease.price, balance: lease.deployment.balance }]);

  if (lease.deployment.balance == 0) {
    await Lease.update(
      {
        closedHeight: height
      },
      {
        where: {
          deploymentId: getDeploymentIdFromCache(lease.owner, lease.dseq)
        }
      }
    );

    //lease.deployment.closedHeight = height;
  }

  await lease.deployment.save();
}
