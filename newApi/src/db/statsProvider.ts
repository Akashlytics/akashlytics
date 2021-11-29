import { Block, Op } from "./schema";
import { subHours } from "date-fns";

export const getDashboardData = async () => {
  console.time("latestBlock");
  const latestBlockStats = await Block.findOne({
    order: [["height", "DESC"]]
  });
  console.timeEnd("latestBlock");

  console.time("compareBlock");
  const compareDate = subHours(latestBlockStats.datetime, 24);
  console.log(compareDate);
  const compareBlockStats = await Block.findOne({
    order: [["datetime", "ASC"]],
    where: {
      datetime: { [Op.gte]: compareDate }
    }
  });
  console.log(compareBlockStats.height);
  console.log(compareBlockStats.datetime);
  console.timeEnd("compareBlock");

  return {
    now: {
      date: latestBlockStats.datetime,
      height: latestBlockStats.height,
      activeDeploymentCount: latestBlockStats.activeLeaseCount,
      totalDeploymentCount: latestBlockStats.totalLeaseCount,
      totalUAktSpent: latestBlockStats.totalUAktSpent,
      activeCPU: latestBlockStats.activeCPU,
      activeMemory: latestBlockStats.activeMemory,
      activeStorage: latestBlockStats.activeStorage
    },
    compare: {
      date: compareBlockStats.datetime,
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
