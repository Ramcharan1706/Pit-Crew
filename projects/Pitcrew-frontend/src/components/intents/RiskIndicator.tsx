import React from 'react';
import { formatPercentage } from '../../utils/formatters';
import { usePriceMovement } from '../../hooks/usePriceMovement';

interface RiskIndicatorProps {
  initialPrice: number;
  currentPrice: number;
  condition: 'price_drop_pct' | 'price_breakout_pct';
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  initialPrice,
  currentPrice,
  condition,
}) => {
  const isDropCondition = condition === 'price_drop_pct';
  const movement = usePriceMovement(initialPrice, currentPrice, isDropCondition);

  return (
    <div className="flex items-center gap-2">
      <div className={`text-lg font-bold ${movement.colorClass}`}>
        {movement.arrowIcon} {formatPercentage(movement.percentChange)}
      </div>
      <div className="text-xs text-slate-400">
        {movement.direction === 'up' ? 'Rising' : 'Falling'}
      </div>
    </div>
  );
};
