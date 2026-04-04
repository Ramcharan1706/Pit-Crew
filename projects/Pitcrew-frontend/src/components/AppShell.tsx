import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import Account from './Account';
import ConnectWallet from './ConnectWallet';
import PriceTicker from './PriceTicker';
import { useIntentRealtime } from '../context/IntentRealtimeContext';

const AppShell: React.FC = () => {
  const { activeAddress } = useWallet();
  const { latestPrice, connectionStatus } = useIntentRealtime();
  const [openWalletModal, setOpenWalletModal] = useState(false);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand-group">
          <h1>Pitcrew</h1>
          <p>Intent Automation on Algorand</p>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/create">Create Intent</NavLink>
          <NavLink to="/approvals">Approvals</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/activity">Activity</NavLink>
        </nav>

        <div className="top-actions">
          <PriceTicker price={latestPrice} />
          <span className={`connection-pill connection-${connectionStatus}`}>{connectionStatus}</span>
          {activeAddress && <Account />}
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress ? 'Wallet' : 'Connect Wallet'}
          </button>
          <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
