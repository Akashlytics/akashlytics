import fetch from "node-fetch";

const reftreshInterval = 5 * 60 * 1000; // 5min

let aktMarketData = null;

export async function fetchLatestData() {
  const endpointUrl = "https://api.coingecko.com/api/v3/coins/akash-network";

  console.log("Fetching latest market data from " + endpointUrl);

  const response = await fetch(endpointUrl);
  const data = await response.json();

  aktMarketData = {
    price: parseFloat(data.market_data.current_price.usd),
    volume: parseInt(data.market_data.total_volume.usd),
    marketCap: parseInt(data.market_data.market_cap.usd),
    marketCapRank: data.market_cap_rank,
    priceChange24h: parseFloat(data.market_data.price_change_24h),
    priceChangePercentage24: parseFloat(data.market_data.price_change_percentage_24h)
  };
}

export const getAktMarketData = () => {
  return aktMarketData;
};
