export type CreateIntentDto = {
  userAddress?: string;
  recipient: string;
  condition: 'price_drop_pct' | 'price_breakout_pct';
  targetValue: number;
  amountAlgo: number;
  expirationMinutes?: number;
};

export type Intent = {
  id: string;
  userAddress: string;
  condition: string;
  targetValue: number;
  amountAlgo: number;
  recipient: string;
  initialPrice: number;
  status: 'active' | 'triggered' | 'executed' | 'cancelled';
  triggeredAt?: Date | null;
  triggerPrice?: number | null;
  executedAt?: Date | null;
  executionTxId?: string | null;
  expirationAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PriceData = {
  usd: number;
};
