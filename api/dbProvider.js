const { Sequelize, DataTypes, Op, Deferrable, DATEONLY } = require("sequelize");
const { averageBlockTime } = require("./constants");
const baseSnapshots = require("./data/snapshotsBackup.json");
const dataSnapshotsHandler = require("./dataSnapshotsHandler");

const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
  define: {
    freezeTableName: true,
  },
});

const Lease = sequelize.define("lease", {
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

const Deployment = sequelize.define("deployment", {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  escrowAccountTransferredAmount: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

const DeploymentGroup = sequelize.define("deploymentGroup", {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
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

const DeploymentGroupResource = sequelize.define("deploymentGroupResource", {
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

const Bid = sequelize.define("bid", {
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  oseq: { type: DataTypes.NUMBER, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
});

const StatsSnapshot = sequelize.define("statsSnapshot", {
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

exports.clearDatabase = async () => {
  console.log("Cleaning database...");

  await Bid.drop();
  await Lease.drop();
  await DeploymentGroupResource.drop();
  await DeploymentGroup.drop();
  await Deployment.drop();

  await exports.init();
};

exports.init = async () => {
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

  Deployment.hasMany(DeploymentGroup);
  DeploymentGroup.belongsTo(Deployment, { foreignKey: "deploymentId" });

  DeploymentGroup.hasMany(DeploymentGroupResource);
  DeploymentGroupResource.belongsTo(DeploymentGroup, { foreignKey: "deploymentGroupId" });

  Deployment.hasOne(Lease, { foreignKey: "deploymentId" });
  Lease.belongsTo(Deployment);
};

exports.addLease = async (lease) => {
  const createdLease = await Lease.create({
    owner: lease.lease.lease_id.owner,
    dseq: lease.lease.lease_id.dseq,
    state: lease.lease.state,
    price: convertPrice(lease.lease.price),
    datetime: blockHeightToDatetime(lease.lease.created_at),
  });

  createdLease.setDeployment(
    await Deployment.findOne({
      where: {
        owner: lease.lease.lease_id.owner,
        dseq: lease.lease.lease_id.dseq,
      },
    })
  );
};

exports.addDeployment = async (deployment) => {
  const createdDeployment = await Deployment.create({
    owner: deployment.deployment.deployment_id.owner,
    dseq: deployment.deployment.deployment_id.dseq,
    state: deployment.deployment.state,
    escrowAccountTransferredAmount: deployment.escrow_account.transferred.amount,
    datetime: blockHeightToDatetime(deployment.deployment.created_at),
  });

  for (const group of deployment.groups) {
    const createdGroup = await createdDeployment.createDeploymentGroup({
      owner: group.group_id.owner,
      dseq: group.group_id.dseq,
      gseq: group.group_id.gseq,
      state: group.state,
      datetime: blockHeightToDatetime(group.created_at),
    });

    for (const resource of group.group_spec.resources) {
      await createdGroup.createDeploymentGroupResource({
        cpuUnits: resource.resources.cpu.units.val,
        memoryQuantity: resource.resources.memory.quantity.val,
        storageQuantity: resource.resources.storage.quantity.val,
        count: resource.count,
        price: convertPrice(resource.price),
      });
    }
  }
};

exports.addBid = async (bid) => {
  await Bid.create({
    owner: bid.bid.bid_id.owner,
    dseq: bid.bid.bid_id.dseq,
    gseq: bid.bid.bid_id.gseq,
    oseq: bid.bid.bid_id.oseq,
    provider: bid.bid.bid_id.provider,
    state: bid.bid.state,
    price: convertPrice(bid.bid.price),
    datetime: blockHeightToDatetime(bid.bid.created_at),
  });
};

function convertPrice(priceObj) {
  if (priceObj.denom === "uakt") {
    return parseInt(priceObj.amount);
  } else {
    throw "Invalid price denomination"; // TODO: Handle others
  }
}

exports.getTotalLeaseCount = async () => {
  return await Lease.count();
};
exports.getActiveLeaseCount = async () => {
  return await Lease.count({
    where: {
      state: "active",
    },
  });
};

exports.getActiveDeploymentCount = async () => {
  return await Deployment.count({
    where: {
      state: "active",
      "$lease.state$": "active",
    },
    include: Lease,
  });
};

exports.getDeploymentCount = async () => {
  return await Deployment.count({
    distinct: true,
    include: {
      model: Lease,
      required: true,
    },
  });
};

function blockHeightToDatetime(blockHeight) {
  const firstBlockDate = new Date("2021-03-08 15:00:00 UTC");
  let blockDate = new Date("2021-03-08 15:00:00 UTC");
  blockDate.setSeconds(firstBlockDate.getSeconds() + averageBlockTime * (blockHeight - 1));

  blockDate.setHours(0, 0, 0, 0);

  return blockDate;
}

exports.getPricingAverage = async () => {
  const activeDeploymentResources = await DeploymentGroupResource.findAll({
    where: {
      "$deploymentGroup.deployment.state$": "active",
      "$deploymentGroup.deployment.lease.state$": "active",
      cpuUnits: "100",
      memoryQuantity: "536870912", // 512Mi
      storageQuantity: "536870912", // 512Mi
      count: 1,
    },
    include: {
      model: DeploymentGroup,
      include: {
        model: Deployment,
        include: {
          model: Lease,
          required: true,
        },
      },
    },
  });

  if (activeDeploymentResources.length === 0) return 0;

  const priceSum = activeDeploymentResources
    .map((x) => x.deploymentGroup.deployment.lease.price)
    .reduce((a, b) => a + b);
  const average = priceSum / activeDeploymentResources.length;

  //console.log(activeDeploymentResources.map(x => x.price + " / " + x.deploymentGroup.deployment.lease.price));

  return average;
};

exports.getTotalAKTSpent = async () => {
  const total = await Deployment.sum("escrowAccountTransferredAmount");
  return total;
};

exports.getTotalResourcesLeased = async () => {
  const totalResources = await DeploymentGroupResource.findAll({
    attributes: ["count", "cpuUnits", "memoryQuantity", "storageQuantity"],
    where: {
      "$deploymentGroup.deployment.state$": "active",
      "$deploymentGroup.deployment.lease.state$": "active",
    },
    include: {
      model: DeploymentGroup,
      include: {
        model: Deployment,
        include: {
          model: Lease,
          required: true,
        },
      },
    },
  });

  return {
    cpuSum: totalResources.map((x) => x.cpuUnits * x.count).reduce((a, b) => a + b),
    memorySum: totalResources.map((x) => x.memoryQuantity * x.count).reduce((a, b) => a + b),
    storageSum: totalResources.map((x) => x.storageQuantity * x.count).reduce((a, b) => a + b),
  };
};

exports.updateDaySnapshot = async (date, snapshot) => {
  const dateStr = date.toISOString().split("T")[0];

  const existingSnapshot = await this.getSnapshot(date);

  const { date: unusedDate, ...stats } = snapshot;

  if (existingSnapshot) {
    await StatsSnapshot.update(stats, {
      where: {
        date: dateStr,
      },
    });
  } else {
    await StatsSnapshot.create({
      date: dateStr,
      ...stats,
    });
  }
};

exports.getSnapshot = async (date) => {
  const dateStr = date.toISOString().split("T")[0];

  return await StatsSnapshot.findOne({
    where: {
      date: dateStr,
    },
  });
};

exports.getActiveDeploymentSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "minActiveDeploymentCount", "maxActiveDeploymentCount"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      min: x.minActiveDeploymentCount,
      max: x.maxActiveDeploymentCount,
      average: Math.round((x.minActiveDeploymentCount + x.maxActiveDeploymentCount) / 2),
    }))
    .reverse();
};

exports.getTotalAKTSpentSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "totalAktSpent"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      value: x.totalAktSpent * 0.000001,
    }))
    .reverse();
};

exports.getAllTimeDeploymentCountSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "allTimeDeploymentCount"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      value: x.allTimeDeploymentCount,
    }))
    .reverse();
};

exports.getComputeSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "minCompute", "maxCompute"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      min: x.minCompute,
      max: x.maxCompute,
      average: Math.round((x.minCompute + x.maxCompute) / 2),
    }))
    .reverse();
};

exports.getMemorySnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "minMemory", "maxMemory"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      min: x.minMemory,
      max: x.maxMemory,
      average: Math.round((x.minMemory + x.maxMemory) / 2),
    }))
    .reverse();
};

exports.getStorageSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    attributes: ["date", "minStorage", "maxStorage"],
    order: [["date", "DESC"]],
    where: {
      date: {
        [Op.not]: dataSnapshotsHandler.getDayStr(),
      },
    },
    limit: 10,
  });

  return results
    .map((x) => x.toJSON())
    .map((x) => ({
      date: x.date,
      min: x.minStorage,
      max: x.maxStorage,
      average: Math.round((x.minStorage + x.maxStorage) / 2),
    }))
    .reverse();
};

exports.getAllSnapshots = async () => {
  const results = await StatsSnapshot.findAll({
    order: ["date"],
  });

  return results.map((x) => x.toJSON());
};

exports.initSnapshotsFromFile = async () => {
  console.log("Loading " + baseSnapshots.length + " snapshots from file");
  await StatsSnapshot.bulkCreate(baseSnapshots);
};
