import { useMemo } from 'react';
import { calculateRiskLevel } from '../utils/calculations';
import { IntentCondition } from '../types/intent';

export interface RiskAnalysis {
  level: 'low' | 'medium' | 'high';
  recommendation: string;
  confidence: number;
  warningText?: string;
}

export function useRiskAnalysis(
  condition: IntentCondition,
  targetValue: number,
  initialPrice: number,
  currentPrice: number
): RiskAnalysis {
  return useMemo(() => {
    const percentChange = Math.abs(
      ((currentPrice - initialPrice) / initialPrice) * 100
    );
    const level = calculateRiskLevel(percentChange, condition);

    let recommendation = '';
    let confidence = 100;
    let warningText = undefined;

    if (condition === 'price_drop_pct') {
      if (targetValue > 20) {
        recommendation = 'Very conservative - high barrier to trigger';
        confidence = 95;
      } else if (targetValue > 10) {
        recommendation = 'Moderate - reasonable barrier';
        confidence = 80;
      } else {
        recommendation = 'Aggressive - may trigger frequently';
        confidence = 60;
        warningText = 'High execution frequency possible';
      }
    } else {
      if (targetValue > 20) {
        recommendation = 'Very aggressive - high spike required';
        confidence = 85;
        warningText = 'May never trigger';
      } else if (targetValue > 10) {
        recommendation = 'Moderate - captures significant moves';
        confidence = 80;
      } else {
        recommendation = 'Sensitive - catches small moves';
        confidence = 70;
      }
    }

    if (level === 'high') {
      warningText = 'High risk - consider lower target';
    }

    return {
      level,
      recommendation,
      confidence,
      warningText,
    };
  }, [condition, targetValue, initialPrice, currentPrice]);
}
