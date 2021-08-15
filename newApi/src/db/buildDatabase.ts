import { loadNodeList } from "@src/akash/nodes";
import { pickRandomElement } from "@src/shared/utils/random";
import fs from "fs";
import { Bid, Deployment, DeploymentGroup, DeploymentGroupResource, Lease, PriceHistory, sequelize, StatsSnapshot } from "./schema";

const cacheFolder = "./cache/";
let isLoadingData = false;

export const initialize = async (firstInit) => {
  isLoadingData = true;
  try {
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder);
    }

    const nodeList = await loadNodeList();
    const node = pickRandomElement(nodeList);

    console.log("Selected node: " + node);

    // const leases = await loadLeases(node);
    // const deployments = await loadDeployments(node);
    // const bids = await loadBids(node);

    // lastRefreshDate = new Date();

    // await dbProvider.init();

    // if (firstInit) {
    //   await dbProvider.initSnapshotsFromFile();
    // }

    // console.log(`Inserting ${deployments.length} deployments into the database`);
    // console.time("insertData");
    // console.time("insertDeployments");
    // await dbProvider.addDeployments(deployments);
    // console.timeEnd("insertDeployments");

    // console.log(`Inserting ${leases.length} leases into the database`);
    // console.time("insertLeases");
    // await dbProvider.addLeases(leases);
    // console.timeEnd("insertLeases");

    // console.log(`Inserting ${bids.length} bids into the database`);
    // console.time("insertBids");
    // await dbProvider.addBids(bids);
    // console.timeEnd("insertBids");
    // console.timeEnd("insertData");

    // deploymentCount = await dbProvider.getDeploymentCount();
    // activeDeploymentCount = await dbProvider.getActiveDeploymentCount();
    // console.log(`There is ${activeDeploymentCount} active deployments`);
    // console.log(`There was ${deploymentCount} total deployments`);

    // activeDeploymentSnapshots = await dbProvider.getActiveDeploymentSnapshots();
    // totalAKTSpentSnapshots = await dbProvider.getTotalAKTSpentSnapshots();
    // allTimeDeploymentCountSnapshots = await dbProvider.getAllTimeDeploymentCountSnapshots();
    // computeSnapshots = await dbProvider.getComputeSnapshots();
    // memorySnapshots = await dbProvider.getMemorySnapshots();
    // storageSnapshots = await dbProvider.getStorageSnapshots();
    // dailyAktSpentSnapshots = await dbProvider.getDailyAktSpentSnapshots();
    // dailyDeploymentCountSnapshots = await dbProvider.getDailyDeploymentCountSnapshots();
    // lastSnapshot = await dbProvider.getLastSnapshot();
    // allSnapshots = await dbProvider.getAllSnapshots();
    // dailyAktSpent = await dbProvider.getDailyAktSpent();
    // dailyDeploymentCount = await dbProvider.getDailyDeploymentCount();

    // totalAKTSpent = await dbProvider.getTotalAKTSpent();
    // const roundedAKTSpent = Math.round((totalAKTSpent / 1000000 + Number.EPSILON) * 100) / 100;
    // console.log(`There was ${roundedAKTSpent} akt spent on cloud resources`);

    // totalResourcesLeased = await dbProvider.getTotalResourcesLeased();
    // console.log(
    //   `Total resources leased: ${totalResourcesLeased.cpuSum} cpu / ${totalResourcesLeased.memorySum} memory / ${totalResourcesLeased.storageSum} storage`
    // );

    // const averagePriceByBlock = await dbProvider.getPricingAverage();
    // console.log(`The average price for a small instance is: ${averagePriceByBlock} uakt / block`);

    // averagePrice = (averagePriceByBlock * 31 * 24 * 60 * 60) / averageBlockTime;
    // const roundedPriceAkt = Math.round((averagePrice / 1000000 + Number.EPSILON) * 100) / 100;

    // console.log(`That is ${roundedPriceAkt} AKT / month`);

    // await dataSnapshotsHandler.takeSnapshot(
    //   activeDeploymentCount,
    //   totalResourcesLeased.cpuSum,
    //   totalResourcesLeased.memorySum,
    //   totalResourcesLeased.storageSum,
    //   deploymentCount,
    //   totalAKTSpent
    // );
  } catch (err) {
    console.error("Could not initialize", err);
  } finally {
    isLoadingData = false;
  }
};

/**
 * Initiate database schema
 * Restore backup from current version if it exists
 */
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  await Lease.sync({ force: true });
  await Deployment.sync({ force: true });
  await DeploymentGroup.sync({ force: true });
  await DeploymentGroupResource.sync({ force: true });
  await Bid.sync({ force: true });
  await StatsSnapshot.sync();
  await PriceHistory.sync();

  Deployment.hasMany(DeploymentGroup);
  DeploymentGroup.belongsTo(Deployment, { foreignKey: "deploymentId" });

  DeploymentGroup.hasMany(DeploymentGroupResource);
  DeploymentGroupResource.belongsTo(DeploymentGroup, { foreignKey: "deploymentGroupId" });

  // TODO deployments only have one lease??
  Deployment.hasOne(Lease, { foreignKey: "deploymentId" });
  Lease.belongsTo(Deployment);
};