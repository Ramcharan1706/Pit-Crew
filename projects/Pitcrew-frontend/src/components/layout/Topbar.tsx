import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { ellipseAddress, formatCurrency, formatPercentage } from '../../utils/formatters'
import { useIntentRealtime } from '../../context/IntentRealtimeContext'

interface TopbarProps {
  onOpenSidebar: () => void
}

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/create': 'Create Intent',
  '/intents': 'Intents',
  '/trigger-center': 'Trigger Center',
  '/history': 'History',
  '/market': 'Market',
  '/profile': 'Profile',
  '/account': 'Account',
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const location = useLocation()
  const { activeAddress, wallets, activeWallet } = useWallet()
  const { latestPrice, connectionStatus } = useIntentRealtime()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [baseline, setBaseline] = useState<number | null>(null)
  const networkLabel = (import.meta.env.VITE_ALGOD_NETWORK || 'testnet').toUpperCase()

  useEffect(() => {
    if (!latestPrice || latestPrice <= 0) {
      return
    }

    setBaseline((prev) => prev ?? latestPrice)
  }, [latestPrice])

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/intent/')) {
      return 'Intent Details'
    }

    return TITLES[location.pathname] || 'Pitcrew'
  }, [location.pathname])

  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => Number(b.isConnected) - Number(a.isConnected))
  }, [wallets])

  const changePct = useMemo(() => {
    if (!baseline || !latestPrice || baseline <= 0) {
      return 0
    }

    return ((latestPrice - baseline) / baseline) * 100
  }, [baseline, latestPrice])

  const handleConnectWallet = async (walletKey: string) => {
    const wallet = wallets.find((w) => w.walletKey === walletKey)
    if (!wallet) return

    await wallet.connect()
    wallet.setActive()
    setIsPickerOpen(false)
  }

  const handleDisconnect = async () => {
    if (!activeWallet) return
    await activeWallet.disconnect()
    setIsPickerOpen(false)
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#1F2937] bg-[#0B0F19]/95 backdrop-blur-md lg:left-[240px]">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-1 text-sm text-slate-200 lg:hidden"
          >
            Menu
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Intent Automation</p>
            <h2 className="text-xl font-bold text-white">{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden rounded-xl border border-slate-700 bg-slate-900/85 px-3 py-2 md:block">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">ALGO</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="ticker-live font-mono text-sm font-semibold text-slate-100">${formatCurrency(latestPrice ?? 0, 4)}</span>
              <span className={`text-xs font-semibold ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercentage(changePct)}
              </span>
            </div>
          </div>

          <div className="hidden rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-200 md:block">
            {networkLabel}
          </div>

          <div className={`hidden rounded-full px-3 py-1 text-xs font-semibold capitalize lg:block ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500/15 text-emerald-300'
              : connectionStatus === 'reconnecting'
                ? 'bg-amber-500/15 text-amber-200'
                : 'bg-red-500/15 text-red-300'
          }`}>
            {connectionStatus}
          </div>

          <button
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/85 px-3 py-2 transition hover:border-slate-500"
          >
            <span className="hidden font-mono text-xs text-slate-200 sm:block">
              {activeAddress ? ellipseAddress(activeAddress, 5) : 'Connect Wallet'}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-xs text-slate-100">
              {activeAddress ? 'W' : '?'}
            </span>
          </button>

          {isPickerOpen ? (
            <div className="absolute right-4 top-14 w-72 rounded-2xl border border-slate-700 bg-[#111827] p-2 shadow-2xl sm:right-6">
              {sortedWallets.map((wallet) => (
                <button
                  key={wallet.walletKey}
                  type="button"
                  onClick={() => handleConnectWallet(wallet.walletKey)}
                  className="mb-1 flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-slate-500"
                >
                  <span>{wallet.metadata.name}</span>
                  {wallet.isConnected ? <span className="text-emerald-300">Connected</span> : null}
                </button>
              ))}

              {activeAddress ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="mt-2 w-full rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                >
                  Disconnect Wallet
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
