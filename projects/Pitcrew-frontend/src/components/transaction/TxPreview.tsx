import React from 'react'
import { formatCurrency } from '../../utils/formatters'
import { TransactionPreview } from '../../types/transaction'

interface TxPreviewProps {
  preview: TransactionPreview
  isLoading?: boolean
  approvalStage?: 'idle' | 'waiting_wallet' | 'confirming_chain' | 'done' | 'failed'
  error?: string | null
  onApprove?: () => void
  onCancel?: () => void
}

export const TxPreview: React.FC<TxPreviewProps> = ({
  preview,
  isLoading = false,
  approvalStage = 'idle',
  error = null,
  onApprove,
  onCancel,
}) => {
  const total = preview.amount + preview.fee

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-300">{preview.reason || 'ALGO reached your trigger, preparing intent execution.'}</p>
      </div>

      <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Transaction Details</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Amount</span>
            <span className="font-mono font-semibold text-white">{formatCurrency(preview.amount)} ALGO</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Receiver</span>
            <span className="break-all text-right font-mono text-xs text-sky-300">{preview.receiver}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Network</span>
            <span className="font-semibold text-white">{(import.meta.env.VITE_ALGOD_NETWORK || 'testnet').toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Fee</span>
            <span className="font-mono text-white">{formatCurrency(preview.fee)} ALGO</span>
          </div>
          <div className="mt-2 border-t border-[#1F2937] pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Total</span>
              <span className="font-mono text-lg font-bold text-emerald-300">{formatCurrency(total)} ALGO</span>
            </div>
          </div>
        </div>
      </div>

      {approvalStage === 'waiting_wallet' ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">Waiting for wallet...</div>
      ) : null}
      {approvalStage === 'confirming_chain' ? (
        <div className="rounded-xl border border-sky-300/30 bg-sky-500/10 p-3 text-sm text-sky-100">Confirming on blockchain...</div>
      ) : null}
      {approvalStage === 'done' ? (
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">Transaction approved and submitted.</div>
      ) : null}
      {approvalStage === 'failed' || error ? (
        <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">{error || 'Transaction failed. Please try again.'}</div>
      ) : null}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {isLoading ? 'Approve Transaction...' : 'Approve Transaction'}
        </button>
      </div>
    </div>
  )
}
