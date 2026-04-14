import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'
import React from 'react'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { EmptyState } from '../components/ui/EmptyState'

const Account = () => {
  const { activeAddress, activeWallet } = useWallet()
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network ? algoConfig.network.toLowerCase() : 'localnet'
  }, [algoConfig.network])

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl border border-sky-400/35 bg-sky-500/10 p-5 md:p-6">
        <h1 className="text-3xl font-bold text-sky-100">Account</h1>
        <p className="mt-2 text-sm text-sky-100/90">
          View your connected wallet and network information.
        </p>
      </section>

      {!activeAddress ? (
        <section className="surface-card rounded-3xl p-5 md:p-6">
          <EmptyState
            icon="⊙"
            title="No Wallet Connected"
            description="Connect a wallet using the wallet button in the top right to get started."
          />
        </section>
      ) : (
        <>
          <section className="surface-card rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 md:p-6">
            <h2 className="text-xl font-semibold text-white">Connected Wallet</h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/70">
                  Wallet Address
                </p>
                <a
                  href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-2 font-mono text-lg text-emerald-300 hover:text-emerald-200 hover:underline"
                >
                  {ellipseAddress(activeAddress)}
                  <span className="text-xs">↗</span>
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/70">
                  Network
                </p>
                <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300">
                  ● {networkName}
                </p>
              </div>
            </div>
          </section>

          {activeWallet && (
            <section className="surface-card rounded-3xl border border-slate-600/40 bg-slate-800/50 p-5 md:p-6">
              <h2 className="text-xl font-semibold text-white">Active Provider</h2>
              <div className="mt-4">
                <p className="text-sm text-slate-300">{activeWallet.metadata.name}</p>
                <p className="mt-1 text-xs text-slate-500">Currently connected wallet provider</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default Account
