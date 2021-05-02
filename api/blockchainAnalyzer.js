const fetch = require("node-fetch");
const dbProvider = require("./dbProvider");
const fs = require("fs");
const { mainNet, averageBlockTime } = require("./constants");

const currentNet = mainNet;

const cacheFolder = "./cache/";
const leasesCachePath = cacheFolder + "leases.json";
const deploymentsCachePath = cacheFolder + "deployments.json";
const bidsCachePath = cacheFolder + "bids.json";
const paginationLimit = 7000;
const autoRefreshInterval = 10 * 60 * 1000; // 10 min

let deploymentCount = null;
let activeDeploymentCount = null;
let averagePrice = null;

let lastRefreshDate = null;
let isLoadingData = false;

exports.getActiveDeploymentCount = () => activeDeploymentCount;
exports.getDeploymentCount = () => deploymentCount;
exports.getAveragePrice = () => averagePrice;
exports.getLastRefreshDate = () => lastRefreshDate;

exports.startAutoRefresh = () => {
  console.log(`Will auto-refresh at an interval of ${Math.round(autoRefreshInterval / 1000)} secs`);
  setInterval(async () => {
    console.log("Auto-refreshing...");
    await exports.refreshData();
  }, autoRefreshInterval);
};

exports.refreshData = async () => {
  const minRefreshInterval = 60 * 1000; // 60secs
  if (lastRefreshDate && new Date().getTime() - lastRefreshDate.getTime() < minRefreshInterval) {
    console.warn("Last refresh was too recent, ignoring refresh request.");
    return false;
  }

  if (isLoadingData) {
    console.warn("Data is already being loaded, ignoring refresh request.");
    return false;
  }

  console.log("Deleting cache folder");
  if (fs.existsSync(cacheFolder)) {
    fs.rmSync(deploymentsCachePath, { force: true });
    fs.rmSync(leasesCachePath, { force: true });
    fs.rmSync(bidsCachePath, { force: true });
    fs.rmdirSync(cacheFolder);
  }

  await dbProvider.clearDatabase();

  await exports.initialize();

  return true;
};

exports.initialize = async () => {
  isLoadingData = true;
  try {
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder);
    }

    const nodeList = await loadNodeList();
    const node = pickRandomElement(nodeList);

    console.log("Selected node: " + node);

    const leases = await loadLeases(node);
    const deployments = await loadDeployments(node);
    const bids = await loadBids(node);

    lastRefreshDate = new Date();

    await dbProvider.init();

    console.log(`Inserting ${deployments.length} deployments into the database`);
    for (const deployment of deployments) {
      await dbProvider.addDeployment(deployment);
    }

    console.log(`Inserting ${leases.length} leases into the database`);
    for (const lease of leases) {
      await dbProvider.addLease(lease);
    }

    console.log(`Inserting ${bids.length} bids into the database`);
    for (const bid of bids) {
      await dbProvider.addBid(bid);
    }

    deploymentCount = await dbProvider.getDeploymentCount();
    activeDeploymentCount = await dbProvider.getActiveDeploymentCount();
    console.log(`There is ${activeDeploymentCount} active deployments`);
    console.log(`There was ${deploymentCount} total deployments`);

    const averagePriceByBlock = await dbProvider.getPricingAverage();
    console.log(`The average price for a small instance is: ${averagePriceByBlock} uakt / block`);

    averagePrice = (averagePriceByBlock * 31 * 24 * 60 * 60) / averageBlockTime;
    const roundedPriceAkt = Math.round((averagePrice / 1000000 + Number.EPSILON) * 100) / 100;

    console.log(`That is ${roundedPriceAkt} AKT / month`);
  } catch (err) {
    console.error("Could not initialize", err);
  } finally {
    isLoadingData = false;
  }
};

async function loadLeases(node) {
  let data = null;

  if (fs.existsSync(leasesCachePath)) {
    data = require(leasesCachePath);
    console.log("Loaded leases from cache");
  } else {
    const queryUrl = node + "/akash/market/v1beta1/leases/list?pagination.limit=" + paginationLimit;
    console.log("Querying leases from: " + queryUrl);
    const response = await fetch(queryUrl);
    data = await response.json();
    fs.writeFileSync(leasesCachePath, JSON.stringify(data));
  }

  const leases = data.leases;

  console.log(`Found ${leases.length} leases`);

  return leases;
}

async function loadDeployments(node) {
  if (fs.existsSync(deploymentsCachePath)) {
    data = require(deploymentsCachePath);
    console.log("Loaded deployments from cache");
  } else {
    const queryUrl =
      node + "/akash/deployment/v1beta1/deployments/list?pagination.limit=" + paginationLimit;
    console.log("Querying deployments from: " + queryUrl);
    const response = await fetch(queryUrl);
    data = await response.json();
    fs.writeFileSync(deploymentsCachePath, JSON.stringify(data));
  }

  const deployments = data.deployments;

  console.log(`Found ${deployments.length} deployments`);

  return deployments;
}

async function loadBids(node) {
  if (fs.existsSync(bidsCachePath)) {
    data = require(bidsCachePath);
    console.log("Loaded bids from cache");
  } else {
    const queryUrl = node + "/akash/market/v1beta1/bids/list?pagination.limit=" + paginationLimit;
    console.log("Querying bids from: " + queryUrl);
    const response = await fetch(queryUrl);
    data = await response.json();
    fs.writeFileSync(bidsCachePath, JSON.stringify(data));
  }

  const bids = data.bids;

  console.log(`Found ${bids.length} bids`);

  return bids;
}

function pickRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function loadNodeList() {
  const nodeListUrl = currentNet + "/api-nodes.txt";
  console.log("Loading node list from: " + nodeListUrl);

  const response = await fetch(nodeListUrl);

  if (response.status !== 200) {
    console.error(response);
    throw "Could not load node list";
  }

  const content = await response.text();

  const nodeList = content.trim().split("\n");

  if (nodeList.length === 0) {
    throw "Found no node in the list";
  }

  console.log(`Found ${nodeList.length} nodes`);

  return nodeList;
}
