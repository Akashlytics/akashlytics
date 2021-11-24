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

export interface DashboardBlockStats {
  date: Date;
  height: number;
  activeDeploymentCount: number;
  totalDeploymentCount: number;
  totalUAktSpent: number;
  activeCPU: number;
  activeMemory: number;
  activeStorage: number;
}

export interface DashboardData {
  now: DashboardBlockStats;
  compare: DashboardBlockStats;
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
