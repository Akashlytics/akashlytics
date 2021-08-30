"use strict";

const express = require("express");
const path = require("path");
const blockchainAnalyzer = require("./blockchainAnalyzer");
const marketDataProvider = require("./marketDataProvider");
const dbProvider = require("./dbProvider");
const proxy = require('express-http-proxy');

// Constants
const PORT = 3080;

// App
const app = express();

app.use('/web3-index', proxy('localhost:3081'));

app.use("/dist", express.static(path.join(__dirname, "../app/dist")));
app.use(express.static(path.join(__dirname, "../app/dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist/index.html"));
});

app.get("/api/getDashboardData/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();
  const averagePrice = blockchainAnalyzer.getAveragePrice();
  const totalResourcesLeased = blockchainAnalyzer.getTotalResourcesLeased();
  const lastRefreshDate = blockchainAnalyzer.getLastRefreshDate();
  const totalAKTSpent = blockchainAnalyzer.getTotalAKTSpent();
  const marketData = marketDataProvider.getAktMarketData();
  const lastSnapshot = await dbProvider.getLastSnapshot();
  const dailyAktSpent = blockchainAnalyzer.getDailyAktSpent();
  const dailyDeploymentCount = blockchainAnalyzer.getDailyDeploymentCount();

  if (activeDeploymentCount != null) {
    res.send({
      activeDeploymentCount,
      deploymentCount,
      averagePrice,
      marketData,
      totalAKTSpent,
      totalResourcesLeased,
      lastRefreshDate,
      lastSnapshot,
      dailyAktSpent,
      dailyDeploymentCount,
    });
  } else {
    res.send(null);
  }
});

app.get("/api/getSnapshot/:id", async (req, res) => {
  if (!req.params) return res.send("Must specify a param.");

  const id = req.params.id;
  const range = req.query.range || "7";
  let snapshots = null;
  let currentValue = null;

  if (!id) return res.send("Must specify a valid snapshot.");

  const totalResourcesLeased = blockchainAnalyzer.getTotalResourcesLeased();

  switch (id) {
    case "activeDeployment":
      snapshots = blockchainAnalyzer.getActiveDeploymentSnapshots();
      currentValue = blockchainAnalyzer.getActiveDeploymentCount();
      break;
    case "totalAKTSpent":
      snapshots = blockchainAnalyzer.getTotalAKTSpentSnapshots();
      currentValue = blockchainAnalyzer.getTotalAKTSpent();
      break;
    case "allTimeDeploymentCount":
      snapshots = blockchainAnalyzer.getAllTimeDeploymentCountSnapshots();
      currentValue = blockchainAnalyzer.getDeploymentCount();
      break;
    case "compute":
      snapshots = blockchainAnalyzer.getComputeSnapshots();
      currentValue = totalResourcesLeased.cpuSum;
      break;
    case "memory":
      snapshots = blockchainAnalyzer.getMemorySnapshots();
      currentValue = totalResourcesLeased.memorySum;
      break;
    case "storage":
      snapshots = blockchainAnalyzer.getStorageSnapshots();
      currentValue = totalResourcesLeased.storageSum;
      break;
    case "dailyAktSpent":
      snapshots = blockchainAnalyzer.getDailyAktSpentSnapshots();
      currentValue = blockchainAnalyzer.getDailyAktSpent();
      break;
    case "dailyDeploymentCount":
      snapshots = blockchainAnalyzer.getDailyDeploymentCountSnapshots();
      currentValue = blockchainAnalyzer.getDailyDeploymentCount();
      break;

    default:
      break;
  }

  if (snapshots != null) {
    res.send({ snapshots, currentValue });
  } else {
    res.send(null);
  }
});

app.get("/api/getAllSnapshots", async (req, res) => {
  const snapshots = await dbProvider.getAllSnapshots();

  res.send(snapshots);
});

app.get("/api/refreshData", async (req, res) => {
  const refreshed = await blockchainAnalyzer.refreshData();

  if (refreshed) {
    res.send("Data refreshed");
  } else {
    res.send("Ignored");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});

async function InitApp() {
  await blockchainAnalyzer.initialize(true);
  blockchainAnalyzer.startAutoRefresh();
  marketDataProvider.syncAtInterval();
}

InitApp();
