import fetch from "node-fetch";
import { Day } from "./schema";
import { isSameDay } from "date-fns";

interface PriceHistoryResponse {
  prices: Array<Array<number>>;
  market_caps: Array<Array<number>>;
  total_volumes: Array<Array<number>>;
}

export const syncPriceHistory = async () => {
  const endpointUrl = "https://api.coingecko.com/api/v3/coins/akash-network/market_chart?vs_currency=usd&days=max";

  console.log("Fetching latest market data from " + endpointUrl);

  const response = await fetch(endpointUrl);
  const data: PriceHistoryResponse = await response.json();
  const apiPrices = data.prices.map((pDate) => ({
    date: pDate[0],
    price: pDate[1]
  }));

  console.log(`There are ${apiPrices.length} prices to update.`);

  const days = await Day.findAll({
    where: {
      aktPrice: null
    }
  });

  for (const day of days) {
    const priceData = apiPrices.find((x) => isSameDay(new Date(x.date), day.date));

    if (priceData && priceData.price != day.aktPrice) {
      day.aktPrice = priceData.price;
      await day.save();
    }
  }
};
