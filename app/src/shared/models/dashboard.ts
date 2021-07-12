
export interface DashboardData {
  activeDeploymentCount: number;
  deploymentCount: number;
  averagePrice: number;
  marketData: MarketData;
  totalAKTSpent: number;
  totalResourcesLeased: ResourceLeased;
  lastRefreshDate: Date
  lastSnapshot: SnapshotData;
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