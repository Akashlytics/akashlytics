import { Sequelize, DataTypes, UUIDV4, Model, Association } from "sequelize";

export const sqliteDatabasePath = "./data/database.sqlite";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: sqliteDatabasePath,
  logging: false,
  define: {
    freezeTableName: true,
  },
});

export { Op, Sequelize } from "sequelize";

export class Lease extends Model {
  public id!: string;
  public deploymentId!: string;
  public readonly deployment?: Deployment;
  public owner!: string;
  public dseq!: string;
  public oseq!: string;
  public gseq!: string;
  public provider!: string;
  public state!: string;
  public startDate!: string;
  public endDate!: string;
  public createdHeight!: number;
  public closedHeight?: number;
  public price!: number;
  public withdrawnAmount!: number;
  public lastWithdrawHeight?: number;
}

Lease.init({
  id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  deploymentId: { type: DataTypes.UUID },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  oseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.STRING, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: true },
  createdHeight: { type: DataTypes.NUMBER, allowNull: false },
  closedHeight: { type: DataTypes.NUMBER, allowNull: true },
  price: { type: DataTypes.NUMBER, allowNull: false },
  withdrawnAmount: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
  lastWithdrawHeight: { type: DataTypes.NUMBER, allowNull: true },
}, {
  tableName: "lease",
  modelName: "lease",
  sequelize
});

export class Deployment extends Model {
  public id!: string;
  public owner!: string;
  public dseq!: number;
  public state?: string;
  public escrowAccountTransferredAmount?: number;
  public readonly datetime?: Date;
  public readonly startDate?: Date;
  public createdHeight!: number;
  public balance!: number;
  public deposit!: number;
  public readonly leases?: Lease[];
};

Deployment.init({
  id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true, allowNull: false },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  escrowAccountTransferredAmount: { type: DataTypes.NUMBER, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
  createdHeight: { type: DataTypes.NUMBER, allowNull: false },
  balance: { type: DataTypes.NUMBER, allowNull: false },
  deposit: { type: DataTypes.NUMBER, allowNull: false },
},{
  tableName: "deployment",
  modelName: "deployment",
  sequelize
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


export class Bid extends Model {
  public owner!: string;
  public dseq!: number;
  public gseq!: number;
  public oseq!: number;
  public provider!: number;
  public price!: number;
};

Bid.init({
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  oseq: { type: DataTypes.NUMBER, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: "bid",
  modelName: "bid",
  sequelize
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
  public date!: string;
  public price!: number;
}

PriceHistory.init({
  id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
}, {
  tableName: "priceHistory",
  modelName: "priceHistory",
  sequelize
});

export class DailyNetworkRevenue extends Model {
  public id!: string;
  public date!: string;
  public amount!: number;
  public amountAkt!: number;
  public amountUAkt?: number;
  public aktPrice!: number;
  public leaseCount!: number;
}

DailyNetworkRevenue.init({
  id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  amount: { type: DataTypes.NUMBER, allowNull: false },
  amountAkt: { type: DataTypes.NUMBER, allowNull: false },
  amountUAkt: { type: DataTypes.NUMBER, allowNull: false },
  aktPrice: { type: DataTypes.NUMBER, allowNull: false },
  leaseCount: { type: DataTypes.NUMBER, allowNull: false }
}, {
  tableName: "dailyNetworkRevenue",
  modelName: "dailyNetworkRevenue",
  sequelize
});

export class Block extends Model {
  public height!: number;
  public readonly datetime!: Date;
  public firstBlockOfDay: boolean;
}

Block.init({
  height: { type: DataTypes.NUMBER, primaryKey: true, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
  firstBlockOfDay: { type: DataTypes.BOOLEAN, allowNull: false }
}, {
  tableName: "block",
  modelName: "block",
  sequelize
});

export class Transaction extends Model {
  public id!: string;
  public hash!: string;
  public index!: number;
  public height!: number;
  public downloaded!: boolean;
  public hasInterestingType!: boolean;
  public hasDownloadError!: boolean;
  public hasProcessingError!: boolean;
  public readonly block?: Block;
}

Transaction.init({
  id: { type: DataTypes.UUID, primaryKey: true },
  hash: { type: DataTypes.STRING, allowNull: false },
  index: { type: DataTypes.NUMBER, allowNull: false },
  height: {
    type: DataTypes.NUMBER,
    allowNull: false,
    references: { model: Block, key: "height" }
  },
  downloaded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  hasInterestingTypes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  hasDownloadError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  hasProcessingError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: "transaction",
  modelName: "transaction",
  sequelize
});

export class Message extends Model {
  public id!: string;
  public txId!: string;
  public type!: string;
  public index!: number;
  public isInterestingType!: boolean;
  public isProcessed!: boolean;
  public readonly transaction?: Transaction;
  
  public static associations: {
    transaction: Association<Message, Transaction>;
  };
}

Message.init({
  id: { type: DataTypes.UUID, primaryKey: true },
  txId: {
    type: DataTypes.UUID,
    references: { model: Transaction, key: "id" }
  },
  type: { type: DataTypes.STRING, allowNull: false },
  index: { type: DataTypes.NUMBER, allowNull: false },
  isInterestingType: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isProcessed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: "message",
  modelName: "message",
  sequelize
});

Transaction.hasMany(Message);
Message.belongsTo(Transaction, { foreignKey: "txId" });

Block.hasMany(Transaction);
Transaction.belongsTo(Block, { foreignKey: "height" });