const fetch = require("node-fetch");
const dbProvider = require("./dbProvider");
const fs = require("fs");
const { mainNet, averageBlockTime } = require("./constants");
const dataSnapshotsHandler = require("./dataSnapshotsHandler");

const currentNet = mainNet;

const cacheFolder = "./cache/";
const leasesCachePath = cacheFolder + "leases.json";
const deploymentsCachePath = cacheFolder + "deployments.json";
const bidsCachePath = cacheFolder + "bids.json";
const paginationLimit = 1000;
const autoRefreshInterval = 10 * 60 * 1000; // 10 min

let deploymentCount = null;
let activeDeploymentCount = null;
let averagePrice = null;
let totalAKTSpent = null;
let totalResourcesLeased = null;
let lastSnapshot = null;
let allSnapshots = null;
let dailyAktSpent = null;
let dailyDeploymentCount = null;

let activeDeploymentSnapshots = null;
let totalAKTSpentSnapshots = null;
let allTimeDeploymentCountSnapshots = null;
let computeSnapshots = null;
let memorySnapshots = null;
let storageSnapshots = null;
let dailyAktSpentSnapshots = null;
let dailyDeploymentCountSnapshots = null;

let lastRefreshDate = null;
let isLoadingData = false;

exports.getActiveDeploymentCount = () => activeDeploymentCount;
exports.getDeploymentCount = () => deploymentCount;
exports.getAveragePrice = () => averagePrice;
exports.getTotalResourcesLeased = () => totalResourcesLeased;
exports.getLastRefreshDate = () => lastRefreshDate;
exports.getTotalAKTSpent = () => totalAKTSpent;
exports.getDailyAktSpent = () => dailyAktSpent;
exports.getDailyDeploymentCount = () => dailyDeploymentCount;
exports.getActiveDeploymentSnapshots = () => activeDeploymentSnapshots;
exports.getTotalAKTSpentSnapshots = () => totalAKTSpentSnapshots;
exports.getAllTimeDeploymentCountSnapshots = () => allTimeDeploymentCountSnapshots;
exports.getComputeSnapshots = () => computeSnapshots;
exports.getMemorySnapshots = () => memorySnapshots;
exports.getStorageSnapshots = () => storageSnapshots;
exports.getDailyAktSpentSnapshots = () => dailyAktSpentSnapshots;
exports.getDailyDeploymentCountSnapshots = () => dailyDeploymentCountSnapshots;
exports.getLastSnapshot = () => lastSnapshot;
exports.getAllSnapshots = () => allSnapshots;

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

exports.initialize = async (firstInit) => {
  isLoadingData = true;
  try {
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder);
    }

    await dbProvider.init();

    const nodeList = await loadNodeList();
    const node = pickRandomElement(nodeList);

    console.log("Selected node: " + node);

    const leases = await loadLeases(node);
    const deployments = await loadDeployments(node);
    const bids = await loadBids(node);

    lastRefreshDate = new Date();

    if (firstInit) {
      await dbProvider.initSnapshotsFromFile();
    }

    console.log(`Inserting ${deployments.length} deployments into the database`);
    console.time("insertData");
    console.time("insertDeployments");
    await dbProvider.addDeployments(deployments);
    console.timeEnd("insertDeployments");

    console.log(`Inserting ${leases.length} leases into the database`);
    console.time("insertLeases");
    await dbProvider.addLeases(leases);
    console.timeEnd("insertLeases");

    console.log(`Inserting ${bids.length} bids into the database`);
    console.time("insertBids");
    await dbProvider.addBids(bids);
    console.timeEnd("insertBids");
    console.timeEnd("insertData");

    deploymentCount = await dbProvider.getDeploymentCount();
    activeDeploymentCount = await dbProvider.getActiveDeploymentCount();
    console.log(`There is ${activeDeploymentCount} active deployments`);
    console.log(`There was ${deploymentCount} total deployments`);

    activeDeploymentSnapshots = await dbProvider.getActiveDeploymentSnapshots();
    totalAKTSpentSnapshots = await dbProvider.getTotalAKTSpentSnapshots();
    allTimeDeploymentCountSnapshots = await dbProvider.getAllTimeDeploymentCountSnapshots();
    computeSnapshots = await dbProvider.getComputeSnapshots();
    memorySnapshots = await dbProvider.getMemorySnapshots();
    storageSnapshots = await dbProvider.getStorageSnapshots();
    dailyAktSpentSnapshots = await dbProvider.getDailyAktSpentSnapshots();
    dailyDeploymentCountSnapshots = await dbProvider.getDailyDeploymentCountSnapshots();
    lastSnapshot = await dbProvider.getLastSnapshot();
    allSnapshots = await dbProvider.getAllSnapshots();
    dailyAktSpent = await dbProvider.getDailyAktSpent();
    dailyDeploymentCount = await dbProvider.getDailyDeploymentCount();

    totalAKTSpent = await dbProvider.getTotalAKTSpent();
    const roundedAKTSpent = Math.round((totalAKTSpent / 1000000 + Number.EPSILON) * 100) / 100;
    console.log(`There was ${roundedAKTSpent} akt spent on cloud resources`);

    totalResourcesLeased = await dbProvider.getTotalResourcesLeased();
    console.log(
      `Total resources leased: ${totalResourcesLeased.cpuSum} cpu / ${totalResourcesLeased.memorySum} memory / ${totalResourcesLeased.storageSum} storage`
    );

    const averagePriceByBlock = await dbProvider.getPricingAverage();
    console.log(`The average price for a small instance is: ${averagePriceByBlock} uakt / block`);

    averagePrice = (averagePriceByBlock * 31 * 24 * 60 * 60) / averageBlockTime;
    const roundedPriceAkt = Math.round((averagePrice / 1000000 + Number.EPSILON) * 100) / 100;

    console.log(`That is ${roundedPriceAkt} AKT / month`);

    await dataSnapshotsHandler.takeSnapshot(
      activeDeploymentCount,
      totalResourcesLeased.cpuSum,
      totalResourcesLeased.memorySum,
      totalResourcesLeased.storageSum,
      deploymentCount,
      totalAKTSpent
    );
  } catch (err) {
    console.error("Could not initialize", err);
  } finally {
    isLoadingData = false;
  }
};

async function loadLeases(node) {
  let leases = null;

  if (fs.existsSync(leasesCachePath)) {
    leases = require(leasesCachePath);
    console.log("Loaded leases from cache");
  } else {
    leases = await loadWithPagination(
      node + "/akash/market/v1beta1/leases/list",
      "leases",
      paginationLimit
    );
    fs.writeFileSync(leasesCachePath, JSON.stringify(leases));
  }

  console.log(`Found ${leases.length} leases`);

  return leases;
}

async function loadDeployments(node) {
  let deployments = null;

  if (fs.existsSync(deploymentsCachePath)) {
    deployments = require(deploymentsCachePath);
    console.log("Loaded deployments from cache");
  } else {
    deployments = await loadWithPagination(
      node + "/akash/deployment/v1beta1/deployments/list",
      "deployments",
      paginationLimit
    );
    fs.writeFileSync(deploymentsCachePath, JSON.stringify(deployments));
  }

  console.log(`Found ${deployments.length} deployments`);

  return deployments;
}

async function loadBids(node) {
  let bids = null;

  if (fs.existsSync(bidsCachePath)) {
    bids = require(bidsCachePath);
    console.log("Loaded bids from cache");
  } else {
    bids = await loadWithPagination(
      node + "/akash/market/v1beta1/bids/list",
      "bids",
      paginationLimit
    );
    fs.writeFileSync(bidsCachePath, JSON.stringify(bids));
  }

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

  return ["http://135.181.181.120:1518"];
  // return nodeList;
}

async function loadWithPagination(baseUrl, dataKey, limit) {
  let items = [];
  let nextKey = null;
  let callCount = 1;
  let totalCount = null;

  do {
    let queryUrl = baseUrl + "?pagination.limit=" + limit + "&pagination.count_total=true";
    if (nextKey) {
      queryUrl += "&pagination.key=" + encodeURIComponent(nextKey);
    }
    console.log(`Querying ${dataKey} [${callCount}] from : ${queryUrl}`);
    const response = await fetch(queryUrl);
    const data = await response.json();

    if (!nextKey) {
      totalCount = data.pagination.total;
    }

    items = items.concat(data[dataKey]);
    nextKey = data.pagination.next_key;
    callCount++;

    console.log(`Got ${items.length} of ${totalCount}`);
  } while (nextKey);

  return items.filter((item) => item);
}
