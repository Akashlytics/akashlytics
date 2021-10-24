export interface RevenueAmount {
  akt: number;
  uakt: number;
  usd: number;
}

export interface SpentStats {
  amountAkt: number;
  amountUAkt: number;
  amountUSD: number;
  revenueLast24: RevenueAmount;
  revenuePrevious24: RevenueAmount;
}

export interface DashboardData {
  activeDeploymentCount: number;
  deploymentCount: number;
  averagePrice: number;
  marketData: MarketData;
  spentStats: SpentStats;
  totalResourcesLeased: ResourceLeased;
  lastRefreshDate: Date
  lastSnapshot: SnapshotData;
  dailyAktSpent: number;
  dailyDeploymentCount: number;
}

export interface SnapshotData {
  minActiveDeploymentCount: number;
  maxActiveDeploymentCount: number;
  minCompute: number;
  maxCompute: number;
  minMemory: number;
  maxMemory: number;
  minStorage: number;
  maxStorage: number;
  allTimeDeploymentCount: number;
  totalAktSpent: number;
  dailyAktSpent: number;
  dailyDeploymentCount: number;
}

export interface ResourceLeased {
  cpuSum: number;
  memorySum: number;
  storageSum: number;
}

export interface MarketData {
  price: number;
  volume: number;
  marketCap: number;
  marketCapRank: number;
  priceChange24h: number;
  priceChangePercentage24: number;
}