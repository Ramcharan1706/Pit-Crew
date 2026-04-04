import React, { useMemo, useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import IntentCard from './IntentCard';
import IntentForm from './IntentForm';
import TxApproval from './TxApproval';

const IntentsList: React.FC = () => {
  const { activeAddress } = useWallet();
  const { intents, latestPrice, upsertIntent } = useIntentRealtime();
  const [showForm, setShowForm] = useState(false);
  const [approvalIntentId, setApprovalIntentId] = useState<string | null>(null);

  const grouped = useMemo(
    () => ({
      active: intents.filter((intent) => intent.status === 'active'),
      triggered: intents.filter((intent) => intent.status === 'triggered'),
      completed: intents.filter((intent) => intent.status === 'executed' || intent.status === 'cancelled'),
    }),
    [intents],
  );

  if (!activeAddress) {
    return <div className="empty-state">Connect your wallet to view intents.</div>;
  }

  return (
    <section className="stack-gap">
      <div className="section-header-row">
        <h2>Your Intents</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((previous) => !previous)}>
          {showForm ? 'Close Form' : 'Create Intent'}
        </button>
      </div>

      {showForm && <IntentForm currentPrice={latestPrice} onIntentCreated={upsertIntent} />}

      {approvalIntentId && (
        <TxApproval
          intent={intents.find((intent) => intent.id === approvalIntentId)!}
          onExecuted={(intent) => {
            upsertIntent(intent);
            setApprovalIntentId(null);
          }}
          onClose={() => setApprovalIntentId(null)}
        />
      )}

      <div className="intent-grid">
        {grouped.triggered.map((intent) => (
          <div key={intent.id}>
            <IntentCard intent={intent} highlight currentPrice={latestPrice} />
            <button className="btn btn-secondary mt-8" onClick={() => setApprovalIntentId(intent.id)}>
              Approve Transaction
            </button>
          </div>
        ))}

        {grouped.active.map((intent) => (
          <IntentCard key={intent.id} intent={intent} currentPrice={latestPrice} />
        ))}

        {grouped.completed.map((intent) => (
          <IntentCard key={intent.id} intent={intent} currentPrice={latestPrice} />
        ))}
      </div>
    </section>
  );
};

export default IntentsList;
