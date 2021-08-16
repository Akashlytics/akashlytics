import { averageBlockTime } from "@src/shared/constants";
import { Op } from "sequelize";
import { Lease, PriceHistory, DailyNetworkRevenue } from "./schema"
import { min, add, differenceInSeconds, isAfter, isToday, isEqual } from "date-fns";
import { v4 } from "uuid";
import { endOfDay, getTodayUTC, startOfDay, toUTC } from "@src/shared/utils/date";
import { round, uaktToAKT } from "@src/shared/utils/math";

export const calculateNetworkRevenue = async () => {
  const leases = await Lease.findAll({
    raw: true,
    order: [["startDate", "ASC"]],
  });
  const firstLease = leases[0]
  const priceHistory = await PriceHistory.findAll({
    raw: true,
    where: {
      date: {
        [Op.gte]: new Date(firstLease.startDate)
      },
    },
  });

  const networkRevenueDaysToAdd = []

  for (const priceDay of priceHistory) {
    // averageBlockTime
    const currentDate = new Date(priceDay.date);
    const activeLeasesForDay = leases.filter(l => l.startDate <= priceDay.date &&
      (!l.endDate || isAfter(new Date(l.endDate), isToday(currentDate) ? startOfDay(currentDate) : currentDate))
    );

    // console.log(priceDay.date)
    // console.log(currentDate)
    // console.log(activeLeasesForDay);

    const revenue = activeLeasesForDay.map(l => {
      // const startDate = zonedTimeToUtc(isToday(currentDate) ? startOfDay(currentDate) : currentDate, "America/New_York");
      // const endDate = zonedTimeToUtc(l.endDate ? min([new Date(l.endDate), endOfDay(currentDate)]) : endOfDay(currentDate), "America/New_York");
      const startDate = isToday(currentDate) ? startOfDay(currentDate) : currentDate;
      const endDate = l.endDate ? min([new Date(l.endDate), endOfDay(currentDate)]) : endOfDay(currentDate);
      // console.log(l, startDate, endDate);
      const activeSeconds = differenceInSeconds(endDate, startDate);
      const estimatedBlockCount = Math.round(activeSeconds / averageBlockTime);
      // console.log(`estimatedBlockCount ${estimatedBlockCount}`)
      return uaktToAKT(estimatedBlockCount * l.price, 6) * priceDay.price;
    }).reduce((a, b) => a + b, 0);

    networkRevenueDaysToAdd.push({
      id: v4(),
      date: priceDay.date,
      amount: round(revenue)
    });
  }

  // console.log(networkRevenueDaysToAdd);

  await DailyNetworkRevenue.bulkCreate(networkRevenueDaysToAdd);
}

export const getWeb3IndexRevenue = async () => {
  const dailyNetworkRevenues = await DailyNetworkRevenue.findAll({
    raw: true,
    order: [["date", "ASC"]],
  });

  const days = dailyNetworkRevenues.map(r => ({
    date: new Date(r.date).getTime() / 1000,
    revenue: r.amount
  }));

  console.log(dailyNetworkRevenues)

  const today = getTodayUTC()
  const oneDayAgo = add(today, { days: -1 })
  const twoDaysAgo = add(today, { days: -2 })
  const oneWeekAgo = add(today, { weeks: -1 })
  const twoWeeksAgo = add(today, { weeks: -2 })
  let totalRevenue: number, oneDayAgoRevenue: number, twoDaysAgoRevenue: number, oneWeekAgoRevenue: number, twoWeeksAgoRevenue: number;

  totalRevenue = days.reduce((a, b) => {
    const _date = new Date(b.date * 1000);
    const date = new Date(Date.UTC(_date.getUTCFullYear(), _date.getUTCMonth(), _date.getUTCDate()));
    const sum = a + b.revenue;

    if (isEqual(date, twoWeeksAgo)) {
      twoWeeksAgoRevenue = sum;
    } else if (isEqual(date, oneWeekAgo)) {
      oneWeekAgoRevenue = sum;
    } else if (isEqual(date, twoDaysAgo)) {
      twoDaysAgoRevenue = sum
    } else if (isEqual(date, oneDayAgo)) {
      oneDayAgoRevenue = sum
    }

    return sum;
  }, 0);

  return {
    revenue: {
      now: round(totalRevenue),
      oneDayAgo: round(oneDayAgoRevenue),
      twoDaysAgo: round(twoDaysAgoRevenue),
      oneWeekAgo: round(oneWeekAgoRevenue),
      twoWeeksAgo: round(twoWeeksAgoRevenue)
    },
    days
  }
}