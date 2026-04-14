import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { intentApi } from '../services/intentApi'
import { formatCurrency, formatUSD } from '../utils/formatters'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { profileSettingsStore } from '../store/profileSettings'
import { CreateIntentDto, IntentCondition } from '../types/intent'

type StrategyId = 'stop_loss' | 'take_profit' | 'breakout_buy';

type StrategyTemplate = {
  id: StrategyId;
  title: string;
  subtitle: string;
  condition: IntentCondition;
  defaultTarget: number;
  icon: string;
  explanation: string;
  triggerDirection: 'down' | 'up';
};

const STRATEGIES: StrategyTemplate[] = [
  {
    id: 'stop_loss',
    title: 'Stop Loss',
    subtitle: 'Protect downside moves',
    condition: 'price_drop_pct',
    defaultTarget: 5,
    icon: '🛡️',
    explanation: 'Triggers when ALGO drops below your selected percentage from the entry price.',
    triggerDirection: 'down',
  },
  {
    id: 'take_profit',
    title: 'Take Profit',
    subtitle: 'Capture upside moves',
    condition: 'price_breakout_pct',
    defaultTarget: 8,
    icon: '🎯',
    explanation: 'Triggers when ALGO rises above your selected percentage from the entry price.',
    triggerDirection: 'up',
  },
  {
    id: 'breakout_buy',
    title: 'Breakout Buy',
    subtitle: 'Momentum-based entry',
    condition: 'price_breakout_pct',
    defaultTarget: 4,
    icon: '🚀',
    explanation: 'Triggers on upward momentum once price breaks above your breakout threshold.',
    triggerDirection: 'up',
  },
];

const expiryOptions = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '7 days', value: 10080 },
];

export const CreateIntent: React.FC = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress: userAddress } = useWallet()
  const { latestPrice } = useIntentRealtime()

  const [token] = useState('ALGO')
  const [strategyId, setStrategyId] = useState<StrategyId>('stop_loss')
  const [recipient, setRecipient] = useState('')
  const [amountAlgo, setAmountAlgo] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [expirationMinutes, setExpirationMinutes] = useState('60')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strategy = useMemo(
    () => STRATEGIES.find((item) => item.id === strategyId) || STRATEGIES[0],
    [strategyId],
  )

  useEffect(() => {
    if (!latestPrice || latestPrice <= 0) {
      setTriggerPrice('')
      return
    }

    const suggested = strategy.triggerDirection === 'down'
      ? latestPrice * (1 - strategy.defaultTarget / 100)
      : latestPrice * (1 + strategy.defaultTarget / 100)

    setTriggerPrice(suggested.toFixed(4))
  }, [latestPrice, strategy])

  useEffect(() => {
    if (!userAddress) {
      return
    }

    void profileSettingsStore.fetch(userAddress).then((settings) => {
      setExpirationMinutes(String(settings.defaultExpiryMinutes))
    })
  }, [userAddress])

  const recipientPreview = useMemo(() => {
    if (recipient.length <= 16) {
      return recipient
    }

    return `${recipient.slice(0, 8)}...${recipient.slice(-6)}`
  }, [recipient])

  const targetValue = useMemo(() => {
    if (!latestPrice || latestPrice <= 0) {
      return 0
    }

    const trigger = Number(triggerPrice)
    if (!Number.isFinite(trigger) || trigger <= 0) {
      return 0
    }

    const raw = ((trigger - latestPrice) / latestPrice) * 100
    if (strategy.triggerDirection === 'down') {
      return Math.max(0, Math.abs(raw))
    }

    return Math.max(0, raw)
  }, [latestPrice, triggerPrice, strategy.triggerDirection])

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}

    if (!recipient.trim() || recipient.trim().length < 58) {
      nextErrors.recipient = 'Enter a valid Algorand address.'
    }

    const amount = Number(amountAlgo)
    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amountAlgo = 'Amount must be greater than 0.'
    }

    const trigger = Number(triggerPrice)
    if (!Number.isFinite(trigger) || trigger <= 0) {
      nextErrors.triggerPrice = 'Enter a valid trigger price.'
    }

    const target = Number(targetValue)
    if (!Number.isFinite(target) || target <= 0 || target > 100) {
      nextErrors.triggerPrice = 'Trigger price must imply a valid change between 0 and 100%.'
    }

    if (!latestPrice || latestPrice <= 0) {
      nextErrors.triggerPrice = 'Live ALGO price is required to compute trigger rules.'
    }

    const expiry = Number(expirationMinutes)
    if (!Number.isFinite(expiry) || expiry < 5 || expiry > 10080) {
      nextErrors.expirationMinutes = 'Expiration must be between 5 minutes and 7 days.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!userAddress) {
      enqueueSnackbar('Connect your wallet before creating an intent', { variant: 'warning' })
      return
    }

    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateIntentDto = {
        userAddress,
        recipient: recipient.trim(),
        amountAlgo: Number(amountAlgo),
        condition: strategy.condition,
        targetValue: Number(targetValue),
        expirationMinutes: Number(expirationMinutes),
      }

      const created = await intentApi.create(payload)
      enqueueSnackbar('Intent created successfully', { variant: 'success' })
      navigate(`/intent/${created.id}`)
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to create intent', {
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!userAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Please connect your wallet to create intents"
      />
    )
  }

  const amount = Number(amountAlgo) || 0
  const referencePrice = latestPrice || 0
  const triggerValue = Number(triggerPrice) || 0
  const triggerNarrative = strategy.triggerDirection === 'down'
    ? `Triggered because price dropped to ${formatUSD(triggerValue)} or lower.`
    : `Triggered because price broke out to ${formatUSD(triggerValue)} or higher.`

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Intent Builder</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Create an automation intent</h1>
        <p className="mt-2 text-sm text-slate-300">Define the trigger now, then approve manually when the market condition is met.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">Token</label>
              <input value={token} disabled className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3 font-semibold text-slate-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">Strategy Selector</label>
              <div className="grid gap-3 md:grid-cols-3">
                {STRATEGIES.map((item) => {
                  const selected = item.id === strategyId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStrategyId(item.id)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${selected
                        ? 'border-sky-400/45 bg-sky-500/14 text-sky-100'
                        : 'border-[#1F2937] bg-[#111827] text-slate-300 hover:border-slate-500'}`}
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">Trigger Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={triggerPrice}
                onChange={(event) => setTriggerPrice(event.target.value)}
                placeholder="0.0000"
                className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3"
              />
              {errors.triggerPrice ? <p className="mt-2 text-sm text-red-300">{errors.triggerPrice}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-100">Amount (ALGO)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={amountAlgo}
                  onChange={(event) => setAmountAlgo(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3"
                />
                {errors.amountAlgo ? <p className="mt-2 text-sm text-red-300">{errors.amountAlgo}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-100">Expiry</label>
                <select
                  value={expirationMinutes}
                  onChange={(event) => setExpirationMinutes(event.target.value)}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3"
                >
                  {expiryOptions.map((option) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.expirationMinutes ? <p className="mt-2 text-sm text-red-300">{errors.expirationMinutes}</p> : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">Receiver Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value.trim().toUpperCase())}
                placeholder="Enter Algorand address"
                className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3 font-mono text-sm"
              />
              {errors.recipient ? <p className="mt-2 text-sm text-red-300">{errors.recipient}</p> : null}
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-semibold">What happens next</p>
              <p className="mt-1">When condition is met, this intent moves to Trigger Center and waits for your manual wallet approval.</p>
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={submitting} className="w-full">
              Create Intent
            </Button>
          </form>
        </section>

        <section className="surface-card rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Live Preview</p>
          <h2 className="mt-1 text-2xl font-bold text-white">{strategy.title} - {token}</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Strategy explanation</p>
              <p className="mt-2 text-sm text-slate-200">{strategy.explanation}</p>
            </div>

            <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trigger condition</p>
              <p className="mt-2 text-lg font-semibold text-sky-200">
                {triggerValue > 0 ? `ALGO reaches ${formatUSD(triggerValue)}` : 'Set a trigger price'}
              </p>
              <p className="mt-1 text-sm text-slate-300">{triggerNarrative}</p>
            </div>

            <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Execution summary</p>
              <p className="mt-2 text-sm text-slate-200">Amount: {formatCurrency(amount)} ALGO</p>
              <p className="mt-1 text-sm text-slate-200">Receiver: {recipientPreview || 'Pending receiver'}</p>
              <p className="mt-1 text-sm text-slate-200">Live ALGO reference: {referencePrice > 0 ? formatUSD(referencePrice) : 'Waiting for live feed'}</p>
              <p className="mt-1 text-sm text-slate-200">Implied movement: {targetValue.toFixed(2)}%</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Trust guardrail</p>
              <p className="mt-2 text-sm text-emerald-100">This intent never auto-spends. You always confirm the final transaction in wallet after trigger.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
