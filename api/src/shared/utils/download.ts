import { bytesToHumanReadableSize } from "./files";

const { parse } = require("url");
const http = require("https");
const fs = require("fs");
const { basename } = require("path");

const progressLogThrottle = 1000;

export async function download(url, path) {
  const uri = parse(url);
  if (!path) {
    path = basename(uri.path);
  }
  const file = fs.createWriteStream(path);

  return new Promise<void>(function (resolve, reject) {
    http.get(uri.href).on("response", function (res) {
      const len = parseInt(res.headers["content-length"], 10);
      let downloaded = 0;
      let lastProgressLog = Date.now();
      res
        .on("data", function (chunk) {
          file.write(chunk);
          downloaded += chunk.length;
          const percent = ((100.0 * downloaded) / len).toFixed(2);
          if (Date.now() - lastProgressLog > progressLogThrottle) {
            console.log(`${uri.path} - Downloading ${percent}% ${bytesToHumanReadableSize(downloaded)}`);
            lastProgressLog = Date.now();
          }
        })
        .on("end", function () {
          file.end();
          console.log(`${uri.path} downloaded to: ${path}`);
          resolve();
        })
        .on("error", function (err) {
          reject(err);
        });
    });
  });
}
