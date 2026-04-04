export type IntentCondition = 'price_drop_pct' | 'price_breakout_pct';

export interface CreateIntentDto {
  userAddress: string;
  condition: IntentCondition;
  targetValue: number;
  amountAlgo: number;
  recipient: string;
  expirationMinutes?: number;
}

export interface Intent extends CreateIntentDto {
  id: string;
  initialPrice: number;
  status: 'active' | 'triggered' | 'executed' | 'cancelled';
  triggeredAt?: string | null;
  triggerPrice?: number | null;
  executedAt?: string | null;
  executionTxId?: string | null;
  expirationAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
