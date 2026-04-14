import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Intent } from '../../types/intent'
import { formatCurrency, formatPercentage, formatTimeRemaining, formatUSD } from '../../utils/formatters'
import { getTxnExplorerUrl } from '../../utils/explorer'

interface IntentCardProps {
  intent: Intent
  onViewDetails?: () => void
  onApprove?: () => void
  onCancel?: () => void
}

export const IntentCard: React.FC<IntentCardProps> = ({
  intent,
  onViewDetails,
  onApprove,
  onCancel,
}) => {
  const navigate = useNavigate()
  const timeRemaining = intent.expirationAt ? formatTimeRemaining(intent.expirationAt) : null
  const isPending = intent.status === 'triggered'
  const strategyLabel = intent.condition === 'price_drop_pct' ? 'Stop Loss' : 'Breakout Buy'
  const computedTrigger = intent.condition === 'price_drop_pct'
    ? intent.initialPrice * (1 - intent.targetValue / 100)
    : intent.initialPrice * (1 + intent.targetValue / 100)

  const currentPrice = intent.triggerPrice || intent.initialPrice
  const delta = intent.initialPrice > 0
    ? ((currentPrice - intent.initialPrice) / intent.initialPrice) * 100
    : 0

  const statusClass = intent.status === 'triggered'
    ? 'border-amber-400/45 bg-amber-500/15 text-amber-100'
    : intent.status === 'executed'
      ? 'border-emerald-400/45 bg-emerald-500/12 text-emerald-100'
      : intent.status === 'cancelled'
        ? 'border-red-400/45 bg-red-500/12 text-red-100'
        : 'border-sky-400/45 bg-sky-500/12 text-sky-100'

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails()
    } else {
      navigate(`/intent/${intent.id}`)
    }
  }

  return (
    <article
      onClick={handleViewDetails}
      className="surface-card cursor-pointer rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-slate-500"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Token</p>
          <h4 className="text-lg font-semibold text-white">ALGO</h4>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
          {intent.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Strategy</p>
          <p className="text-sm font-semibold text-slate-100">{strategyLabel}</p>
        </div>

        <div className="rounded-xl border border-[#1F2937] bg-[#0f1728] p-3 text-sm">
          <p className="text-slate-300">
            Trigger condition: {intent.condition === 'price_drop_pct' ? 'Price drop' : 'Price breakout'} {formatPercentage(intent.targetValue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Triggered because target level is {formatUSD(computedTrigger)}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Price</p>
            <p className="font-semibold text-white">{formatUSD(currentPrice)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Trigger Price</p>
            <p className="font-semibold text-white">{formatUSD(computedTrigger)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Price Delta</p>
          <p className={`font-semibold ${delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatPercentage(delta)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Amount</p>
          <p className="font-semibold text-white">{formatCurrency(intent.amountAlgo)} ALGO</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">Expiry: {timeRemaining || 'No expiry set'}</p>

      {intent.executionTxId && (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
          <p className="text-xs uppercase tracking-[0.12em] text-emerald-300">Transaction</p>
          <a
            href={getTxnExplorerUrl(intent.executionTxId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block break-all font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            {intent.executionTxId}
          </a>
        </div>
      )}

      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleViewDetails}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
        >
          View
        </button>
        {(isPending || intent.status === 'active') && (
          <>
          {isPending && onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApprove()
              }}
              className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Approve
            </button>
          )}
          {onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel()
              }}
              className="flex-1 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              Cancel
            </button>
          )}
          </>
        )}
      </div>
    </article>
  )
}
