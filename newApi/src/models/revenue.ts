export interface DailySpentGraph {
  date: Date;
  revenue: number;
  revenueUAkt: number;
  aktPrice: number;
  total?: number;
  totalUAkt?: number;
}