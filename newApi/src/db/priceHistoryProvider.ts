import fetch from "node-fetch";
import { PriceHistory } from "./schema";
import { v4 } from "uuid";
import { toUTC } from "@src/shared/utils/date";
import { isEqual } from "date-fns";

export let isSyncingPrices = false;

interface PriceHistoryResponse {
  prices: Array<Array<number>>;
  market_caps: Array<Array<number>>;
  total_volumes: Array<Array<number>>;
}

const reftreshInterval = 60 * 60 * 1000; // 60min
// const reftreshInterval = 1 * 10 * 1000; // 10sec

export const syncPriceHistory = async () => {
  await updatePriceHistory();
  setInterval(async () => {
    await updatePriceHistory();
  }, reftreshInterval);
};

const updatePriceHistory = async () => {
  try {
    isSyncingPrices = true;
    const endpointUrl = "https://api.coingecko.com/api/v3/coins/akash-network/market_chart?vs_currency=usd&days=max";

    console.log("Fetching latest market data from " + endpointUrl);

    const response = await fetch(endpointUrl);
    const data: PriceHistoryResponse = await response.json();
    const apiPrices = data.prices.map((pDate) => ({
      date: pDate[0],
      price: pDate[1]
    }));

    console.log(`There are ${apiPrices.length} prices to update.`);

    const pricesToInsert = apiPrices.map((p) => ({
      id: v4(),
      date: new Date(p.date),
      price: p.price
    }));

    await PriceHistory.destroy({ where: {} });
    await PriceHistory.bulkCreate(pricesToInsert);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    isSyncingPrices = false;
  }
};
