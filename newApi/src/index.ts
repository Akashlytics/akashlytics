import express from "express";
import { Request, Response } from "express";
import { getDbSize, initDatabase } from "./db/buildDatabase";
import { calculateNetworkRevenue, getStatus, getWeb3IndexRevenue } from "./db/networkRevenueProvider";
import { syncPriceHistory } from "./db/priceHistoryProvider";
import { syncBlocks, isSyncing } from "./akash/akashSync";
import { deleteCache, getCacheSize } from "./akash/dataStore";
import { isProd } from "./shared/constants";
import { bytesToHumanReadableSize } from "./shared/utils/files";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

const app = express();
const { PORT = 3081 } = process.env;

let latestSyncingError = null;
let latestSyncingErrorDate = null;
let latestQueryingError = null;
let latestQueryingErrorDate = null;

Sentry.init({
  dsn: "https://1ef35fcd6f3b43aa887cd8a152df1014@o877251.ingest.sentry.io/5957967",
  environment: process.env.NODE_ENV,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({
      // to trace all requests to the default router
      app
      // alternatively, you can specify the routes you want to trace:
      // router: someRouter,
    })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.get("/status", async (req, res) => {
  console.log("getting debug infos");

  try {
    const debugInfos = await getStatus();
    const cacheSize = await getCacheSize();
    const dbSize = await getDbSize();
    const memoryInBytes = process.memoryUsage();
    const memory = {
      rss: bytesToHumanReadableSize(memoryInBytes.rss),
      heapTotal: bytesToHumanReadableSize(memoryInBytes.heapTotal),
      heapUsed: bytesToHumanReadableSize(memoryInBytes.heapUsed),
      external: bytesToHumanReadableSize(memoryInBytes.external)
    };

    res.send({ ...debugInfos, latestSyncingError, latestSyncingErrorDate, latestQueryingError, latestQueryingErrorDate, ...cacheSize, dbSize, memory });
  } catch (err) {
    Sentry.captureException(err);

    res.status(500).send(err);
  }
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

    Sentry.captureException(err);

    res.status(500).send("An error occured");
  }
});

// the rest of your app
app.use(Sentry.Handlers.errorHandler());

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
    setInterval(async () => {
      await computeAtInterval();
    }, 15 * 60 * 1000); // 15min
  } catch (err) {
    latestSyncingError = err;
    latestSyncingErrorDate = new Date();
    console.error("Error while initializing app", err);

    Sentry.captureException(err);
  }
}

async function computeAtInterval() {
  try {
    if (isSyncing) return;

    await syncBlocks();
    await calculateNetworkRevenue();

    if (isProd) {
      await deleteCache();
    }
  } catch (err) {
    latestSyncingError = err;
    latestSyncingErrorDate = new Date();

    Sentry.captureException(err);

    console.error(err);
  }
}

initApp();

export default app;
