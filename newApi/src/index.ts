import express from 'express';
import { Request, Response } from 'express';
import { initDatabase, initialize } from "./db/buildDatabase";
import { syncPriceHistory } from './db/priceHistoryProvider';

const app = express();
const { PORT = 3000 } = process.env;

app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'hello world',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('server started at http://localhost:' + PORT);
  });
}

/**
 * Intizialize database schema
 * Populate db
 * Create backups per version
 * Load from backup if exists for current version
 */
async function initApp() {
  await initDatabase();

  syncPriceHistory();
  // await initialize(true);
  // blockchainAnalyzer.startAutoRefresh();
  // marketDataProvider.syncAtInterval();
}

initApp();

export default app