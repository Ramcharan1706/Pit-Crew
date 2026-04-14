import React, { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useIntentRealtime } from '../context/IntentRealtimeContext'
import { ellipseAddress } from '../utils/formatters'
import { defaultProfileSettings, profileSettingsStore } from '../store/profileSettings'
import { NotificationPreferences, ProfileSettings } from '../types/profile'

const notificationKeys: Array<keyof NotificationPreferences> = [
  'inApp',
  'triggerAlerts',
  'executionAlerts',
  'priceAlerts',
]

export const Profile: React.FC = () => {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { intents } = useIntentRealtime()
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const network = (import.meta.env.VITE_ALGOD_NETWORK || 'testnet').toUpperCase()

  useEffect(() => {
    if (!activeAddress) {
      setSettings(null)
      return
    }

    setSettings(defaultProfileSettings(activeAddress))
    void profileSettingsStore.fetch(activeAddress).then(setSettings)
  }, [activeAddress])

  const stats = useMemo(() => {
    const total = intents.length
    const executed = intents.filter((intent) => intent.status === 'executed').length
    const successRate = total > 0 ? (executed / total) * 100 : 0

    return { total, executed, successRate }
  }, [intents])

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setSettings((previous) => {
      const safePrevious = previous || (activeAddress ? defaultProfileSettings(activeAddress) : null)
      if (!safePrevious) return previous

      return {
        ...safePrevious,
        notificationPreferences: {
          ...safePrevious.notificationPreferences,
          [key]: value,
        },
      }
    })
  }

  const saveSettings = async () => {
    if (!activeAddress || !settings) {
      return
    }

    try {
      setSaving(true)
      const updated = await profileSettingsStore.update(activeAddress, {
        defaultExpiryMinutes: settings.defaultExpiryMinutes,
        notificationPreferences: settings.notificationPreferences,
      })
      setSettings(updated)
      enqueueSnackbar('Profile settings updated', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to update settings', {
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!activeAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Connect your wallet to view profile and settings"
      />
    )
  }

  const currentSettings = settings || defaultProfileSettings(activeAddress)

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-5 md:p-6">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Wallet address</p>
            <p className="mt-2 font-mono text-sm text-slate-100">{ellipseAddress(activeAddress, 8)}</p>
          </div>
          <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Network</p>
            <p className="mt-2 text-sm font-semibold text-sky-200">{network}</p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-5 md:p-6">
        <h2 className="text-2xl font-semibold text-white">Stats</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total intents</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Executed intents</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{stats.executed}</p>
          </div>
          <div className="rounded-2xl border border-[#1F2937] bg-[#0f1728] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Success rate</p>
            <p className="mt-2 text-3xl font-bold text-sky-200">{stats.successRate.toFixed(1)}%</p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-5 md:p-6">
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-slate-200">
            Default expiry (minutes)
            <input
              type="number"
              min={5}
              max={10080}
              value={currentSettings.defaultExpiryMinutes}
              onChange={(event) => {
                const next = Number(event.target.value)
                setSettings({
                  ...currentSettings,
                  walletAddress: activeAddress,
                  defaultExpiryMinutes: Number.isFinite(next) ? next : currentSettings.defaultExpiryMinutes,
                })
              }}
              className="mt-2 w-full rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            {notificationKeys.map((key) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-sm text-slate-200">
                <span>{key}</span>
                <input
                  type="checkbox"
                  checked={currentSettings.notificationPreferences[key]}
                  onChange={(event) => updatePreference(key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={() => void saveSettings()} isLoading={saving}>Save Settings</Button>
        </div>
      </section>
    </div>
  )
}
