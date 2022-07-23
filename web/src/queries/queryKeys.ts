export class QueryKeys {
  static getFinancialDataKey = () => ["FINANCIAL_DATA"];
  static getPriceDataKey = () => ["PRICE_DATA"];
  static getDashboardDataKey = () => ["DASHBOARD_DATA"];
  static getBlocksKey = (limit: number) => ["BLOCKS", limit];
  static getTransactionsKey = (limit: number) => ["TRANSACTIONS", limit];
  static getValidatorsKey = () => ["VALIDATORS"];
}
