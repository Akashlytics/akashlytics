"use strict";

const express = require("express");
const path = require("path");
const blockchainAnalyzer = require("./blockchainAnalyzer");
const marketDataProvider = require("./marketDataProvider");
const dbProvider = require("./dbProvider");

// Constants
const PORT = 3080;

// App
const app = express();

app.use("/dist", express.static(path.join(__dirname, "../app/dist")));
app.use(express.static(path.join(__dirname, "../app/dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist/index.html"));
});

app.get("/api/getDeploymentCounts/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();
  const averagePrice = blockchainAnalyzer.getAveragePrice();
  const totalResourcesLeased = blockchainAnalyzer.getTotalResourcesLeased();
  const lastRefreshDate = blockchainAnalyzer.getLastRefreshDate();
  const totalAKTSpent = blockchainAnalyzer.getTotalAKTSpent();
  const snapshots = blockchainAnalyzer.getSnapshots();
  const marketData = marketDataProvider.getAktMarketData();

  if (activeDeploymentCount != null) {
    res.send({
      activeDeploymentCount,
      deploymentCount,
      averagePrice,
      marketData,
      totalAKTSpent,
      totalResourcesLeased,
      snapshots,
      lastRefreshDate,
    });
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
