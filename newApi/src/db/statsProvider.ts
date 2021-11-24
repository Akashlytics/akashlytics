import { Block, BlockStatistic, Op } from "./schema";
import { subHours } from "date-fns";

export const getDasahboardData = async () => {
  console.time("latestBlock");
  const latestBlockStats = await BlockStatistic.findOne({
    order: [["height", "DESC"]],
    include: [{ model: Block, attributes: ["datetime"] }]
  });
  console.timeEnd("latestBlock");

  console.time("compareBlock");
  const compareDate = subHours(latestBlockStats.block.datetime, 24);
  console.log(compareDate);
  const compareBlockStats = await BlockStatistic.findOne({
    order: [[Block, "datetime", "ASC"]],
    where: {
      "$block.datetime$": { [Op.gte]: compareDate }
    },
    include: [{ model: Block, attributes: ["datetime"] }]
  });
  console.log(compareBlockStats.height);
  console.log(compareBlockStats.block.datetime);
  console.timeEnd("compareBlock");

  return {
    marketData: {},
    now: {
      date: latestBlockStats.block.datetime,
      height: latestBlockStats.height,
      activeDeploymentCount: latestBlockStats.activeLeaseCount,
      totalDeploymentCount: latestBlockStats.totalLeaseCount,
      totalUAktSpent: latestBlockStats.totalUAktSpent,
      activeCPU: latestBlockStats.activeCPU,
      activeMemory: latestBlockStats.activeMemory,
      activeStorage: latestBlockStats.activeStorage
    },
    compare: {
      date: compareBlockStats.block.datetime,
      height: compareBlockStats.height,
      activeDeploymentCount: compareBlockStats.activeLeaseCount,
      totalDeploymentCount: compareBlockStats.totalLeaseCount,
      totalUAktSpent: compareBlockStats.totalUAktSpent,
      activeCPU: compareBlockStats.activeCPU,
      activeMemory: compareBlockStats.activeMemory,
      activeStorage: compareBlockStats.activeStorage
    }
  };
};
