import { executionMode, ExecutionMode } from "@src/shared/constants";
import { download } from "@src/shared/utils/download";
import { bytesToHumanReadableSize } from "@src/shared/utils/files";
import fs from "fs";
import {
  Bid,
  Block,
  Transaction,
  Deployment,
  DeploymentGroup,
  DeploymentGroupResource,
  Lease,
  Message,
  sequelize,
  sqliteDatabasePath,
  Day,
  Provider,
  ProviderAttribute,
  ProviderAttributeSignature
} from "./schema";

/**
 * Initiate database schema
 * Restore backup from current version if it exists
 */
export const initDatabase = async () => {
  const databaseFileExists = fs.existsSync(sqliteDatabasePath);
  if (databaseFileExists && (executionMode === ExecutionMode.DownloadAndSync || executionMode === ExecutionMode.RebuildAll)) {
    console.log("Deleting existing database files.");
    await Promise.all([
      fs.promises.rm(sqliteDatabasePath, { force: true }),
      fs.promises.rm("./data/latestDownloadedHeight.txt", { force: true }),
      fs.promises.rm("./data/latestDownloadedTxHeight.txt", { force: true })
    ]);
  }

  if (executionMode === ExecutionMode.DownloadAndSync) {
    console.log("Downloading database files...");
    await Promise.all([
      download("https://storage.googleapis.com/akashlytics-deploy-public/database.sqlite", sqliteDatabasePath),
      download("https://storage.googleapis.com/akashlytics-deploy-public/latestDownloadedHeight.txt", "./data/latestDownloadedHeight.txt"),
      download("https://storage.googleapis.com/akashlytics-deploy-public/latestDownloadedTxHeight.txt", "./data/latestDownloadedTxHeight.txt")
    ]);
    console.log("Database downloaded");
  }

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  if (executionMode === ExecutionMode.RebuildAll) {
    await Bid.drop();
    await Lease.drop();
    await DeploymentGroupResource.drop();
    await DeploymentGroup.drop();
    await Deployment.drop();
    await Provider.drop();
    await ProviderAttribute.drop();
    await ProviderAttributeSignature.drop();
    await Message.drop();
    await Transaction.drop();
    await Block.drop();
    await Day.drop();
  }

  await Day.sync();
  await Block.sync();
  await Transaction.sync();
  await Message.sync();

  await Deployment.sync({ force: false });
  await DeploymentGroup.sync({ force: false });
  await DeploymentGroupResource.sync({ force: false });
  await Lease.sync({ force: false });
  await Bid.sync({ force: false });
  await Provider.sync({ force: false });
  await ProviderAttribute.sync({ force: false });
  await ProviderAttributeSignature.sync({ force: false });

  Deployment.hasMany(DeploymentGroup);
  DeploymentGroup.belongsTo(Deployment, { foreignKey: "deploymentId" });

  DeploymentGroup.hasMany(DeploymentGroupResource);
  DeploymentGroupResource.belongsTo(DeploymentGroup, { foreignKey: "deploymentGroupId" });

  DeploymentGroup.hasMany(Lease, { foreignKey: "deploymentGroupId" });
  Lease.belongsTo(DeploymentGroup);

  Deployment.hasMany(Lease, { foreignKey: "deploymentId" });
  Lease.belongsTo(Deployment);
};

export async function getDbSize() {
  const dbSize = await fs.promises.stat("./data/database.sqlite");
  return bytesToHumanReadableSize(dbSize.size);
}
