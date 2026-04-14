export interface AnalyticsMetrics {
  totalIntents: number;
  executedIntents: number;
  winRate: number; // 0-100
  totalValueTransacted: number;
  averagePriceChange: number;
  totalProfitLoss: number;
  period: 'day' | 'week' | 'month' | 'all';
}

export interface PnLEntry {
  intentId: string;
  executedAt: string;
  initialPrice: number;
  triggerPrice?: number;
  executionPrice?: number;
  amount: number;
  pnl: number;
  condition: string;
}
