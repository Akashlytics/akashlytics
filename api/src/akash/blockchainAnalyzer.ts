import { loadWithPagination } from "@src/shared/utils/query";
import { pickRandomElement } from "@src/shared/utils/math";
import { loadNodeList } from "./nodes";

const dbProvider = require("./dbProvider");
const fs = require("fs");
const dataSnapshotsHandler = require("./dataSnapshotsHandler");

// const cacheFolder = "./cache/";
// const leasesCachePath = cacheFolder + "leases.json";
// const deploymentsCachePath = cacheFolder + "deployments.json";
// const bidsCachePath = cacheFolder + "bids.json";
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

export const getActiveDeploymentCount = () => activeDeploymentCount;
export const getDeploymentCount = () => deploymentCount;
export const getAveragePrice = () => averagePrice;
export const getTotalResourcesLeased = () => totalResourcesLeased;
export const getLastRefreshDate = () => lastRefreshDate;
export const getTotalAKTSpent = () => totalAKTSpent;
export const getDailyAktSpent = () => dailyAktSpent;
export const getDailyDeploymentCount = () => dailyDeploymentCount;
export const getActiveDeploymentSnapshots = () => activeDeploymentSnapshots;
export const getTotalAKTSpentSnapshots = () => totalAKTSpentSnapshots;
export const getAllTimeDeploymentCountSnapshots = () => allTimeDeploymentCountSnapshots;
export const getComputeSnapshots = () => computeSnapshots;
export const getMemorySnapshots = () => memorySnapshots;
export const getStorageSnapshots = () => storageSnapshots;
export const getDailyAktSpentSnapshots = () => dailyAktSpentSnapshots;
export const getDailyDeploymentCountSnapshots = () => dailyDeploymentCountSnapshots;
export const getLastSnapshot = () => lastSnapshot;
export const getAllSnapshots = () => allSnapshots;

export const startAutoRefresh = () => {
  console.log(`Will auto-refresh at an interval of ${Math.round(autoRefreshInterval / 1000)} secs`);
  setInterval(async () => {
    console.log("Auto-refreshing...");
    await refreshData();
  }, autoRefreshInterval);
};

export const refreshData = async () => {
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
  // if (fs.existsSync(cacheFolder)) {
  //   fs.rmSync(deploymentsCachePath, { force: true });
  //   fs.rmSync(leasesCachePath, { force: true });
  //   fs.rmSync(bidsCachePath, { force: true });
  //   fs.rmdirSync(cacheFolder);
  // }

  await dbProvider.clearDatabase();

  await initialize();

  return true;
};

export const initialize = async (firstInit: boolean = false) => {
  isLoadingData = true;
  try {
    // TODO Replace with backup database
    // if (!fs.existsSync(cacheFolder)) {
    //   fs.mkdirSync(cacheFolder);
    // }

    const nodeList = await loadNodeList();
    const node = pickRandomElement(nodeList);

    console.log("Selected node: " + node);

    const leases = await loadLeases(node);
    const deployments = await loadDeployments(node);
    const bids = await loadBids(node);

    lastRefreshDate = new Date();

    await dbProvider.init();

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

    // averagePrice = (averagePriceByBlock * 31 * 24 * 60 * 60) / averageBlockTime;
    // const roundedPriceAkt = Math.round((averagePrice / 1000000 + Number.EPSILON) * 100) / 100;
    // console.log(`That is ${roundedPriceAkt} AKT / month`);

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




// TODO replace with per block 


async function loadLeases(node) {
  let leases = null;

  // if (fs.existsSync(leasesCachePath)) {
  //   leases = require(leasesCachePath);
  //   console.log("Loaded leases from cache");
  // } else {
  //   leases = await loadWithPagination(
  //     node + "/akash/market/v1beta1/leases/list",
  //     "leases",
  //     paginationLimit
  //   );
  //   fs.writeFileSync(leasesCachePath, JSON.stringify(leases));
  // }

  leases = await loadWithPagination(
    node + "/akash/market/v1beta1/leases/list",
    "leases",
    paginationLimit
  );

  console.log(`Found ${leases.length} leases`);

  return leases;
}

async function loadDeployments(node) {
  let deployments = null;

  // if (fs.existsSync(deploymentsCachePath)) {
  //   deployments = require(deploymentsCachePath);
  //   console.log("Loaded deployments from cache");
  // } else {
  //   deployments = await loadWithPagination(
  //     node + "/akash/deployment/v1beta1/deployments/list",
  //     "deployments",
  //     paginationLimit
  //   );
  //   fs.writeFileSync(deploymentsCachePath, JSON.stringify(deployments));
  // }

  deployments = await loadWithPagination(
    node + "/akash/deployment/v1beta1/deployments/list",
    "deployments",
    paginationLimit
  );

  console.log(`Found ${deployments.length} deployments`);

  return deployments;
}

async function loadBids(node) {
  let bids = null;

  // if (fs.existsSync(bidsCachePath)) {
  //   bids = require(bidsCachePath);
  //   console.log("Loaded bids from cache");
  // } else {
  //   bids = await loadWithPagination(
  //     node + "/akash/market/v1beta1/bids/list",
  //     "bids",
  //     paginationLimit
  //   );
  //   fs.writeFileSync(bidsCachePath, JSON.stringify(bids));
  // }

  bids = await loadWithPagination(
    node + "/akash/market/v1beta1/bids/list",
    "bids",
    paginationLimit
  );

  console.log(`Found ${bids.length} bids`);

  return bids;
}