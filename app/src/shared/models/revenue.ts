export interface DailySpentGraph {
  date: Date;
  revenue: number;
  revenueUAkt: number;
  aktPrice: number;
  total?: number;
  totalUAkt?: number;
}

export interface DailySpentGraphResponse {
  totalUAkt: number;
  totalUSD: number;
  last24: {
    uakt: number;
    akt: number;
    usd: number;
  },
  days: DailySpentGraph[]
}

