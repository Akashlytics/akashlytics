import { Block, Day, Op } from "./schema";
import { subHours } from "date-fns";

export const getDashboardData = async () => {
  console.time("latestBlock");
  const latestBlockStats = await Block.findOne({
    where: {
      isProcessed: true
    },
    order: [["height", "DESC"]]
  });
  console.timeEnd("latestBlock");

  console.time("compareBlock");
  const compareDate = subHours(latestBlockStats.datetime, 24);
  const compareBlockStats = await Block.findOne({
    order: [["datetime", "ASC"]],
    where: {
      datetime: { [Op.gte]: compareDate }
    }
  });
  console.timeEnd("compareBlock");

  return {
    now: {
      date: latestBlockStats.datetime,
      height: latestBlockStats.height,
      activeLeaseCount: latestBlockStats.activeLeaseCount,
      totalLeaseCount: latestBlockStats.totalLeaseCount,
      totalUAktSpent: latestBlockStats.totalUAktSpent,
      activeCPU: latestBlockStats.activeCPU,
      activeMemory: latestBlockStats.activeMemory,
      activeStorage: latestBlockStats.activeStorage
    },
    compare: {
      date: compareBlockStats.datetime,
      height: compareBlockStats.height,
      activeLeaseCount: compareBlockStats.activeLeaseCount,
      totalLeaseCount: compareBlockStats.totalLeaseCount,
      totalUAktSpent: compareBlockStats.totalUAktSpent,
      activeCPU: compareBlockStats.activeCPU,
      activeMemory: compareBlockStats.activeMemory,
      activeStorage: compareBlockStats.activeStorage
    }
  };
};

export const getGraphData = async (dataName: string) => {
  console.time("getGraphData");
  const result = await Day.findAll({
    attributes: ["date"],
    include: [
      {
        model: Block,
        as: "lastBlock",
        attributes: [dataName],
        required: true
      }
    ]
  });
  console.timeEnd("getGraphData");

  const stats = result.map((day) => ({
    date: day.date,
    value: day.lastBlock[dataName]
  }));

  const dashboardData = await getDashboardData();

  return {
    currentValue: dashboardData.now[dataName],
    compareValue: dashboardData.compare[dataName],
    snapshots: stats
  };
};
