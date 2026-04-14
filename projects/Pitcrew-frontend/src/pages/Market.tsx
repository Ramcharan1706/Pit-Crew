import React, { useMemo } from 'react'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'

export const Market: React.FC = () => {
  const { latestPrice, priceHistory } = useIntentRealtime()

  const baseline = priceHistory[0]?.price || latestPrice || 0
  const changePct = baseline > 0 && latestPrice ? ((latestPrice - baseline) / baseline) * 100 : 0

  const chartPoints = useMemo(() => {
    if (priceHistory.length < 2) {
      return ''
    }

    const prices = priceHistory.map((item) => item.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = Math.max(0.000001, max - min)
    const flat = Math.abs(max - min) < 0.0000001

    return priceHistory
      .map((item, index) => {
        const x = (index / (priceHistory.length - 1)) * 100
        const y = flat ? 50 : 100 - ((item.price - min) / range) * 100
        return `${x},${y}`
      })
      .join(' ')
  }, [priceHistory])

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">ALGO Price</p>
        <p className="mt-2 text-6xl font-bold text-white">${formatCurrency(latestPrice || 0, 4)}</p>
      </section>

      <section className="surface-card rounded-3xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Market Change</p>
        <p className={`mt-2 text-5xl font-bold ${changePct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          {formatPercentage(changePct)}
        </p>
      </section>

      <section className="surface-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Simple Chart</p>
        {chartPoints ? (
          <div className="mt-4 rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <svg viewBox="0 0 100 100" className="h-56 w-full" preserveAspectRatio="none" role="img" aria-label="ALGO price trend">
              <polyline
                fill="none"
                stroke={changePct >= 0 ? '#22C55E' : '#EF4444'}
                strokeWidth="2"
                points={chartPoints}
              />
            </svg>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">Waiting for more realtime ticks to draw trend.</p>
        )}
      </section>
    </div>
  )
}
