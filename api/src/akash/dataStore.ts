import { Level } from "level";
import fs from "fs";
import { bytesToHumanReadableSize } from "@src/shared/utils/files";

const path = require("path");

if (!fs.existsSync("./data/")) {
  fs.mkdirSync("./data/");
}

export const blocksDb = new Level("data/blocks.db");
export const txsDb = new Level("data/txs.db");

export const getCacheSize = async function () {
  console.time("size");
  const blocksSize = await getTotalSize("./data/blocks.db");
  const txsSize = await getTotalSize("./data/txs.db");
  console.timeEnd("size");
  return { blocksSize: blocksSize, txsSize: txsSize };
};

export const deleteCache = async function () {
  console.log("Deleting cache...");
  await blocksDb.clear();
  await txsDb.clear();
  console.log("Deleted");
};

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
