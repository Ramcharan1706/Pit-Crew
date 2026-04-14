import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { EmptyState } from '../components/ui/EmptyState'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { formatDate } from '../utils/formatters'
import { getTxnExplorerUrl } from '../utils/explorer'

type HistoryFilter = 'executed' | 'cancelled' | 'expired'

const isExpired = (expirationAt: string | null, status: string): boolean => {
  if (!expirationAt || status !== 'active') {
    return false
  }
  return new Date(expirationAt).getTime() <= Date.now()
}

export const History: React.FC = () => {
  const { activeAddress: userAddress } = useWallet()
  const { intents, loading, fetchError } = useIntentRealtime()
  const [filter, setFilter] = useState<HistoryFilter>('executed')

  const rows = useMemo(() => {
    return intents
      .filter((intent) => {
        if (filter === 'executed') return intent.status === 'executed'
        if (filter === 'cancelled') return intent.status === 'cancelled'
        return isExpired(intent.expirationAt, intent.status)
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [intents, filter])

  if (!userAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Please connect your wallet to view history"
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-5 md:p-6">
        <h1 className="text-3xl font-bold text-white">History</h1>
        <p className="mt-2 text-sm text-slate-300">Audit trail for executed, cancelled, and expired intents.</p>
      </section>

      <section className="surface-card rounded-3xl p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {(['executed', 'cancelled', 'expired'] as HistoryFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition ${
                filter === item
                  ? 'border-sky-400/45 bg-sky-500/14 text-sky-100'
                  : 'border-[#1F2937] bg-[#111827] text-slate-300 hover:border-slate-500'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-3 text-sm text-slate-300">Loading history...</p>
        ) : fetchError ? (
          <div className="rounded-xl border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-200">{fetchError}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="📜" title="No rows" description="No history records match this filter yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] text-left text-xs uppercase tracking-[0.15em] text-slate-500">
                  <th className="px-3 py-3">Token</th>
                  <th className="px-3 py-3">Strategy</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((intent) => {
                  const statusLabel = isExpired(intent.expirationAt, intent.status) ? 'expired' : intent.status
                  const strategyLabel = intent.condition === 'price_drop_pct' ? 'Stop Loss' : 'Breakout Buy'
                  const rowTime = intent.executedAt || intent.cancelledAt || intent.updatedAt

                  return (
                    <tr key={intent.id} className="border-b border-[#1F2937] text-sm text-slate-200">
                      <td className="px-3 py-3">ALGO</td>
                      <td className="px-3 py-3">{strategyLabel}</td>
                      <td className="px-3 py-3 capitalize">{statusLabel}</td>
                      <td className="px-3 py-3">{formatDate(rowTime)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <Link to={`/intent/${intent.id}`} className="font-mono text-xs text-sky-300 underline-offset-4 hover:underline">
                            Intent {intent.id.slice(0, 12)}
                          </Link>
                          {intent.executionTxId && (
                            <a
                              href={getTxnExplorerUrl(intent.executionTxId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-emerald-400 underline-offset-4 hover:underline"
                            >
                              Tx: {intent.executionTxId.slice(0, 12)}... ↗
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
