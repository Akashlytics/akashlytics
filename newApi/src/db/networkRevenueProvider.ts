import { Op } from "sequelize";
import { Lease, PriceHistory, DailyNetworkRevenue, Block, Transaction, Deployment } from "./schema";
import { add, differenceInMinutes } from "date-fns";
import { v4 } from "uuid";
import { endOfDay, getTodayUTC, startOfDay } from "@src/shared/utils/date";
import { round, uaktToAKT } from "@src/shared/utils/math";
import { isSyncing, syncingStatus } from "@src/akash/akashSync";
import { processingStatus } from "@src/akash/statsProcessor";
import { sleep } from "@src/shared/utils/delay";
import { isSyncingPrices } from "./priceHistoryProvider";

let isLastComputingSuccess = false;
let isCalculatingRevenue = false;
let latestCalculateDate = null;

let cachedRevenue = null;
let cachedRevenueDate = null;

export const calculateNetworkRevenue = async () => {
  try {
    isCalculatingRevenue = true;

    console.log("calculating network revenue");
    const leases = await Lease.findAll({
      include: [
        {
          model: Deployment,
          attributes: ["deposit"]
        }
      ],
      order: [["startDate", "ASC"]]
    });
    const firstLease = leases[0];
    const priceHistory = await PriceHistory.findAll({
      raw: true,
      where: {
        date: {
          [Op.gte]: startOfDay(firstLease.startDate)
        }
      }
    });

    console.log("got price history");

    const networkRevenueDaysToAdd = [];
    console.log(priceHistory.length + " price entries");

    console.log("Loading first block of each day in memory...");
    console.time("loadingBlocks");
    const firstBlockOfEachDay = await Block.findAll({
      attributes: ["height", "datetime"],
      where: {
        firstBlockOfDay: true
      },
      order: [["height", "ASC"]]
    });
    console.timeEnd("loadingBlocks");
    console.log("Loaded " + firstBlockOfEachDay.length + " blocks");

    const latestBlockHeigth: number = await Block.max("height");

    for (const priceDay of priceHistory) {
      const isToday = priceHistory.indexOf(priceDay) === priceHistory.length - 1;
      const currentDate = new Date(priceDay.date);
      const startOfDayDate = startOfDay(currentDate);
      const endOfDayDate = endOfDay(currentDate);

      const startOfDayBlockIndex = firstBlockOfEachDay.findIndex((x) => x.datetime >= startOfDayDate);
      firstBlockOfEachDay.splice(0, startOfDayBlockIndex);

      const startOfDayHeight = firstBlockOfEachDay[0].height;

      let endOfDayHeight = latestBlockHeigth;
      if (!isToday) {
        const endOfDayBlockIndex = firstBlockOfEachDay.findIndex((x) => x.datetime >= endOfDayDate);
        firstBlockOfEachDay.splice(0, endOfDayBlockIndex);
        endOfDayHeight = firstBlockOfEachDay[0].height;
      }

      const activeLeasesForDay = leases.filter((l) => l.createdHeight < endOfDayHeight && (!l.closedHeight || l.closedHeight >= startOfDayHeight));

      const calculatedLeases = activeLeasesForDay.map((l) => {
        const maxLegitBlock = l.createdHeight + Math.ceil(l.deployment.deposit / l.price);
        const startBlock = Math.max(l.createdHeight, startOfDayHeight);
        const endBlock = Math.min(endOfDayHeight, l.closedHeight || endOfDayHeight, maxLegitBlock);
        const blockCount = endBlock < startBlock ? 0 : endBlock - startBlock;

        return {
          uakt: blockCount * l.price,
          akt: uaktToAKT(blockCount * l.price, 6),
          usd: uaktToAKT(blockCount * l.price, 6) * priceDay.price
        };
      });

      const revenueUsd = calculatedLeases.map((l) => l.usd).reduce((a, b) => a + b, 0);
      const revenueUAkt = calculatedLeases.map((l) => l.uakt).reduce((a, b) => a + b, 0);

      networkRevenueDaysToAdd.push({
        id: v4(),
        date: startOfDayDate,
        amount: round(revenueUsd),
        amountUAkt: revenueUAkt,
        leaseCount: calculatedLeases.length,
        aktPrice: priceDay.price
      });
    }

    console.log(`Bulk inserting ${networkRevenueDaysToAdd.length} days of revenue`);

    await DailyNetworkRevenue.destroy({ where: {} });
    await DailyNetworkRevenue.bulkCreate(networkRevenueDaysToAdd);
    isLastComputingSuccess = true;
    console.log("done");
  } catch (err) {
    isLastComputingSuccess = false;
    console.error(err);
    throw err;
  } finally {
    isCalculatingRevenue = false;
    latestCalculateDate = new Date();
  }
};

export const getStatus = async () => {
  const latestBlockInDb = await Block.max("height");

  console.time("latestTx");
  const latestTx = await Transaction.findOne({
    attributes: ["hash"],
    order: [["height", "DESC"]]
  });
  console.timeEnd("latestTx");

  return {
    latestBlockInDb,
    latestTx: latestTx.hash,
    latestCalculateDate,
    isLastComputingSuccess,
    isCalculatingRevenue,
    isSyncing,
    syncingStatus,
    processingStatus
  };
};

export const getWeb3IndexRevenue = async (debug: boolean) => {
  if (cachedRevenue && cachedRevenueDate && differenceInMinutes(cachedRevenueDate, new Date()) < 30) {
    return cachedRevenue;
  }

  while (isCalculatingRevenue || isSyncingPrices) {
    await sleep(5000);
  }

  if (!isLastComputingSuccess) {
    throw "Throwing instead of returning invalid data";
  }

  const dailyNetworkRevenues = await DailyNetworkRevenue.findAll({
    raw: true,
    order: [["date", "ASC"]]
  });

  let days = dailyNetworkRevenues.map((r) => ({
    date: new Date(r.date).getTime() / 1000,
    revenue: r.amount,
    revenueUAkt: r.amountUAkt,
    aktPrice: r.aktPrice,
    dateStr: new Date(r.date)
  }));

  const today = getTodayUTC();
  const oneDayAgo = add(today, { days: -1 });
  const twoDaysAgo = add(today, { days: -2 });
  const oneWeekAgo = add(today, { weeks: -1 });
  const twoWeeksAgo = add(today, { weeks: -2 });
  const thirtyDaysAgo = add(today, { days: -30 });
  const sixtyDaysAgo = add(today, { days: -60 });
  const ninetyDaysAgo = add(today, { days: -90 });
  let totalRevenue: number = 0,
    oneDayAgoRevenue: number = 0,
    twoDaysAgoRevenue: number = 0,
    oneWeekAgoRevenue: number = 0,
    twoWeeksAgoRevenue: number = 0,
    thirtyDaysAgoRevenue: number = 0,
    sixtyDaysAgoRevenue: number = 0,
    ninetyDaysAgoRevenue: number = 0;
  let totalRevenueUAkt: number = 0,
    oneDayAgoRevenueUAkt: number = 0,
    twoDaysAgoRevenueUAkt: number = 0,
    oneWeekAgoRevenueUAkt: number = 0,
    twoWeeksAgoRevenueUAkt: number = 0,
    thirtyDaysAgoRevenueUAkt: number = 0,
    sixtyDaysAgoRevenueUAkt: number = 0,
    ninetyDaysAgoRevenueUAkt: number = 0;

  days.forEach((b) => {
    const date = new Date(b.date * 1000);

    if (date <= ninetyDaysAgo) {
      ninetyDaysAgoRevenue += b.revenue;
      ninetyDaysAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= sixtyDaysAgo) {
      sixtyDaysAgoRevenue += b.revenue;
      sixtyDaysAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= thirtyDaysAgo) {
      thirtyDaysAgoRevenue += b.revenue;
      thirtyDaysAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= twoWeeksAgo) {
      twoWeeksAgoRevenue += b.revenue;
      twoWeeksAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= oneWeekAgo) {
      oneWeekAgoRevenue += b.revenue;
      oneWeekAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= twoDaysAgo) {
      twoDaysAgoRevenue += b.revenue;
      twoDaysAgoRevenueUAkt += b.revenueUAkt;
    }
    if (date <= oneDayAgo) {
      oneDayAgoRevenue += b.revenue;
      oneDayAgoRevenueUAkt += b.revenueUAkt;
    }

    totalRevenue += b.revenue;
    totalRevenueUAkt += b.revenueUAkt;
  }, 0);

  if (!debug) {
    days = days.map(({ dateStr, revenueUAkt, aktPrice, ...others }) => others) as any;
  }

  let revenueStats = {
    now: round(totalRevenue),
    oneDayAgo: round(oneDayAgoRevenue),
    twoDaysAgo: round(twoDaysAgoRevenue),
    oneWeekAgo: round(oneWeekAgoRevenue),
    twoWeeksAgo: round(twoWeeksAgoRevenue),
    thirtyDaysAgo: round(thirtyDaysAgoRevenue),
    sixtyDaysAgo: round(sixtyDaysAgoRevenue),
    ninetyDaysAgo: round(ninetyDaysAgoRevenue)
  };

  if (debug) {
    revenueStats = {
      ...revenueStats,
      nowAkt: uaktToAKT(totalRevenueUAkt, 6),
      oneDayAgoAkt: uaktToAKT(oneDayAgoRevenueUAkt, 6),
      twoDaysAgoAkt: uaktToAKT(twoDaysAgoRevenueUAkt, 6),
      oneWeekAgoAkt: uaktToAKT(oneWeekAgoRevenueUAkt, 6),
      twoWeeksAgAkt: uaktToAKT(twoWeeksAgoRevenueUAkt, 6),
      thirtyDaysAgoAkt: uaktToAKT(thirtyDaysAgoRevenueUAkt, 6),
      sixtyDaysAgoAkt: uaktToAKT(sixtyDaysAgoRevenueUAkt, 6),
      ninetyDaysAgoAkt: uaktToAKT(ninetyDaysAgoRevenueUAkt, 6)
    } as any;
  }

  const responseObj = {
    revenue: revenueStats,
    days
  };

  cachedRevenue = responseObj;
  cachedRevenueDate = new Date();

  return responseObj;
};
