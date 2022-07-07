import fs from "fs";
import base64js from "base64-js";
import { statsProcessor } from "./statsProcessor";
import { blockHeightToKey, blocksDb, getCachedBlockByHeight, getCachedTxByHash, txsDb } from "./dataStore";
import { createNodeAccessor } from "./nodeAccessor";
import { Block, Transaction, Message, Op, Day, sequelize } from "@src/db/schema";
import * as benchmark from "../shared/utils/benchmark";

import * as uuid from "uuid";
import { sha256 } from "js-sha256";
import { isProd, lastBlockToSync } from "@src/shared/constants";
import { isEqual } from "date-fns";

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

async function getLatestDownloadedHeight() {
  const keyStr = await blocksDb.keys({ reverse: true }).next();

  if (keyStr) {
    return parseInt(keyStr);
  } else {
    return 0;
  }
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

    const status = await nodeAccessor.fetch("/status");
    const latestAvailableHeight = parseInt(status.result.sync_info.latest_block_height);
    const latestBlockToDownload = Math.min(lastBlockToSync, latestAvailableHeight);

    let latestDownloadedHeight = await getLatestDownloadedHeight();

    if (latestDownloadedHeight >= latestBlockToDownload) {
      console.log("Already downloaded all blocks");
    } else {
      const startHeight = latestDownloadedHeight + 1;
      console.log("Starting download at block #" + startHeight);
      console.log("Will end download at block #" + latestBlockToDownload);
      console.log(latestBlockToDownload - startHeight + " blocks to download");

      await benchmark.measureAsync("downloadBlocks", async () => {
        await downloadBlocks(startHeight, latestBlockToDownload);
      });
    }

    let latestInsertedHeight: number = (await Block.max("height")) || 0;

    await benchmark.measureAsync("insertBlocks", async () => {
      await insertBlocks(latestInsertedHeight + 1, latestBlockToDownload);
    });

    await benchmark.measureAsync("downloadTransactions", async () => {
      await downloadTransactions();
    });

    syncingStatus = "Processing messages";

    await benchmark.measureAsync("processMessages", async () => {
      await statsProcessor.processMessages();
    });

    benchmark.displayTimes();
  } catch (err) {
    console.error("Error while syncing", err);
    throw err;
  } finally {
    isSyncing = false;
    syncingStatus = "Done";
  }
}

async function insertBlocks(startHeight, endHeight) {
  const blockCount = endHeight - startHeight + 1;
  console.log("Inserting " + blockCount + " blocks into database");
  syncingStatus = "Inserting blocks";

  let lastInsertedBlock = (await Block.findOne({
    include: [
      {
        model: Day,
        required: true
      }
    ],
    order: [["height", "DESC"]]
  })) as any;

  let blocksToAdd = [];
  let txsToAdd = [];
  let msgsToAdd = [];

  for (let i = startHeight; i <= endHeight; ++i) {
    syncingStatus = `Inserting block #${i} / ${endHeight}`;

    const blockData = await getCachedBlockByHeight(i);

    if (!blockData) throw "Block # " + i + " was not in cache";

    let msgIndexInBlock = 0;
    const blockDatetime = new Date(blockData.block.header.time);

    const txs = blockData.block.data.txs;
    for (let txIndex = 0; txIndex < txs.length; ++txIndex) {
      const tx = txs[txIndex];
      const hash = sha256(Buffer.from(tx, "base64")).toUpperCase();
      const txId = uuid.v4();

      let hasInterestingTypes = false;
      const decodedTx = decodeTxRaw(fromBase64(tx));
      const msgs = decodedTx.body.messages;

      for (let msgIndex = 0; msgIndex < msgs.length; ++msgIndex) {
        const msg = msgs[msgIndex];
        const isInterestingType = statsProcessor.hasMessageHandlerFor(msg.typeUrl);

        msgsToAdd.push({
          id: uuid.v4(),
          txId: txId,
          type: msg.typeUrl,
          typeCategory: msg.typeUrl.split(".")[0].substring(1),
          index: msgIndex,
          height: i,
          indexInBlock: msgIndexInBlock++,
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

    const blockEntry = {
      height: i,
      datetime: new Date(blockData.block.header.time),
      totalTxCount: (lastInsertedBlock?.totalTxCount || 0) + txs.length,
      dayId: lastInsertedBlock?.dayId,
      day: lastInsertedBlock?.day
    };

    const blockDate = new Date(Date.UTC(blockDatetime.getUTCFullYear(), blockDatetime.getUTCMonth(), blockDatetime.getUTCDate()));

    if (!lastInsertedBlock || !isEqual(blockDate, lastInsertedBlock.day.date)) {
      console.log("Creating day: ", blockDate, i);
      const newDay = await Day.create({
        id: uuid.v4(),
        date: blockDate,
        firstBlockHeight: i,
        lastBlockHeightYet: i
      });

      blockEntry.dayId = newDay.id;
      blockEntry.day = newDay;

      if (lastInsertedBlock) {
        lastInsertedBlock.day.lastBlockHeight = lastInsertedBlock.height;
        lastInsertedBlock.day.lastBlockHeightYet = lastInsertedBlock.height;
        await lastInsertedBlock.day.save();
      }
    }
    lastInsertedBlock = blockEntry;

    blocksToAdd.push(blockEntry);

    if (blocksToAdd.length >= 1_000 || i === endHeight) {
      await Block.bulkCreate(blocksToAdd);
      await Transaction.bulkCreate(txsToAdd);
      await Message.bulkCreate(msgsToAdd);

      blocksToAdd = [];
      txsToAdd = [];
      msgsToAdd = [];
      console.log(`Blocks added to db: ${i - startHeight + 1} / ${blockCount} (${(((i - startHeight + 1) * 100) / blockCount).toFixed(2)}%)`);

      if (lastInsertedBlock) {
        lastInsertedBlock.day.lastBlockHeightYet = lastInsertedBlock.height;
        await lastInsertedBlock.day.save();
      }
    }
  }

  let totalBlockCount = await Block.count();
  let totalTxCount = await Transaction.count();
  let totalMsgCount = await Message.count();

  console.log("Total: ");
  console.table([{ totalBlockCount, totalTxCount, totalMsgCount }]);
}

async function downloadBlocks(startHeight: number, endHeight: number) {
  syncingStatus = "Downloading blocks";
  const missingBlockCount = endHeight - startHeight;
  let shouldStop = false;

  for (let height = startHeight; height <= endHeight && !shouldStop; height++) {
    syncingStatus = `Downloading block #${height} / ${endHeight}`;
    await nodeAccessor.waitForAvailableNode();

    const cachedBlock = await getCachedBlockByHeight(height);

    if (!cachedBlock) {
      nodeAccessor
        .fetch("/block?height=" + height, async (blockJson) => {
          await blocksDb.put(blockHeightToKey(height), JSON.stringify(blockJson.result));
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

  const whereFilter = {
    downloaded: false,
    hasInterestingTypes: true,
    height: { [Op.gt]: latestDownloadedTxHeight || 0 }
  };

  const missingTxCount = await Transaction.count({ where: whereFilter });
  const txGroupSize = 100_000;
  const txGroupCount = Math.ceil(missingTxCount / txGroupSize);

  for (let groupIndex = 0; groupIndex < txGroupCount; groupIndex++) {
    syncingStatus = `Fetching missing txs ${groupIndex * txGroupSize}-${Math.min(missingTxCount, (groupIndex + 1) * txGroupSize)} from db`;
    console.log(syncingStatus);

    const missingTransactions = await Transaction.findAll({
      attributes: ["id", "hash", "height"],
      where: whereFilter,
      order: [["height", "ASC"]],
      limit: txGroupSize
    });

    let shouldStop = false;
    let highestHeight = 0;

    const groupTransaction = await sequelize.transaction();

    let promises = [];
    for (let i = 0; i < missingTransactions.length; ++i) {
      const txIndex = groupIndex * txGroupSize + i;
      syncingStatus = `Downloading transaction ${i} / ${missingTransactions.length}`;
      const hash = missingTransactions[i].hash;
      highestHeight = missingTransactions[i].height;

      await nodeAccessor.waitForAvailableNode();

      const cachedTx = await getCachedTxByHash(hash);

      const updateTx = async (txJson) => {
        await missingTransactions[i].update(
          {
            downloaded: true,
            hasDownloadError: !txJson.tx,
            hasProcessingError: !!txJson.tx_result.code
          },
          { transaction: groupTransaction }
        );
      };

      if (!cachedTx) {
        promises.push(
          nodeAccessor
            .fetch("/tx?hash=0x" + hash, async (txJson) => {
              await txsDb.put(hash, JSON.stringify(txJson.result));
              await updateTx(txJson.result);
            })
            .catch((err) => {
              console.error(err);
              shouldStop = err;
            })
        );
      } else {
        await updateTx(cachedTx);
      }

      if (!cachedTx || i % 100 === 0) {
        console.clear();
        console.log(`Current tx: ${txIndex} / ${missingTxCount} (Group ${groupIndex + 1} of ${txGroupCount})`);
        console.log("Progress: " + ((txIndex * 100) / missingTxCount).toFixed(2) + "%");

        if (!isProd) {
          nodeAccessor.displayTable();
        }
      }
    }

    await Promise.all(promises);
    await groupTransaction.commit();

    console.clear();
    console.log("Current tx: " + missingTxCount + " / " + missingTxCount);
    console.log("Progress: 100%");

    nodeAccessor.displayTable();

    if (shouldStop) throw shouldStop;

    await nodeAccessor.waitForAllFinished();

    syncingStatus = "Saving latest downloaded tx height";

    if (highestHeight > 0) {
      await saveLatestDownloadedTxHeight(highestHeight);
    }
  }
}
