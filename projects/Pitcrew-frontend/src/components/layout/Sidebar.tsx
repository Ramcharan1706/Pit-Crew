import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { ellipseAddress } from '../../utils/formatters'

interface SidebarLink {
  name: string
  path: string
  icon: string
}

const links: SidebarLink[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '▦' },
  { name: 'Create Intent', path: '/create', icon: '+' },
  { name: 'Intents', path: '/intents', icon: '◎' },
  { name: 'Trigger Center', path: '/trigger-center', icon: '!' },
  { name: 'History', path: '/history', icon: '◷' },
  { name: 'Market', path: '/market', icon: '↗' },
  { name: 'Profile', path: '/profile', icon: '◉' },
  { name: 'Account', path: '/account', icon: '◈' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { activeAddress } = useWallet()

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-[#1F2937] bg-[#0B0F19] px-4 py-5 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pitcrew</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Intent Console</h1>
            <p className="mt-2 text-xs text-slate-400">Algorand automation control panel</p>
          </div>

          <nav className="space-y-2">
        {links.map((link) => {
          const isRoot = link.path === '/dashboard'
          const isActive = isRoot
            ? location.pathname === '/' || location.pathname === '/dashboard'
            : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)

          const isTrigger = link.path === '/trigger-center'

          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={`
                group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all
                ${
                  isActive
                    ? isTrigger
                      ? 'border-amber-400/50 bg-amber-500/15 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.28)]'
                      : 'border-sky-400/45 bg-sky-500/12 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.22)]'
                    : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/70 hover:text-white'
                }
              `}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs ${
                  isActive
                    ? 'border-current/30 bg-black/20'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {link.icon}
              </span>
              <span>{link.name}</span>
            </Link>
          )
        })}
          </nav>

          <div className="mt-auto space-y-2 pt-6">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 px-3 py-3 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-600 bg-slate-900/70 text-xs">⚙</span>
              Settings
            </button>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Wallet</p>
              <p className="mt-2 font-mono text-xs text-slate-200">{activeAddress ? ellipseAddress(activeAddress) : 'Not connected'}</p>
              <p className="mt-2 text-xs text-slate-400">Logout / wallet actions available in top bar</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
