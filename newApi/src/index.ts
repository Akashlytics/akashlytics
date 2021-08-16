import express from 'express';
import { Request, Response } from 'express';
import { initDatabase, initialize } from "./db/buildDatabase";
import { calculateNetworkRevenue, getWeb3IndexRevenue } from './db/networkRevenueProvider';
import { syncPriceHistory } from './db/priceHistoryProvider';
import { generateFakeLeases } from './temp_testing/fakeData';

const app = express();
const { PORT = 3000 } = process.env;

app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'hello world',
  });
});

app.get("/api/web3-index", async (req, res) => {
  console.log("calculating revenue");

  const revenueData = await getWeb3IndexRevenue();

  res.send(revenueData);
});

app.listen(PORT, () => {
  console.log('server started at http://localhost:' + PORT);
});

/**
 * Intizialize database schema
 * Populate db
 * Create backups per version
 * Load from backup if exists for current version
 */
async function initApp() {
  await initDatabase();

  await syncPriceHistory();

  // Insert a bunch of fake leases with 
  // Build the database table NetworkRevenue based on the estimated blocks per day that had active leases X lease price X token price
  // Make an endpoint to get that data with web3 index schema
  await generateFakeLeases();
  await calculateNetworkRevenue();


  // await initialize(true);
  // blockchainAnalyzer.startAutoRefresh();
  // marketDataProvider.syncAtInterval();
}

initApp();

export default app