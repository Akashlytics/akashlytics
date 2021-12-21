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

  console.time("secondCompareBlock");
  const secondCompareDate = subHours(latestBlockStats.datetime, 48);
  const secondCompareBlockStats = await Block.findOne({
    order: [["datetime", "ASC"]],
    where: {
      datetime: { [Op.gte]: secondCompareDate }
    }
  });
  console.timeEnd("secondCompareBlock");

  return {
    now: {
      date: latestBlockStats.datetime,
      height: latestBlockStats.height,
      activeLeaseCount: latestBlockStats.activeLeaseCount,
      totalLeaseCount: latestBlockStats.totalLeaseCount,
      dailyLeaseCount: latestBlockStats.totalLeaseCount - compareBlockStats.totalLeaseCount,
      totalUAktSpent: latestBlockStats.totalUAktSpent,
      dailyUAktSpent: latestBlockStats.totalUAktSpent - compareBlockStats.totalUAktSpent,
      activeCPU: latestBlockStats.activeCPU,
      activeMemory: latestBlockStats.activeMemory,
      activeStorage: latestBlockStats.activeStorage
    },
    compare: {
      date: compareBlockStats.datetime,
      height: compareBlockStats.height,
      activeLeaseCount: compareBlockStats.activeLeaseCount,
      totalLeaseCount: compareBlockStats.totalLeaseCount,
      dailyLeaseCount: compareBlockStats.totalLeaseCount - secondCompareBlockStats.totalLeaseCount,
      totalUAktSpent: compareBlockStats.totalUAktSpent,
      dailyUAktSpent: compareBlockStats.totalUAktSpent - secondCompareBlockStats.totalUAktSpent,
      activeCPU: compareBlockStats.activeCPU,
      activeMemory: compareBlockStats.activeMemory,
      activeStorage: compareBlockStats.activeStorage
    }
  };
};

export const getGraphData = async (dataName: string) => {
  console.log("getGraphData: " + dataName);

  let graphFieldName = dataName;
  let isRelative = false;

  switch (dataName) {
    case "dailyUAktSpent":
      graphFieldName = "totalUAktSpent";
      isRelative = true;
      break;
    case "dailyLeaseCount":
      graphFieldName = "totalLeaseCount";
      isRelative = true;
      break;
  }

  console.time("getGraphData");
  const result = await Day.findAll({
    attributes: ["date"],
    include: [
      {
        model: Block,
        as: "lastBlock",
        attributes: [graphFieldName],
        required: true
      }
    ]
  });
  console.timeEnd("getGraphData");

  let stats = result.map((day) => ({
    date: day.date,
    value: day.lastBlock[graphFieldName]
  }));

  if (isRelative) {
    let relativeStats = stats.reduce((arr, dataPoint, index) => {
      arr[index] = {
        date: dataPoint.date,
        value: index > 0 ? dataPoint.value - stats[index - 1].value : 0
      };

      return arr;
    }, []);

    relativeStats.shift();
    stats = relativeStats;
  }

  const dashboardData = await getDashboardData();

  return {
    currentValue: dashboardData.now[dataName],
    compareValue: dashboardData.compare[dataName],
    snapshots: stats
  };
};
