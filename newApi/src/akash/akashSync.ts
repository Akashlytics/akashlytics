import fs from "fs";
import base64js from "base64-js";
import { processMessages } from "./statsProcessor";
import { blocksDb, txsDb } from "./dataStore";
import { createNodeAccessor } from "./nodeAccessor";
import { Block, Transaction, Message, Op } from "@src/db/schema";

import * as uuid from "uuid";
import { sha256 } from "js-sha256";
import { isProd } from "@src/shared/constants";

export let isSyncing = false;
export let syncingStatus = null;

const nodeAccessor = createNodeAccessor();

const { AuthInfo, TxBody, TxRaw } = require("cosmjs-types/cosmos/tx/v1beta1/tx");
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

const interestingTypes = [
  "/akash.deployment.v1beta1.MsgCreateDeployment",
  "/akash.deployment.v1beta1.MsgCloseDeployment",
  "/akash.deployment.v1beta1.MsgDepositDeployment",
  "/akash.market.v1beta1.MsgCreateLease",
  "/akash.market.v1beta1.MsgCloseLease",
  "/akash.market.v1beta1.MsgCreateBid",
  "/akash.market.v1beta1.MsgCloseBid",
  "/akash.market.v1beta1.MsgWithdrawLease"
];

async function getCachedBlockByHeight(height) {
  try {
    const content = await blocksDb.get(height);
    return JSON.parse(content);
  } catch (err) {
    if (!err.notFound) throw err;

    return null;
  }
}

async function getCachedTxByHash(hash) {
  try {
    const content = await txsDb.get(hash);
    return JSON.parse(content);
  } catch (err) {
    if (!err.notFound) throw err;

    return null;
  }
}

async function getLatestDownloadedHeight() {
  if (fs.existsSync("./data/latestDownloadedHeight.txt")) {
    const fileContent = await fs.promises.readFile("./data/latestDownloadedHeight.txt", { encoding: "utf-8" });
    return parseInt(fileContent);
  } else {
    return 0;
  }
}

async function saveLatestDownloadedHeight(height) {
  await fs.promises.writeFile("./data/latestDownloadedHeight.txt", height.toString(), { encoding: "utf-8" });
}

async function getLatestDownloadedTxHeight() {
  if (fs.existsSync("./data/latestDownloadedTxHeight.txt")) {
    const fileContent = await fs.promises.readFile("./data/latestDownloadedTxHeight.txt", { encoding: "utf-8" });
    return parseInt(fileContent);
  } else {
    return 0;
  }
}

async function saveLatestDownloadedTxHeight(height) {
  await fs.promises.writeFile("./data/latestDownloadedTxHeight.txt", height.toString(), { encoding: "utf-8" });
}

export async function syncBlocks() {
  try {
    isSyncing = true;
    syncingStatus = "Fetching latest block";

    const latestAvailableBlock = await nodeAccessor.fetch("/blocks/latest");
    const latestAvailableHeight = parseInt(latestAvailableBlock.block.header.height);

    let latestDownloadedHeight = await getLatestDownloadedHeight();

    if (latestDownloadedHeight >= latestAvailableHeight) {
      console.log("Already downloaded all blocks");
    } else {
      const startHeight = latestDownloadedHeight + 1;
      console.log("Starting download at block #" + startHeight);
      console.log("Will end download at block #" + latestAvailableHeight);
      console.log(latestAvailableHeight - startHeight + " blocks to download");

      await downloadBlocks(startHeight, latestAvailableHeight);
    }

    let latestInsertedHeight: number = await Block.max("height") || 0;
    
    await insertBlocks(latestInsertedHeight + 1, latestAvailableHeight);
    await downloadTransactions();

    syncingStatus = "Processing messages";

    await processMessages();
  } catch (err) {
    console.error("Error while syncing", err);
    throw err;
  } finally {
    isSyncing = false;
    syncingStatus = "Done";
  }
}

async function insertBlocks(startHeight, endHeight) {
  const blockCount = endHeight - startHeight;
  console.log("Inserting " + blockCount + " blocks into database");
  syncingStatus = "Inserting blocks";

  let lastInsertedBlock = await Block.findOne({
    order: [["height", "DESC"]]
  });
  let lastInsertedDate = lastInsertedBlock?.datetime ?? new Date(2000, 1, 1);

  let blocksToAdd = [];
  let txsToAdd = [];
  let msgsToAdd = [];

  for (let i = startHeight; i <= endHeight; ++i) {
    syncingStatus = `Inserting block #${i} / ${endHeight}`;
    const blockData = await getCachedBlockByHeight(i);

    if (!blockData) throw "Block # " + i + " was not in cache";

    const blockDatetime = new Date(blockData.block.header.time);
    const blockDate = new Date(Date.UTC(blockDatetime.getUTCFullYear(), blockDatetime.getUTCMonth(), blockDatetime.getUTCDate()));
    const firstBlockOfDay = blockDate > lastInsertedDate;
    if (firstBlockOfDay) {
      lastInsertedDate = blockDate;
    }

    const txs = blockData.block.data.txs;
    for (let txIndex = 0; txIndex < txs.length; ++txIndex) {
      const tx = txs[txIndex];
      const hash = sha256(Buffer.from(tx, "base64")).toUpperCase();
      const txId = uuid.v4();

      let hasInterestingTypes = false;
      let msgs = decodeTxRaw(fromBase64(tx)).body.messages;

      for (let msgIndex = 0; msgIndex < msgs.length; ++msgIndex) {
        const msg = msgs[msgIndex];
        const isInterestingType = interestingTypes.includes(msg.typeUrl);

        msgsToAdd.push({
          id: uuid.v4(),
          txId: txId,
          type: msg.typeUrl,
          index: msgIndex,
          isInterestingType: isInterestingType
        });

        if (isInterestingType) {
          hasInterestingTypes = true;
        }
      }

      txsToAdd.push({
        id: txId,
        hash: hash,
        height: i,
        index: txIndex,
        hasInterestingTypes: hasInterestingTypes
      });
    }

    blocksToAdd.push({
      height: i,
      datetime: new Date(blockData.block.header.time),
      firstBlockOfDay: firstBlockOfDay
    });

    if (blocksToAdd.length >= 1000) {
      await Block.bulkCreate(blocksToAdd);
      await Transaction.bulkCreate(txsToAdd);
      await Message.bulkCreate(msgsToAdd);
      blocksToAdd = [];
      txsToAdd = [];
      msgsToAdd = [];
      console.log(`Blocks added to db: ${i - startHeight} / ${blockCount} (${(((i - startHeight) * 100) / blockCount).toFixed(2)}%)`);
    }
  }

  try {
    await Block.bulkCreate(blocksToAdd);
    await Transaction.bulkCreate(txsToAdd);
    await Message.bulkCreate(msgsToAdd);
    console.log("Blocks added to db: " + blockCount + " / " + blockCount + " (100%)");
  } catch (err) {
    console.log(err);
    throw err;
  }

  let totalBlockCount = await Block.count();
  let totalTxCount = await Transaction.count();
  let totalMsgCount = await Message.count();

  console.log("Total: ");
  console.table([{ totalBlockCount, totalTxCount, totalMsgCount }]);
}

async function downloadBlocks(startHeight, endHeight) {
  syncingStatus = "Downloading blocks";
  const missingBlockCount = endHeight - startHeight;
  let shouldStop = false;

  for (let height = startHeight; height <= endHeight && !shouldStop; height++) {
    syncingStatus = `Downloading block #${height} / ${endHeight}`;
    await nodeAccessor.waitForAvailableNode();

    const cachedBlock = await getCachedBlockByHeight(height);

    if (!cachedBlock) {
      nodeAccessor
        .fetch("/blocks/" + height, async (blockJson) => {
          await blocksDb.put(height, JSON.stringify(blockJson));
        })
        .catch((err) => {
          console.error(err);
          shouldStop = err;
        });
    }

    if (!cachedBlock || height % 1000 === 0) {
      console.clear();
      console.log("Current height: " + height + " / " + endHeight);
      console.log("Progress: " + (((height - startHeight) * 100) / missingBlockCount).toFixed(2) + "%");

      if (!isProd) {
        nodeAccessor.displayTable();
      }
    }
  }

  await nodeAccessor.waitForAllFinished();

  syncingStatus = "Saving latest downloaded height";

  if (shouldStop) throw shouldStop;

  saveLatestDownloadedHeight(endHeight);
}

async function downloadTransactions() {
  syncingStatus = "Downloading transactions";
  const latestDownloadedTxHeight = await getLatestDownloadedTxHeight();

  if (latestDownloadedTxHeight > 0) {
    await Transaction.update(
      {
        downloaded: true
      },
      {
        where: {
          downloaded: false,
          height: { [Op.lte]: latestDownloadedTxHeight }
        }
      }
    );
  }

  const missingTransactions = await Transaction.findAll({
    attributes: ["id", "hash", "height"],
    where: {
      downloaded: false,
      hasInterestingTypes: true,
      height: { [Op.gt]: latestDownloadedTxHeight || 0 }
    },
    order: [["height", "ASC"]]
  });

  let shouldStop = false;
  let highestHeight = 0;

  for (let i = 0; i < missingTransactions.length; ++i) {
    syncingStatus = `Downloading transaction ${i} / ${missingTransactions.length}`;
    const hash = missingTransactions[i].hash;
    highestHeight = missingTransactions[i].height;

    await nodeAccessor.waitForAvailableNode();

    const cachedTx = await getCachedTxByHash(hash);

    if (!cachedTx) {
      nodeAccessor
        .fetch("/txs/" + hash, async (txJson) => {
          await txsDb.put(hash, JSON.stringify(txJson));
          await missingTransactions[i].update({
            downloaded: true,
            hasDownloadError: !txJson.tx,
            hasProcessingError: !!txJson.code
          });
        })
        .catch((err) => {
          console.error(err);
          shouldStop = err;
        });
    } else {
      await missingTransactions[i].update({
        downloaded: true,
        hasDownloadError: !cachedTx.tx,
        hasProcessingError: !!cachedTx.code
      });
    }

    if (!cachedTx || i % 100 === 0) {
      console.clear();
      console.log("Current tx: " + i + " / " + missingTransactions.length);
      console.log("Progress: " + ((i * 100) / missingTransactions.length).toFixed(2) + "%");

      if (!isProd) {
        nodeAccessor.displayTable();
      }
    }
  }

  console.clear();
  console.log("Current tx: " + missingTransactions.length + " / " + missingTransactions.length);
  console.log("Progress: 100%");

  nodeAccessor.displayTable();

  if (shouldStop) throw shouldStop;

  await nodeAccessor.waitForAllFinished();

  syncingStatus = "Saving latest downloaded tx height";

  if (highestHeight > 0) {
    await saveLatestDownloadedTxHeight(highestHeight);
  }
}
