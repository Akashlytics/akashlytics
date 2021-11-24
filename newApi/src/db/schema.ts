import { Sequelize, DataTypes, UUIDV4, Model, Association } from "sequelize";

export const sqliteDatabasePath = "./data/database.sqlite";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: sqliteDatabasePath,
  logging: true,
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

// export class ActiveLease extends Model {
//   public id!: string;
//   public deploymentId!: string;
//   public readonly deployment: Deployment;
//   public totalCpu!: number;
//   public totalMemory!: number;
//   public totalStorage!: number;
// }

// ActiveLease.init(
//   {
//     id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
//     deploymentId: { type: DataTypes.UUID },
//     totalCpu: { type: DataTypes.INTEGER, allowNull: false },
//     totalMemory: { type: DataTypes.BIGINT, allowNull: false },
//     totalStorage: { type: DataTypes.BIGINT, allowNull: false },
//   },
//   {
//     tableName: "activeLease",
//     modelName: "activeLease",
//     sequelize
//   }
// );

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
  public startDate!: Date;
  public endDate!: Date;
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
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: true },
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
      { unique: false, fields: ["deploymentId"] }
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
  public readonly datetime?: Date;
  public readonly startDate?: Date;
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
    startDate: { type: DataTypes.DATE, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false },
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

export class PriceHistory extends Model {
  public id!: string;
  public date!: Date;
  public price!: number;
}

PriceHistory.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "priceHistory",
    modelName: "priceHistory",
    sequelize
  }
);

export class DailyNetworkRevenue extends Model {
  public id!: string;
  public date!: string;
  public amount!: number;
  public amountUAkt!: number;
  public aktPrice!: number;
  public leaseCount!: number;
}

DailyNetworkRevenue.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    amount: { type: DataTypes.DECIMAL, allowNull: false },
    amountUAkt: { type: DataTypes.INTEGER, allowNull: false },
    aktPrice: { type: DataTypes.DECIMAL, allowNull: false },
    leaseCount: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: "dailyNetworkRevenue",
    modelName: "dailyNetworkRevenue",
    sequelize
  }
);

export class Block extends Model {
  public height!: number;
  public readonly datetime!: Date;
  public firstBlockOfDay: boolean;
}

Block.init(
  {
    height: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false },
    firstBlockOfDay: { type: DataTypes.BOOLEAN, allowNull: false }
  },
  {
    tableName: "block",
    modelName: "block",
    indexes: [{ unique: false, fields: ["datetime"] }],
    sequelize
  }
);

export class BlockStatistic extends Model {
  public height!: number;
  public totalUAktSpent!: number;
  public activeLeaseCount: number;
  public totalLeaseCount: number;
  public activeCPU: number;
  public activeMemory: number;
  public activeStorage: number;
  public readonly block?: Block;
}

BlockStatistic.init(
  {
    height: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: Block, key: "height" } },
    totalUAktSpent: { type: DataTypes.BIGINT, allowNull: false },
    activeLeaseCount: { type: DataTypes.INTEGER, allowNull: false },
    totalLeaseCount: { type: DataTypes.INTEGER, allowNull: false },
    activeCPU: { type: DataTypes.INTEGER, allowNull: false },
    activeMemory: { type: DataTypes.BIGINT, allowNull: false },
    activeStorage: { type: DataTypes.BIGINT, allowNull: false }
  },
  {
    tableName: "blockStatistic",
    modelName: "blockStatistic",
    sequelize
  }
);

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
    downloaded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasInterestingTypes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasDownloadError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasProcessingError: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  {
    tableName: "transaction",
    modelName: "transaction",
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
    height: { type: DataTypes.BIGINT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    typeCategory: { type: DataTypes.STRING, allowNull: true },
    index: { type: DataTypes.INTEGER, allowNull: false },
    indexInBlock: { type: DataTypes.INTEGER, allowNull: false },
    isInterestingType: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isProcessed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  {
    tableName: "message",
    modelName: "message",
    sequelize
  }
);

Transaction.hasMany(Message);
Message.belongsTo(Transaction, { foreignKey: "txId" });

Block.hasMany(Transaction);
Transaction.belongsTo(Block, { foreignKey: "height" });

//BlockStatistic.hasOne(Block, { foreignKey: "height" });
Block.hasOne(BlockStatistic, { foreignKey: "height" });
