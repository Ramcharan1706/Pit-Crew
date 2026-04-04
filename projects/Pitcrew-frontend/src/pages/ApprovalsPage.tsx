import React from 'react';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import TxApproval from '../components/TxApproval';

const ApprovalsPage: React.FC = () => {
  const { intents, upsertIntent } = useIntentRealtime();
  const triggered = intents.filter((intent) => intent.status === 'triggered');

  if (triggered.length === 0) {
    return (
      <section className="panel">
        <h2>Approval Queue</h2>
        <p>No triggered intents are waiting for signature.</p>
        <p className="panel-subtitle">If your intent is still Active, the configured price-drop condition has not been met yet.</p>
      </section>
    );
  }

  return (
    <section className="stack-gap">
      <h2>Approval Queue</h2>
      {triggered.map((intent) => (
        <TxApproval key={intent.id} intent={intent} onExecuted={upsertIntent} />
      ))}
    </section>
  );
};

export default ApprovalsPage;
