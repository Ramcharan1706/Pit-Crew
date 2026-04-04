import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import IntentCard from '../components/IntentCard';
import TxApproval from '../components/TxApproval';
import IntentsTable from '../components/IntentsTable';

const DashboardPage: React.FC = () => {
  const { activeAddress } = useWallet();
  const { intents, loading, fetchError, latestPrice, upsertIntent } = useIntentRealtime();
  const [approvalIntentId, setApprovalIntentId] = useState<string | null>(null);

  const grouped = useMemo(
    () => ({
      active: intents.filter((intent) => intent.status === 'active'),
      triggered: intents.filter((intent) => intent.status === 'triggered'),
      executed: intents.filter((intent) => intent.status === 'executed' || intent.status === 'cancelled'),
    }),
    [intents],
  );

  const selectedApprovalIntent = intents.find((intent) => intent.id === approvalIntentId) || null;

  if (!activeAddress) {
    return (
      <section className="panel">
        <h2>Connect Wallet</h2>
        <p>Connect your wallet to view active intents and approvals in real time.</p>
      </section>
    );
  }

  return (
    <section className="stack-gap">
      <div className="summary-grid">
        <article className="summary-card">
          <h3>Total Intents</h3>
          <p>{intents.length}</p>
        </article>
        <article className="summary-card">
          <h3>Active</h3>
          <p>{grouped.active.length}</p>
        </article>
        <article className="summary-card summary-card-highlight">
          <h3>Triggered</h3>
          <p>{grouped.triggered.length}</p>
        </article>
        <article className="summary-card">
          <h3>Executed</h3>
          <p>{grouped.executed.filter((intent) => intent.status === 'executed').length}</p>
        </article>
      </div>

      {loading && <div className="empty-state">Loading intents...</div>}
      {fetchError && <div className="form-error">{fetchError}</div>}

      {selectedApprovalIntent && (
        <TxApproval
          intent={selectedApprovalIntent}
          onExecuted={(intent) => {
            upsertIntent(intent);
            setApprovalIntentId(null);
          }}
          onClose={() => setApprovalIntentId(null)}
        />
      )}

      <section className="stack-gap">
        <div className="section-header-row">
          <h2>Triggered Intents</h2>
          <Link className="btn btn-secondary" to="/approvals">
            Open Approval Queue
          </Link>
        </div>

        {grouped.triggered.length === 0 ? (
          <div className="empty-state">No triggered intents right now.</div>
        ) : (
          <div className="intent-grid">
            {grouped.triggered.map((intent) => (
              <div key={intent.id}>
                <IntentCard intent={intent} highlight currentPrice={latestPrice} />
                <button className="btn btn-primary mt-8" onClick={() => setApprovalIntentId(intent.id)}>
                  Approve Transaction
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <IntentsTable intents={grouped.active} title="Active Intents" emptyMessage="No active intents yet." />
      <IntentsTable intents={grouped.executed} title="Executed History" emptyMessage="No completed intents yet." />
    </section>
  );
};

export default DashboardPage;
