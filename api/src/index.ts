import express from "express";
import cors from "cors";
import cache from "./caching/cacheMiddleware";
import { getDbSize, initDatabase } from "./db/buildDatabase";
import { getStatus, getWeb3IndexRevenue } from "./db/networkRevenueProvider";
import { syncPriceHistoryAtInterval, updatePriceHistory } from "./db/priceHistoryProvider";
import { syncBlocks, isSyncing } from "./akash/akashSync";
import { deleteCache, getCacheSize } from "./akash/dataStore";
import { executionMode, ExecutionMode, isProd } from "./shared/constants";
import { bytesToHumanReadableSize } from "./shared/utils/files";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { statsProcessor } from "./akash/statsProcessor";
import { getGraphData, getDashboardData } from "./db/statsProvider";
import * as marketDataProvider from "./providers/marketDataProvider";
import { fetchGithubReleases } from "./providers/githubProvider";
import { fetchProvidersInfoAtInterval, getNetworkCapacity, getProviders } from "./providers/providerStatusProvider";
import { getTemplateGallery } from "./providers/templateReposProvider";
import { Scheduler } from "./scheduler";

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: process.env.AKASHLYTICS_CORS_WEBSITE_URLS?.split(",") || "http://localhost:3000",
    optionsSuccessStatus: 200
  })
);

const { PORT = 3080 } = process.env;

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

const apiRouter = express.Router();
const web3IndexRouter = express.Router();

apiRouter.get("/templates", cache(60 * 5), async (req, res) => {
  try {
    const templates = await getTemplateGallery();
    res.send(templates);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch templates");
  }
});

apiRouter.get("/latestDeployToolVersion", cache(60 * 2), async (req, res) => {
  try {
    const releaseData = await fetchGithubReleases();
    res.send(releaseData);
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message || err);
  }
});

apiRouter.get("/getNetworkCapacity", waitForInitMiddleware, async (req, res) => {
  try {
    const networkCapacity = await getNetworkCapacity();
    res.send(networkCapacity);
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message || err);
  }
});

apiRouter.get("/providers", waitForInitMiddleware, async (req, res) => {
  try {
    const providers = await getProviders();
    res.send(providers);
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message || err);
  }
});

apiRouter.get("/getDashboardData", waitForInitMiddleware, async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    const marketData = marketDataProvider.getAktMarketData();
    const networkCapacity = await getNetworkCapacity();
    res.send({ ...dashboardData, marketData, networkCapacity });
  } catch (err) {
    console.error(err);
  }
});

apiRouter.get("/getGraphData/:dataName", waitForInitMiddleware, async (req, res) => {
  try {
    const dataName = req.params.dataName;
    const authorizedDataNames = [
      "dailyUAktSpent",
      "dailyLeaseCount",
      "totalUAktSpent",
      "activeLeaseCount",
      "totalLeaseCount",
      "activeCPU",
      "activeMemory",
      "activeStorage"
    ];

    if (!authorizedDataNames.includes(dataName)) {
      console.log("Rejected graph request: " + dataName);
      res.sendStatus(404);
      return;
    }

    const graphData = await getGraphData(dataName);
    res.send(graphData);
  } catch (err) {
    res.sendStatus(500);
    console.error(err);
  }
});

web3IndexRouter.get("/status", waitForInitMiddleware, async (req, res) => {
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

web3IndexRouter.get("/revenue", waitForInitMiddleware, async (req, res) => {
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

app.use("/api", apiRouter);
app.use("/web3-index", web3IndexRouter);

// the rest of your app
app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log("server started at http://localhost:" + PORT);
});

let initDatabaseTask = null;
async function waitForInitMiddleware(req, res, next) {
  try {
    if (initDatabaseTask) {
      console.log(`Call to ${req.originalUrl} is blocked while downloading database`);
      await initDatabaseTask;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Intizialize database schema
 * Populate db
 * Create backups per version
 * Load from backup if exists for current version
 */
async function initApp() {
  try {
    if (executionMode === ExecutionMode.DoNotSync) return;

    initDatabaseTask = initDatabase();
    await initDatabaseTask;
    initDatabaseTask = null;

    if (executionMode === ExecutionMode.RebuildStats) {
      await statsProcessor.rebuildStatsTables();
    } else if (executionMode === ExecutionMode.RebuildAll) {
      console.time("Rebuilding all");
      await computeAtInterval();
      console.timeEnd("Rebuilding all");
    } else if (executionMode === ExecutionMode.DownloadAndSync || executionMode === ExecutionMode.SyncOnly) {
      // await marketDataProvider.syncAtInterval();
      // await computeAtInterval();
      // await syncPriceHistoryAtInterval();
      // await fetchProvidersInfoAtInterval();
      // setInterval(async () => {
      //   await computeAtInterval();
      //   await updatePriceHistory();
      // }, 15 * 60 * 1000); // 15min

      const scheduler = new Scheduler();
      scheduler.registerTask("Market date", marketDataProvider.fetchLatestData, "30 seconds");
      scheduler.start();
    } else {
      throw "Invalid execution mode";
    }
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
