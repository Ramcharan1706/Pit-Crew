export type IntentCondition = 'price_drop_pct' | 'price_breakout_pct';
export type IntentStatus = 'active' | 'triggered' | 'executed' | 'cancelled';

export interface CreateIntentDto {
  userAddress: string;
  recipient: string;
  condition: IntentCondition;
  targetValue: number;
  amountAlgo: number;
  expirationMinutes?: number;
}

export interface Intent {
  id: string;
  userAddress: string;
  recipient: string;
  condition: IntentCondition;
  targetValue: number;
  amountAlgo: number;
  expirationAt: string | null;
  initialPrice: number;
  status: IntentStatus;
  triggeredAt?: string | null;
  triggerPrice?: number | null;
  executedAt?: string | null;
  executionTxId?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntentWithMetadata extends Intent {
  priceChangePercent: number;
  priceDirection: 'up' | 'down';
  timeRemaining?: string;
  riskLevel: 'low' | 'medium' | 'high';
}
