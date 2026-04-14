export type TxStatus = 'pending' | 'signed' | 'confirming' | 'executed' | 'failed';

export interface TransactionFeedback {
  status: TxStatus;
  message: string;
  txId?: string;
  timestamp: number;
}

export interface TransactionPreview {
  amount: number;
  receiver: string;
  fee: number;
  reason: string;
  riskAssessment: string;
}
