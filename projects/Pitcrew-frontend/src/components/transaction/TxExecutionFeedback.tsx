import React from 'react';
import { Card } from '../ui/Card';
import { TxStatus } from '../../types/transaction';
import { Spinner } from '../ui/Spinner';

interface TxExecutionFeedbackProps {
  status: TxStatus;
  txId?: string;
  error?: string;
  isRetrying?: boolean;
}

const statusSteps: TxStatus[] = [
  'pending',
  'signed',
  'confirming',
  'executed',
];

const statusLabels: Record<TxStatus, string> = {
  pending: 'Creating Transaction',
  signed: 'Signed by Wallet',
  confirming: 'Confirming On-Chain',
  executed: 'Executed Successfully',
  failed: 'Transaction Failed',
};

const statusEmojis: Record<TxStatus, string> = {
  pending: '⏳',
  signed: '✍️',
  confirming: '📡',
  executed: '✅',
  failed: '❌',
};

export const TxExecutionFeedback: React.FC<TxExecutionFeedbackProps> = ({
  status,
  txId,
  error,
  isRetrying = false,
}) => {
  const currentStep = statusSteps.indexOf(status as any) + 1;
  const totalSteps = statusSteps.length;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-6 text-white">Transaction Status</h3>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {statusSteps.map((step, idx) => (
            <div
              key={step}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2
                  ${
                    idx < currentStep
                      ? 'bg-green-600 text-white'
                      : idx === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }
                `}
              >
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              <p className="text-xs text-slate-400 text-center leading-tight">
                {statusLabels[step]}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Line */}
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="p-4 bg-slate-800 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{statusEmojis[status]}</span>
          <p className="text-lg font-bold text-white">{statusLabels[status]}</p>
        </div>

        {isRetrying && (
          <div className="flex items-center gap-2 mt-2">
            <Spinner size="sm" />
            <p className="text-sm text-yellow-400">Retrying...</p>
          </div>
        )}
      </div>

      {/* Transaction ID */}
      {txId && (
        <div className="p-4 bg-slate-900 rounded-lg mb-6">
          <p className="text-xs text-slate-400 mb-2">Transaction ID</p>
          <p className="text-sm font-mono text-blue-400 break-all">{txId}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-xs text-red-400 font-semibold mb-1">Error</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </Card>
  );
};
