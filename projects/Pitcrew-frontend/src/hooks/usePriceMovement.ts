import { useMemo } from 'react';
import { calculatePriceChangePercent, getPriceDirection } from '../utils/calculations';

export interface PriceMovement {
  percentChange: number;
  direction: 'up' | 'down';
  colorClass: string;
  arrowIcon: string;
}

export function usePriceMovement(
  initialPrice: number,
  currentPrice: number,
  isDropCondition = true
): PriceMovement {
  return useMemo(() => {
    const percentChange = calculatePriceChangePercent(initialPrice, currentPrice);
    const direction = getPriceDirection(initialPrice, currentPrice);

    // For drop conditions: down is good (favorable), up is bad
    // For breakout conditions: up is good (favorable), down is bad
    const isFavorable =
      (isDropCondition && direction === 'down') ||
      (!isDropCondition && direction === 'up');

    return {
      percentChange: Math.abs(percentChange),
      direction,
      colorClass: isFavorable ? 'text-green-400' : 'text-red-400',
      arrowIcon: direction === 'up' ? '↑' : '↓',
    };
  }, [initialPrice, currentPrice, isDropCondition]);
}
