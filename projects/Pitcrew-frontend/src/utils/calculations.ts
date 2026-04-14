/**
 * Calculate percentage change from initial to current price
 */
export function calculatePriceChangePercent(
  initialPrice: number,
  currentPrice: number
): number {
  if (initialPrice === 0) return 0;
  return ((currentPrice - initialPrice) / initialPrice) * 100;
}

/**
 * Determine if price direction is up or down
 */
export function getPriceDirection(
  initialPrice: number,
  currentPrice: number
): 'up' | 'down' {
  return currentPrice >= initialPrice ? 'up' : 'down';
}

/**
 * Calculate risk level based on percentage change and condition
 */
export function calculateRiskLevel(
  percentChange: number,
  condition: 'price_drop_pct' | 'price_breakout_pct'
): 'low' | 'medium' | 'high' {
  const absPct = Math.abs(percentChange);

  if (condition === 'price_drop_pct') {
    // For drops, high volatility is risky
    if (absPct < 2) return 'low';
    if (absPct < 5) return 'medium';
    return 'high';
  } else {
    // For breakouts, high spike is bullish, lower risk
    if (absPct < 2) return 'low';
    if (absPct < 10) return 'medium';
    return 'high';
  }
}

/**
 * Calculate estimated P&L for an intent
 */
export function calculateEstimatedPnL(
  amount: number,
  initialPrice: number,
  currentPrice: number
): number {
  const valueDifference = (currentPrice - initialPrice) * amount;
  return valueDifference;
}

/**
 * Estimate transaction fee in ALGO
 */
export function estimateTxFee(): number {
  // Algorand minimum fee is 0.001 ALGO
  return 0.001;
}
