"use strict";

const express = require("express");
const path = require("path");
const blockchainAnalyzer = require("./blockchainAnalyzer");
const marketDataProvider = require("./marketDataProvider");

// Constants
const PORT = 3080;

// App
const app = express();

app.use(express.static(path.join(__dirname, "../app/build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/build/index.html"));
});

app.get("/api/getDeploymentCounts/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();
  const averagePrice = blockchainAnalyzer.getAveragePrice();
  const lastRefreshDate = blockchainAnalyzer.getLastRefreshDate();
  const marketData = marketDataProvider.getAktMarketData();

  if (activeDeploymentCount != null) {
    res.send({ activeDeploymentCount, deploymentCount, averagePrice, marketData, lastRefreshDate });
  } else {
    res.send(null);
  }
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
  res.sendFile(path.join(__dirname, "../app/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});

blockchainAnalyzer.initialize();
blockchainAnalyzer.startAutoRefresh();
marketDataProvider.syncAtInterval();
