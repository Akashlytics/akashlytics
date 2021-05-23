
export interface DashboardData {
  activeDeploymentCount: number;
  deploymentCount: number;
  averagePrice: number;
  marketData: MarketData;
  totalAKTSpent: number;
  totalResourcesLeased: ResourceLeased;
  lastRefreshDate: Date
}

export interface ResourceLeased {
  cpuSum: number;
  memorySum: number;
  storageSum: number;
}

export interface MarketData {
  ask: number;
  bid: number;
  close: number;
  computedPrice: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}