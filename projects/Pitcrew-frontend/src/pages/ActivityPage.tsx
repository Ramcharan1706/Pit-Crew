import React, { useMemo, useState } from 'react';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import IntentsTable from '../components/IntentsTable';
import TransactionsTable from '../components/TransactionsTable';
import { Intent } from '../types/intent';

const ActivityPage: React.FC = () => {
  const { intents } = useIntentRealtime();
  const [filter, setFilter] = useState<'all' | Intent['status']>('all');

  const historicalIntents = useMemo(() => {
    const completed = intents.filter((intent) => intent.status === 'executed' || intent.status === 'cancelled');
    if (filter === 'all') return completed;
    return completed.filter((intent) => intent.status === filter);
  }, [intents, filter]);

  return (
    <section className="stack-gap">
      <div className="section-header-row">
        <h2>Activity & History</h2>
        <div className="filter-group">
          <label htmlFor="history-filter">Status</label>
          <select id="history-filter" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | Intent['status'])}>
            <option value="all">All</option>
            <option value="executed">Executed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <IntentsTable intents={historicalIntents} title="Past Intents" emptyMessage="No historical activity yet." />

      <section className="table-section">
        <div className="table-section-header">
          <h2>Executed Transactions</h2>
          <span className="table-count">{historicalIntents.filter((intent) => intent.status === 'executed').length}</span>
        </div>
        <TransactionsTable intents={historicalIntents.filter((intent) => intent.status === 'executed')} />
      </section>
    </section>
  );
};

export default ActivityPage;
