import React, { useMemo } from 'react';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import TransactionsTable from '../components/TransactionsTable';

const TransactionsPage: React.FC = () => {
  const { intents } = useIntentRealtime();

  const executedIntents = useMemo(
    () => intents.filter((intent) => intent.status === 'executed').sort((a, b) => (b.executedAt || '').localeCompare(a.executedAt || '')),
    [intents],
  );

  return (
    <section className="stack-gap">
      <div className="section-header-row">
        <h2>Transactions</h2>
        <p className="panel-subtitle">Signed and submitted via wallet approval flow.</p>
      </div>
      <TransactionsTable intents={executedIntents} />
    </section>
  );
};

export default TransactionsPage;
