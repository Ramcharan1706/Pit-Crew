import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { TxPreview } from '../components/transaction/TxPreview'
import { intentApi } from '../services/intentApi'
import { useTransactionApproval } from '../hooks/useTransactionApproval'
import { Intent } from '../types/intent'
import { formatPercentage, formatUSD } from '../utils/formatters'
import { getTxnExplorerUrl } from '../utils/explorer'

export const TriggerCenter: React.FC = () => {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { intents, loading, refreshIntents, latestPrice } = useIntentRealtime()
  const approval = useTransactionApproval()
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null)

  const triggered = intents
    .filter((intent) => intent.status === 'triggered')
    .sort((a, b) => {
      const aExpiry = a.expirationAt ? new Date(a.expirationAt).getTime() : Number.POSITIVE_INFINITY;
      const bExpiry = b.expirationAt ? new Date(b.expirationAt).getTime() : Number.POSITIVE_INFINITY;
      if (aExpiry !== bExpiry) {
        return aExpiry - bExpiry
      }

      const aTriggered = a.triggeredAt ? new Date(a.triggeredAt).getTime() : 0
      const bTriggered = b.triggeredAt ? new Date(b.triggeredAt).getTime() : 0
      return bTriggered - aTriggered
    })

  const handleApprove = async () => {
    if (!selectedIntent) {
      return
    }

    const result = await approval.approveTransaction(selectedIntent)
    if (result) {
      enqueueSnackbar('Intent approved and executed', { variant: 'success' })
      await refreshIntents()
    }
  }

  const handleCancel = async (intentId: string) => {
    if (!activeAddress) {
      return
    }

    try {
      setCancelBusyId(intentId)
      await intentApi.cancel(intentId, activeAddress, 'Cancelled from Trigger Center')
      enqueueSnackbar('Triggered intent cancelled', { variant: 'info' })
      await refreshIntents()
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Cancel failed', {
        variant: 'error',
      })
    } finally {
      setCancelBusyId(null)
    }
  }

  if (!activeAddress) {
    return (
      <EmptyState
        icon=""
        title="Connect Wallet"
        description="Connect your wallet to approve triggered intents"
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl border border-amber-400/35 bg-amber-500/10 p-5 md:p-6">
        <h1 className="text-3xl font-bold text-amber-100">Trigger Center</h1>
        <p className="mt-2 text-sm text-amber-100/90">
          Always visible, no clutter: each row explains why it triggered, what amount will move, and where funds go.
        </p>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : triggered.length === 0 ? (
        <EmptyState
          title="No triggered intents"
          description="You are clear for now. Triggered intents will appear here in real time."
        />
      ) : (
        <div className="space-y-4">
          {triggered.map((intent) => (
            <section
              key={intent.id}
              className="urgent-glow rounded-3xl border border-amber-400/45 bg-[#1a1306] p-4 md:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="rounded-full border border-amber-400/45 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-100">
                  Action Required
                </p>
                <p className="text-xs text-amber-100/85">Intent {intent.id.slice(0, 8)}</p>
              </div>

              <p className="text-lg font-semibold text-amber-100">
                Condition met: ALGO reached {formatUSD(intent.triggerPrice || latestPrice || intent.initialPrice)}
              </p>
              <p className="mt-1 text-sm text-amber-100/85">
                Triggered because price moved {formatPercentage(intent.targetValue)} from reference {formatUSD(intent.initialPrice)}.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/12 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Trigger price</p>
                  <p className="mt-1 text-lg font-semibold text-amber-100">{formatUSD(intent.triggerPrice || intent.initialPrice)}</p>
                </div>
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/12 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Current price</p>
                  <p className="mt-1 text-lg font-semibold text-amber-100">{formatUSD(latestPrice || intent.triggerPrice || intent.initialPrice)}</p>
                </div>
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/12 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Intent amount</p>
                  <p className="mt-1 text-lg font-semibold text-amber-100">{intent.amountAlgo.toFixed(4)} ALGO</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#3a2a12] bg-[#161007] p-3 text-sm text-amber-100/90">
                Trigger reason: {intent.condition === 'price_drop_pct' ? 'Stop loss threshold was reached.' : 'Breakout threshold was reached.'}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIntent(intent)}
                  disabled={approval.isLoading || cancelBusyId === intent.id}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve Transaction
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel(intent.id)}
                  disabled={approval.isLoading || cancelBusyId === intent.id}
                  className="rounded-xl border border-amber-300/45 bg-transparent px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel Intent
                </button>
              </div>

              {intent.executionTxId && (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-300">Transaction ID</p>
                  <a
                    href={getTxnExplorerUrl(intent.executionTxId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all font-mono text-sm text-emerald-300 hover:text-emerald-200 hover:underline"
                  >
                    {intent.executionTxId}
                  </a>
                </div>
              )}

              {approval.isLoading || cancelBusyId === intent.id ? (
                <p className="mt-3 text-sm text-amber-100/85">
                  {approval.isLoading ? 'Waiting for wallet confirmation...' : 'Cancelling intent...'}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedIntent)}
        onClose={() => setSelectedIntent(null)}
        title="Condition Met"
      >
        {selectedIntent ? (
          <TxPreview
            preview={{
              amount: selectedIntent.amountAlgo,
              receiver: selectedIntent.recipient,
              fee: 0.001,
              reason: `ALGO reached ${formatUSD(selectedIntent.triggerPrice || selectedIntent.initialPrice)}, triggering your intent`,
              riskAssessment: 'medium',
            }}
            isLoading={approval.isLoading}
            approvalStage={approval.approvalStage}
            error={approval.error}
            onApprove={() => void handleApprove()}
            onCancel={() => setSelectedIntent(null)}
          />
        ) : null}
      </Modal>
    </div>
  )
}
