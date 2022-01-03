import { Sequelize, DataTypes, UUIDV4, Model, Association } from "sequelize";

export const sqliteDatabasePath = "./data/database.sqlite";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: sqliteDatabasePath,
  logging: false,
  define: {
    freezeTableName: true
  }
});
// export const sequelize = new Sequelize("postgres://postgres:@localhost:5432/postgres",{
//     logging: false,
//     define: {
//       freezeTableName: true
//     }
//   });

export { Op, Sequelize } from "sequelize";

export class Lease extends Model {
  public id!: string;
  public deploymentId!: string;
  public readonly deployment: Deployment;
  public deploymentGroupId!: string;
  public readonly deploymentGroup: DeploymentGroup;
  public owner!: string;
  public dseq!: number;
  public oseq!: number;
  public gseq!: number;
  public provider!: string;
  public createdHeight!: number;
  public closedHeight?: number;
  public price!: number;
  public withdrawnAmount!: number;
  public lastWithdrawHeight?: number;

  // Stats
  cpuUnits: number;
  memoryQuantity: number;
  storageQuantity: number;
}

Lease.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    deploymentId: { type: DataTypes.UUID },
    deploymentGroupId: { type: DataTypes.UUID, references: { model: "deploymentGroup", key: "id" } },
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.INTEGER, allowNull: false },
    oseq: { type: DataTypes.INTEGER, allowNull: false },
    gseq: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    createdHeight: { type: DataTypes.INTEGER, allowNull: false },
    closedHeight: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: false },
    withdrawnAmount: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    lastWithdrawHeight: { type: DataTypes.INTEGER, allowNull: true },
    // Stats
    cpuUnits: { type: DataTypes.INTEGER, allowNull: false },
    memoryQuantity: { type: DataTypes.BIGINT, allowNull: false },
    storageQuantity: { type: DataTypes.BIGINT, allowNull: false }
  },
  {
    tableName: "lease",
    modelName: "lease",
    indexes: [
      { unique: false, fields: ["closedHeight"] },
      { unique: false, fields: ["deploymentId"] },
      { unique: false, fields: ["owner", "dseq", "gseq", "oseq"] }
    ],
    sequelize
  }
);

export class Deployment extends Model {
  public id!: string;
  public owner!: string;
  public dseq!: number;
  public state?: string;
  public escrowAccountTransferredAmount?: number;
  public createdHeight!: number;
  public balance!: number;
  public deposit!: number;
  public readonly leases?: Lease[];
}

Deployment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.INTEGER, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    escrowAccountTransferredAmount: { type: DataTypes.INTEGER, allowNull: false },
    createdHeight: { type: DataTypes.INTEGER, allowNull: false },
    balance: { type: DataTypes.INTEGER, allowNull: false },
    deposit: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "deployment",
    modelName: "deployment",
    sequelize
  }
);

export class DeploymentGroup extends Model {
  public id!: string;
  public owner!: string;
  public dseq!: number;
  public gseq!: number;
  public readonly leases?: Lease[];
  public readonly deploymentGroupResources?: DeploymentGroupResource[];
}

DeploymentGroup.init(
  {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true, allowNull: false },
    deploymentId: {
      type: DataTypes.UUID,
      references: { model: "deployment", key: "id" }
    },
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.INTEGER, allowNull: false },
    gseq: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "deploymentGroup",
    modelName: "deploymentGroup",
    indexes: [
      {
        unique: false,
        fields: ["owner", "dseq", "gseq"]
      }
    ],
    sequelize
  }
);

export class DeploymentGroupResource extends Model {
  public deploymentGroupId!: string;
  public cpuUnits!: number;
  public memoryQuantity!: number;
  public storageQuantity!: number;
  public count!: number;
  public price!: number;
}

DeploymentGroupResource.init(
  {
    deploymentGroupId: {
      type: DataTypes.UUID,
      references: { model: "deploymentGroup", key: "id" }
    },
    cpuUnits: { type: DataTypes.INTEGER, allowNull: true },
    memoryQuantity: { type: DataTypes.BIGINT, allowNull: true },
    storageQuantity: { type: DataTypes.BIGINT, allowNull: true },
    count: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "deploymentGroupResource",
    modelName: "deploymentGroupResource",
    indexes: [{ unique: false, fields: ["deploymentGroupId"] }],
    sequelize
  }
);

export class Bid extends Model {
  public owner!: string;
  public dseq!: number;
  public gseq!: number;
  public oseq!: number;
  public provider!: number;
  public price!: number;
}

Bid.init(
  {
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.INTEGER, allowNull: false },
    gseq: { type: DataTypes.INTEGER, allowNull: false },
    oseq: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
  },
  {
    tableName: "bid",
    modelName: "bid",
    indexes: [{ unique: false, fields: ["owner", "dseq", "gseq", "oseq", "provider"] }],
    sequelize
  }
);

export class Day extends Model {
  public id!: string;
  public date!: Date;
  public aktPrice?: number;
  public firstBlockHeight!: number;
  public lastBlockHeight?: number;
  public lastBlockHeightYet!: number;

  public readonly firstBlock!: Block;
  public readonly lastBlock?: Block;
  public readonly lastBlockYet!: Block;
}

Day.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    aktPrice: { type: DataTypes.INTEGER, allowNull: true },
    firstBlockHeight: { type: DataTypes.INTEGER, allowNull: false },
    lastBlockHeight: { type: DataTypes.INTEGER, allowNull: true },
    lastBlockHeightYet: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "day",
    modelName: "day",
    indexes: [
      { unique: true, fields: ["date"] },
      { unique: true, fields: ["firstBlockHeight"] },
      { unique: true, fields: ["lastBlockHeight"] }
    ],
    sequelize
  }
);

export class Block extends Model {
  public height!: number;
  public readonly datetime!: Date;
  public dayId!: string;
  // Stats
  public isProcessed!: boolean;
  public totalUAktSpent!: number;
  public activeLeaseCount: number;
  public totalLeaseCount: number;
  public activeCPU: number;
  public activeMemory: number;
  public activeStorage: number;

  public readonly day: Day;
  public readonly transactions?: Transaction[];
}

Block.init(
  {
    height: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false },
    //firstBlockOfDay: { type: DataTypes.BOOLEAN, allowNull: false },
    dayId: { type: DataTypes.UUID, allowNull: false, references: { model: Day, key: "id" } },

    // Stats
    isProcessed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    totalUAktSpent: { type: DataTypes.BIGINT, allowNull: true },
    activeLeaseCount: { type: DataTypes.INTEGER, allowNull: true },
    totalLeaseCount: { type: DataTypes.INTEGER, allowNull: true },
    activeCPU: { type: DataTypes.INTEGER, allowNull: true },
    activeMemory: { type: DataTypes.BIGINT, allowNull: true },
    activeStorage: { type: DataTypes.BIGINT, allowNull: true }
  },
  {
    tableName: "block",
    modelName: "block",
    indexes: [
      { unique: false, fields: ["datetime"] },
      { unique: false, fields: ["dayId"] }
    ],
    sequelize
  }
);

export class Transaction extends Model {
  public id!: string;
  public hash!: string;
  public index!: number;
  public height!: number;
  public isProcessed!: boolean;
  public downloaded!: boolean;
  public hasInterestingType!: boolean;
  public hasDownloadError!: boolean;
  public hasProcessingError!: boolean;

  public readonly block?: Block;
  public readonly messages?: Message[];
}

Transaction.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    hash: { type: DataTypes.STRING, allowNull: false },
    index: { type: DataTypes.INTEGER, allowNull: false },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Block, key: "height" }
    },
    isProcessed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    downloaded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasInterestingTypes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasDownloadError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasProcessingError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  {
    tableName: "transaction",
    modelName: "transaction",
    indexes: [{ unique: false, fields: ["height"] }],
    sequelize
  }
);

export class Message extends Model {
  public id!: string;
  public txId!: string;
  public height!: number;
  public type!: string;
  public typeGroup!: string;
  public index!: number;
  public indexInBlock!: number;
  public isInterestingType!: boolean;
  public isProcessed!: boolean;
  public shouldProcess!: boolean;
  public relatedDeploymentId?: string;
  public readonly transaction?: Transaction;

  public static associations: {
    transaction: Association<Message, Transaction>;
  };
}

Message.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    txId: {
      type: DataTypes.UUID,
      references: { model: Transaction, key: "id" }
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Block, key: "height" }
    },
    type: { type: DataTypes.STRING, allowNull: false },
    typeCategory: { type: DataTypes.STRING, allowNull: true },
    index: { type: DataTypes.INTEGER, allowNull: false },
    indexInBlock: { type: DataTypes.INTEGER, allowNull: false },
    isInterestingType: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isProcessed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    shouldProcess: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    relatedDeploymentId: { type: DataTypes.STRING, allowNull: true }
  },
  {
    tableName: "message",
    modelName: "message",
    indexes: [{ unique: false, fields: ["txId"] }],
    sequelize
  }
);

Transaction.hasMany(Message, { foreignKey: "txId" });
Message.belongsTo(Transaction, { foreignKey: "txId" });

Block.hasMany(Transaction, { foreignKey: "height" });
Transaction.belongsTo(Block, { foreignKey: "height" });

Block.hasMany(Message, { foreignKey: "height" });
Message.belongsTo(Block, { foreignKey: "height" });

Day.hasMany(Block, { foreignKey: "dayId" });
Block.belongsTo(Day, { foreignKey: "dayId" });

Day.belongsTo(Block, { as: "firstBlock", foreignKey: "firstBlockHeight" });
Day.belongsTo(Block, { as: "lastBlock", foreignKey: "lastBlockHeight" });
Day.belongsTo(Block, { as: "lastBlockYet", foreignKey: "lastBlockHeightYet" });
