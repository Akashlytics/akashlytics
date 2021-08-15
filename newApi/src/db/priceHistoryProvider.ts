import fetch from "node-fetch";
import { PriceHistory } from "./schema";
import { Op } from "sequelize";
import { v4 } from "uuid";

interface PriceHistoryResponse {
  prices: Array<Array<number>>
  market_caps: Array<Array<number>>
  total_volumes: Array<Array<number>>
}

const reftreshInterval = 60 * 60 * 1000; // 60min
// const reftreshInterval = 1 * 30 * 1000; // 30sec

export const syncPriceHistory = async () => {
  await updatePriceHistory();
  setInterval(async () => {
    await updatePriceHistory();
  }, reftreshInterval);
}

const updatePriceHistory = async () => {
  const endpointUrl = "https://api.coingecko.com/api/v3/coins/akash-network/market_chart?vs_currency=usd&days=max";

  console.log("Fetching latest market data from " + endpointUrl);

  const response = await fetch(endpointUrl);
  const data: PriceHistoryResponse = await response.json();
  const apiPrices = data.prices.map(pDate => ({
    date: pDate[0],
    price: pDate[1]
  }));


  const priceHistory = await PriceHistory.findAll({ raw: true });
  const missingPrices = apiPrices.filter(p => !priceHistory.some(ph => p.date === ph.date)).sort((a, b) => a.date - b.date);

  if (missingPrices.length > 0) {
    console.log(`there are ${missingPrices.length} missing prices in the database.`);

    let missingPriceToInsert = [];

    for (const missingPrice of missingPrices) {
      const createdPrice = {
        id: v4(),
        date: missingPrice.date,
        price: missingPrice.price
      };

      missingPriceToInsert.push(createdPrice);
    }

    await PriceHistory.bulkCreate(missingPriceToInsert);
  }
}