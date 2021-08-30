import express from "express";
import { Request, Response } from "express";
import { getDbSize, initDatabase } from "./db/buildDatabase";
import { calculateNetworkRevenue, getStatus, getWeb3IndexRevenue } from "./db/networkRevenueProvider";
import { syncPriceHistory } from "./db/priceHistoryProvider";
import { syncBlocks } from "./akash/akashSync";
import { deleteCache, getCacheSize } from "./akash/dataStore";

const app = express();
const { PORT = 3081 } = process.env;

let latestSyncingError = null;
let latestSyncingErrorDate = null;
let latestQueryingError = null;
let latestQueryingErrorDate = null;

app.get("/status", async (req, res) => {
  console.log("getting debug infos");

  const debugInfos = await getStatus();
  const cacheSize = await getCacheSize();
  const dbSize = await getDbSize();

  res.send({ ...debugInfos, latestSyncingError, latestSyncingErrorDate, latestQueryingError, latestQueryingErrorDate, ...cacheSize, dbSize });
});

app.get("/revenue", async (req, res) => {
  try {
    console.log("calculating revenue");

    const revenueData = await getWeb3IndexRevenue(req.query.debug === "true");

    res.send(revenueData);
  } catch (err) {
    latestQueryingError = err;
    latestQueryingErrorDate = new Date();
    console.error(err);

    res.status(500).send("An error occured");
  }
});

app.listen(PORT, () => {
  console.log("server started at http://localhost:" + PORT);
});

/**
 * Intizialize database schema
 * Populate db
 * Create backups per version
 * Load from backup if exists for current version
 */
async function initApp() {
  try {
    await initDatabase();

    await syncPriceHistory();

    await computeAtInterval();
  } catch (err) {
    latestSyncingError = err;
    latestSyncingErrorDate = new Date();
    console.error("Error while initializing app", err);
  }
}

async function computeAtInterval() {
  try {
    await syncBlocks();
    await calculateNetworkRevenue();
    await deleteCache();
  } catch (err) {
    latestSyncingError = err;
    latestSyncingErrorDate = new Date();
    console.error(err);
  }

  setTimeout(async () => {
    await computeAtInterval();
  }, 1 * 60 * 1000); // 1min
}

initApp();

export default app;
