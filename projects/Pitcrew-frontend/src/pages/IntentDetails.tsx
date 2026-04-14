import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { TxPreview } from '../components/transaction/TxPreview'
import { IntentLifecycle } from '../components/intents/IntentLifecycle'
import { useTransactionApproval } from '../hooks/useTransactionApproval'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { intentApi } from '../services/intentApi'
import { formatCurrency, formatDate, formatPercentage, formatUSD } from '../utils/formatters'
import { Intent } from '../types/intent'

export const IntentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress: userAddress } = useWallet()
  const { intents, refreshIntents, latestPrice } = useIntentRealtime()

  const [intent, setIntent] = useState<Intent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const approval = useTransactionApproval()

  useEffect(() => {
    if (!id || !userAddress) {
      return
    }

    const loadIntent = async () => {
      try {
        setIsLoading(true)
        const data = await intentApi.getIntentById(id)
        setIntent(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intent')
      } finally {
        setIsLoading(false)
      }
    }

    void loadIntent()
  }, [id, userAddress])

  useEffect(() => {
    if (!id) {
      return
    }

    const updatedIntent = intents.find((item) => item.id === id)
    if (updatedIntent) {
      setIntent(updatedIntent)
    }
  }, [id, intents])

  const triggerPrice = useMemo(() => {
    if (!intent) {
      return 0
    }

    if (intent.condition === 'price_breakout_pct') {
      return intent.initialPrice * (1 + intent.targetValue / 100)
    }

    return intent.initialPrice * (1 - intent.targetValue / 100)
  }, [intent])

  const priceMovement = useMemo(() => {
    if (!intent || intent.initialPrice <= 0) {
      return 0
    }

    const current = latestPrice || intent.triggerPrice || intent.initialPrice
    return ((current - intent.initialPrice) / intent.initialPrice) * 100
  }, [intent, latestPrice])

  const handleApprove = async () => {
    if (!intent || !userAddress) {
      return
    }

    const result = await approval.approveTransaction(intent)
    if (result) {
      enqueueSnackbar('Intent approved and executed', { variant: 'success' })
      await refreshIntents()
    }
  }

  const handleCancel = async () => {
    if (!intent || !userAddress) {
      return
    }

    try {
      await intentApi.cancel(intent.id, userAddress, 'Cancelled from details page')
      enqueueSnackbar('Intent cancelled', { variant: 'success' })
      await refreshIntents()
      setShowCancelModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cancellation failed'
      enqueueSnackbar(message, { variant: 'error' })
    }
  }

  if (!userAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Please connect your wallet to view intent details"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!intent) {
    return (
      <EmptyState
        icon="❌"
        title="Intent not found"
        description={error || "This intent doesn't exist or is no longer available"}
      />
    )
  }

  const strategyLabel = intent.condition === 'price_drop_pct' ? 'Stop Loss' : 'Breakout Buy'
  const statusClass = intent.status === 'triggered'
    ? 'border-amber-400/45 bg-amber-500/15 text-amber-100'
    : intent.status === 'executed'
      ? 'border-emerald-400/45 bg-emerald-500/12 text-emerald-100'
      : intent.status === 'cancelled'
        ? 'border-red-400/45 bg-red-500/12 text-red-100'
        : 'border-sky-400/45 bg-sky-500/12 text-sky-100'

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Intent</p>
        <div>
          <h1 className="text-3xl font-bold text-white">ALGO intent details</h1>
          <p className="mt-1 text-sm font-mono text-slate-400">{intent.id}</p>
        </div>
        <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
          {intent.status}
        </span>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="surface-card rounded-3xl p-5 xl:col-span-3">
          <h2 className="text-xl font-semibold text-white">Lifecycle timeline</h2>
          <p className="mt-1 text-sm text-slate-300">Created -&gt; Triggered -&gt; Awaiting Approval -&gt; Executed</p>
          <div className="mt-4">
            <IntentLifecycle intent={intent} />
          </div>
        </div>

        <aside className="surface-card rounded-3xl p-5 xl:col-span-2">
          <h2 className="text-xl font-semibold text-white">Details</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Strategy</p>
              <p className="font-semibold text-slate-100">{strategyLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Trigger condition</p>
              <p className="text-slate-100">
                {intent.condition === 'price_drop_pct' ? 'Drop threshold' : 'Breakout threshold'} {formatPercentage(intent.targetValue)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Price movement</p>
              <p className={`${priceMovement >= 0 ? 'text-emerald-300' : 'text-red-300'} font-semibold`}>{formatPercentage(priceMovement)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Trigger price</p>
              <p className="font-semibold text-sky-200">{formatUSD(triggerPrice)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current price</p>
              <p className="font-semibold text-white">{formatUSD(latestPrice || intent.triggerPrice || intent.initialPrice)}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="surface-card rounded-3xl p-5 md:p-6">
        <h2 className="text-xl font-semibold text-white">Transaction info</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Amount</p>
            <p className="font-semibold text-white">{formatCurrency(intent.amountAlgo)} ALGO</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Receiver</p>
            <p className="break-all font-mono text-xs text-sky-300">{intent.recipient}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Created</p>
            <p className="text-sm text-slate-200">{formatDate(intent.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Triggered</p>
            <p className="text-sm text-slate-200">{intent.triggeredAt ? formatDate(intent.triggeredAt) : 'Not triggered yet'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Executed</p>
            <p className="text-sm text-slate-200">{intent.executedAt ? formatDate(intent.executedAt) : 'Pending approval'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Transaction Hash</p>
            <p className="break-all font-mono text-xs text-emerald-300">{intent.executionTxId || 'Not available yet'}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {intent.status === 'triggered' ? (
          <Button variant="primary" size="lg" onClick={() => setShowApproveModal(true)}>
            Approve transaction
          </Button>
        ) : null}

        {(intent.status === 'active' || intent.status === 'triggered') ? (
          <Button variant="danger" size="lg" onClick={() => setShowCancelModal(true)}>
            Cancel intent
          </Button>
        ) : null}
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Condition Met"
      >
        <TxPreview
          preview={{
            amount: intent.amountAlgo,
            receiver: intent.recipient,
            fee: 0.001,
            reason: `ALGO reached ${formatUSD(intent.triggerPrice || triggerPrice)}, triggering your intent`,
            riskAssessment: 'medium',
          }}
          isLoading={approval.isLoading}
          approvalStage={approval.approvalStage}
          error={approval.error}
          onApprove={() => void handleApprove()}
          onCancel={() => setShowApproveModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel intent"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Cancelling stops this automation immediately. Funds are not moved unless you approve a triggered transaction.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)} className="flex-1">
              Keep intent
            </Button>
            <Button variant="danger" onClick={() => void handleCancel()} className="flex-1">
              Confirm cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
