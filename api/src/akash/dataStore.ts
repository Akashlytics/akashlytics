import { Level } from "level";
import fs from "fs";
import { bytesToHumanReadableSize } from "@src/shared/utils/files";
import { dataFolderPath } from "@src/shared/constants";

const path = require("path");

const LevelNotFoundCode = "LEVEL_NOT_FOUND";

if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath);
}

export const blockHeightToKey = (height: number) => height.toString().padStart(10, "0");

export const blocksDb = new Level("data/blocks.db");
export const txsDb = new Level("data/txs.db");

export const getCacheSize = async function () {
  console.time("size");
  const blocksSize = await getTotalSize(dataFolderPath + "/blocks.db");
  const txsSize = await getTotalSize(dataFolderPath + "/txs.db");
  console.timeEnd("size");
  return { blocksSize: blocksSize, txsSize: txsSize };
};

export const deleteCache = async function () {
  console.log("Deleting cache...");
  await blocksDb.clear();
  await txsDb.clear();
  console.log("Deleted");
};

export async function getCachedBlockByHeight(height: number) {
  try {
    const content = await blocksDb.get(blockHeightToKey(height));
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== LevelNotFoundCode) throw err;

    return null;
  }
}

export async function getCachedTxByHash(hash: string) {
  try {
    const content = await txsDb.get(hash);
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== LevelNotFoundCode) throw err;

    return null;
  }
}

const getAllFiles = function (dirPath, arrayOfFiles?) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};

const getTotalSize = function (directoryPath) {
  const arrayOfFiles = getAllFiles(directoryPath);

  let totalSize = 0;

  arrayOfFiles.forEach(function (filePath) {
    totalSize += fs.statSync(filePath).size;
  });

  return bytesToHumanReadableSize(totalSize);
};
