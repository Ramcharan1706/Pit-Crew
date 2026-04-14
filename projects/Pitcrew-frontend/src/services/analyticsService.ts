import { Intent, IntentStatus } from '../types/intent';
import { AnalyticsMetrics, PnLEntry } from '../types/analytics';
import { calculatePriceChangePercent } from '../utils/calculations';

export const analyticsService = {
  /**
   * Calculate metrics from executed intents
   */
  calculateMetrics: (intents: Intent[]): AnalyticsMetrics => {
    const executedIntents = intents.filter((i) => i.status === 'executed');
    const total = intents.length;

    let totalValue = 0;
    let totalPnL = 0;
    let totalPriceChange = 0;
    let winCount = 0;

    executedIntents.forEach((intent) => {
      const value = intent.amountAlgo;
      totalValue += value;

      if (intent.initialPrice && intent.triggerPrice) {
        const pnl = calculatePriceChangePercent(intent.initialPrice, intent.triggerPrice);
        totalPnL += pnl;
        totalPriceChange += pnl;
        if (pnl > 0) winCount++;
      }
    });

    return {
      totalIntents: total,
      executedIntents: executedIntents.length,
      winRate: executedIntents.length > 0 ? (winCount / executedIntents.length) * 100 : 0,
      totalValueTransacted: totalValue,
      averagePriceChange:
        executedIntents.length > 0 ? totalPriceChange / executedIntents.length : 0,
      totalProfitLoss: totalPnL,
      period: 'all',
    };
  },

  /**
   * Generate P&L entries from intents
   */
  generatePnLEntries: (intents: Intent[]): PnLEntry[] => {
    return intents
      .filter((i) => i.status === 'executed' && i.executedAt)
      .map((intent) => ({
        intentId: intent.id,
        executedAt: intent.executedAt || '',
        initialPrice: intent.initialPrice,
        triggerPrice: intent.triggerPrice || undefined,
        executionPrice: intent.triggerPrice || undefined,
        amount: intent.amountAlgo,
        pnl: intent.triggerPrice
          ? (intent.triggerPrice - intent.initialPrice) * intent.amountAlgo
          : 0,
        condition: intent.condition,
      }))
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  },

  /**
   * Filter analytics by date range
   */
  filterByDateRange: (
    intents: Intent[],
    startDate: Date,
    endDate: Date
  ): Intent[] => {
    return intents.filter((intent) => {
      const created = new Date(intent.createdAt);
      return created >= startDate && created <= endDate;
    });
  },

  /**
   * Group intents by status
   */
  groupByStatus: (
    intents: Intent[]
  ): Record<IntentStatus, Intent[]> => {
    return {
      active: intents.filter((i) => i.status === 'active'),
      triggered: intents.filter((i) => i.status === 'triggered'),
      executed: intents.filter((i) => i.status === 'executed'),
      cancelled: intents.filter((i) => i.status === 'cancelled'),
    };
  },
};
