import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { IntentCard } from '../components/intents/IntentCard'
import { formatCurrency, formatDate, formatPercentage, formatUSD } from '../utils/formatters'
import { getTxnExplorerUrl } from '../utils/explorer'

export const Dashboard: React.FC = () => {
  const { activeAddress: userAddress } = useWallet()
  const { intents, loading, fetchError, latestPrice, priceHistory } = useIntentRealtime()
  const [searchQuery, setSearchQuery] = useState('')

  const activeIntents = useMemo(() => intents.filter((i) => i.status === 'active'), [intents])
  const triggeredIntents = useMemo(() => intents.filter((i) => i.status === 'triggered'), [intents])
  const executedIntents = useMemo(() => intents.filter((i) => i.status === 'executed'), [intents])

  const searchedIntents = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeIntents
    }

    const query = searchQuery.toLowerCase()
    return activeIntents.filter((intent) => {
      const amountStr = intent.amountAlgo.toString()
      const conditionStr = intent.condition === 'price_drop_pct' ? 'stop loss' : 'breakout'

      return (
        intent.id.toLowerCase().includes(query)
        || intent.status.toLowerCase().includes(query)
        || amountStr.includes(query)
        || conditionStr.includes(query)
        || intent.recipient.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, activeIntents])

  const recentActivity = useMemo(() => {
    return [...intents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
  }, [intents])

  const executedToday = useMemo(() => {
    const now = new Date()
    return executedIntents.filter((intent) => {
      const dateValue = intent.executedAt || intent.updatedAt
      const date = new Date(dateValue)
      return (
        date.getUTCFullYear() === now.getUTCFullYear()
        && date.getUTCMonth() === now.getUTCMonth()
        && date.getUTCDate() === now.getUTCDate()
      )
    }).length
  }, [executedIntents])

  const recentExecutions = useMemo(() => {
    return executedIntents
      .slice()
      .sort((a, b) => new Date(b.executedAt || b.updatedAt).getTime() - new Date(a.executedAt || a.updatedAt).getTime())
      .slice(0, 6)
  }, [executedIntents])

  const marketChange = useMemo(() => {
    const base = priceHistory[0]?.price || latestPrice || 0
    if (!base || !latestPrice) {
      return 0
    }

    return ((latestPrice - base) / base) * 100
  }, [priceHistory, latestPrice])

  const dashboardChartPoints = useMemo(() => {
    if (priceHistory.length < 2) {
      return ''
    }

    const values = priceHistory.map((point) => point.price)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = Math.max(0.000001, max - min)
    const flat = Math.abs(max - min) < 0.0000001

    return priceHistory
      .map((point, idx) => {
        const x = (idx / (priceHistory.length - 1)) * 100
        const y = flat ? 50 : 100 - ((point.price - min) / range) * 100
        return `${x},${y}`
      })
      .join(' ')
  }, [priceHistory])

  if (!userAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Please connect your wallet to view your dashboard"
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live Control Panel</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Trust-first DeFi automation</h1>
            <p className="mt-2 text-sm text-slate-300">Every triggered action shows why it fired and what will be executed before you approve.</p>
          </div>
          <Link
            to="/trigger-center"
            className="rounded-xl border border-amber-400/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25"
          >
            Open Trigger Center
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Intents</p>
            <p className="mt-2 text-3xl font-bold text-white">{intents.length}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${triggeredIntents.length > 0 ? 'urgent-glow border-amber-400/55 bg-amber-500/16' : 'border-[#1F2937] bg-[#111827]'}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Triggered Intents</p>
            <p className="mt-2 text-3xl font-bold text-amber-100">{triggeredIntents.length}</p>
            <p className="mt-1 text-xs text-amber-100/80">Immediate manual approval required</p>
          </div>
          <div className="surface-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Executed Today</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{executedToday}</p>
          </div>
          <div className="surface-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ALGO Price</p>
            <p className="mt-2 text-3xl font-bold text-sky-200">{formatUSD(latestPrice || 0)}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : fetchError ? (
        <div className="surface-card rounded-2xl border border-red-400/35 bg-red-500/10 p-6 text-red-200">{fetchError}</div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <div className="mb-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Active Intents</h2>
                  <Link to="/intents" className="text-sm font-semibold text-sky-300 hover:text-sky-200">View all</Link>
                </div>

                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
                  <input
                    type="text"
                    placeholder="Search by ID, amount, or strategy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-sky-100 placeholder-sky-300/60 outline-none"
                  />
                </div>
              </div>

              {searchedIntents.length === 0 ? (
                <div className="surface-card rounded-2xl p-6">
                  <EmptyState
                    icon={searchQuery ? '🔍' : '✦'}
                    title={searchQuery ? 'No intents found' : 'No active intents'}
                    description={searchQuery ? 'Try adjusting your search criteria.' : 'Create an intent to start automation monitoring.'}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {searchedIntents.slice(0, 6).map((intent) => (
                    <IntentCard key={intent.id} intent={intent} />
                  ))}
                </div>
              )}
            </div>

            <div className="xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-100">Triggered Intents</h2>
                <span className="rounded-full border border-amber-400/45 bg-amber-500/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-100">
                  Critical
                </span>
              </div>

              <div className="surface-card rounded-2xl border border-amber-400/40 bg-amber-500/12 p-4">
                {triggeredIntents.length === 0 ? (
                  <p className="text-sm text-amber-100/85">No triggered intents right now. This section stays reserved for urgent approvals.</p>
                ) : (
                  <div className="space-y-3">
                    {triggeredIntents.slice(0, 4).map((intent) => {
                      const triggerPrice = intent.triggerPrice || intent.initialPrice
                      const delta = intent.initialPrice > 0
                        ? ((triggerPrice - intent.initialPrice) / intent.initialPrice) * 100
                        : 0

                      return (
                        <div key={intent.id} className="urgent-glow rounded-2xl border border-amber-400/45 bg-[#1f1607] p-3">
                          <p className="text-sm font-semibold text-amber-100">Condition met: ALGO reached {formatUSD(triggerPrice)}</p>
                          <p className="mt-1 text-xs text-amber-100/85">Triggered because price moved {formatPercentage(delta)} from entry.</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-amber-100/90">
                            <span>Intent {intent.id.slice(0, 8)}</span>
                            <Link to="/trigger-center" className="font-semibold text-amber-200 underline-offset-4 hover:underline">Approve now</Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="surface-card rounded-3xl p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Market Pulse</h2>
              <span className={`text-sm font-semibold ${marketChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatPercentage(marketChange)}
              </span>
            </div>

            {dashboardChartPoints ? (
              <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
                <svg viewBox="0 0 100 100" className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Dashboard ALGO trend">
                  <polyline
                    fill="none"
                    stroke={marketChange >= 0 ? '#22C55E' : '#EF4444'}
                    strokeWidth="2"
                    points={dashboardChartPoints}
                  />
                </svg>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Waiting for enough live ticks to draw chart.</p>
            )}
          </section>

          <section className="surface-card rounded-3xl p-5 md:p-6">
            <h2 className="text-xl font-semibold text-white">ALGO Transactions</h2>
            <p className="mt-1 text-sm text-slate-400">Latest executed on-chain transfers from your intents.</p>

            <div className="mt-4 space-y-3">
              {recentExecutions.length === 0 && (
                <p className="text-sm text-slate-400">No executed ALGO transactions yet.</p>
              )}

              {recentExecutions.map((intent) => (
                <div key={intent.id} className="rounded-xl border border-[#1F2937] bg-[#0f1728] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">{formatCurrency(intent.amountAlgo)} ALGO</p>
                    <p className="text-xs text-slate-400">{formatDate(intent.executedAt || intent.updatedAt)}</p>
                  </div>
                  {intent.executionTxId ? (
                    <a
                      href={getTxnExplorerUrl(intent.executionTxId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all font-mono text-xs text-emerald-300 hover:text-emerald-200 hover:underline"
                    >
                      {intent.executionTxId}
                    </a>
                  ) : (
                    <p className="mt-1 font-mono text-xs text-slate-500">Pending transaction sync</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card rounded-3xl p-5 md:p-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <div className="mt-5 space-y-4">
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-400">No activity yet.</p>
              )}
              {recentActivity.length > 0 && recentActivity.map((intent) => (
                  <div key={intent.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      intent.status === 'triggered'
                        ? 'bg-amber-400'
                        : intent.status === 'executed'
                          ? 'bg-emerald-400'
                          : intent.status === 'cancelled'
                            ? 'bg-red-400'
                            : 'bg-sky-400'
                    }`} />
                    <div className="rounded-xl border border-[#1F2937] bg-[#0f1728] px-3 py-2 text-sm">
                      <p className="text-slate-100">
                        Intent {intent.id.slice(0, 8)} is <span className="font-semibold capitalize">{intent.status}</span>
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(intent.updatedAt)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
