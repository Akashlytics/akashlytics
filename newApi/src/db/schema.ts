import { Sequelize, DataTypes, Op, Deferrable, DATEONLY, UUIDV4, Model } from "sequelize";

export const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
  define: {
    freezeTableName: true,
  },
});

export const Lease = sequelize.define("lease", {
  deploymentId: {
    type: DataTypes.UUID,
    references: { model: "deployment", key: "id" },
  },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

export const Deployment = sequelize.define("deployment", {
  id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true, allowNull: false },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  escrowAccountTransferredAmount: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

export const DeploymentGroup = sequelize.define("deploymentGroup", {
  id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true, allowNull: false },
  deploymentId: {
    type: DataTypes.UUID,
    references: { model: "deployment", key: "id" },
  },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

export const DeploymentGroupResource = sequelize.define("deploymentGroupResource", {
  deploymentGroupId: {
    type: DataTypes.UUID,
    references: { model: "deploymentGroup", key: "id" },
  },
  cpuUnits: { type: DataTypes.STRING, allowNull: true },
  memoryQuantity: { type: DataTypes.STRING, allowNull: true },
  storageQuantity: { type: DataTypes.STRING, allowNull: true },
  count: { type: DataTypes.NUMBER, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
});

export const Bid = sequelize.define("bid", {
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  oseq: { type: DataTypes.NUMBER, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

export const StatsSnapshot = sequelize.define("statsSnapshot", {
  date: { type: DataTypes.STRING, allowNull: false },
  minActiveDeploymentCount: { type: DataTypes.NUMBER, allowNull: true },
  maxActiveDeploymentCount: { type: DataTypes.NUMBER, allowNull: true },
  minCompute: { type: DataTypes.NUMBER, allowNull: true },
  maxCompute: { type: DataTypes.NUMBER, allowNull: true },
  minMemory: { type: DataTypes.NUMBER, allowNull: true },
  maxMemory: { type: DataTypes.NUMBER, allowNull: true },
  minStorage: { type: DataTypes.NUMBER, allowNull: true },
  maxStorage: { type: DataTypes.NUMBER, allowNull: true },
  allTimeDeploymentCount: { type: DataTypes.NUMBER, allowNull: true },
  totalAktSpent: { type: DataTypes.NUMBER, allowNull: true },
});

export class PriceHistory extends Model {
  public id!: string;
  public date!: number;
  public price!: number;
}

PriceHistory.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  date: {
    type: DataTypes.NUMBER,
    allowNull: false
  },
  price: {
    type: DataTypes.NUMBER,
    allowNull: false
  },
}, {
  tableName: "priceHistory",
  sequelize
});