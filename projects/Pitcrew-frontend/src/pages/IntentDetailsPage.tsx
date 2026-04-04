import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import { intentApi } from '../services/intentApi';
import { Intent } from '../types/intent';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import StatusBadge from '../components/StatusBadge';
import TxApproval from '../components/TxApproval';
import { getTxnExplorerUrl } from '../utils/explorer';

const formatTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

const IntentDetailsPage: React.FC = () => {
  const { intentId } = useParams();
  const { activeAddress } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { intents, upsertIntent } = useIntentRealtime();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const liveIntent = intents.find((item) => item.id === intentId) || null;

  useEffect(() => {
    setIntent(liveIntent);
  }, [liveIntent]);

  useEffect(() => {
    if (!intentId || liveIntent) return;

    const fetchIntent = async () => {
      setLoading(true);
      try {
        const data = await intentApi.getById(intentId);
        setIntent(data);
      } finally {
        setLoading(false);
      }
    };

    void fetchIntent();
  }, [intentId, liveIntent]);

  const timeline = useMemo(() => {
    if (!intent) return [];

    return [
      { label: 'Created', time: formatTime(intent.createdAt), done: true },
      { label: 'Triggered', time: formatTime(intent.triggeredAt), done: !!intent.triggeredAt },
      { label: 'Cancelled / Expired', time: formatTime(intent.cancelledAt), done: intent.status === 'cancelled' },
      {
        label: 'Awaiting Approval',
        time: intent.status === 'triggered' ? 'Now' : intent.triggeredAt ? 'Completed' : '-',
        done: intent.status === 'triggered' || intent.status === 'executed',
      },
      { label: 'Executed', time: formatTime(intent.executedAt), done: intent.status === 'executed' },
    ];
  }, [intent]);

  if (loading) return <div className="empty-state">Loading intent details...</div>;
  if (!intent) return <div className="empty-state">Intent not found.</div>;

  const canCancel = intent.status === 'active' || intent.status === 'triggered';

  const cancelIntent = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Connect your wallet to cancel this intent', { variant: 'warning' });
      return;
    }

    setCancelling(true);
    try {
      const cancelled = await intentApi.cancel(intent.id, activeAddress, 'Cancelled from intent details');
      setIntent(cancelled);
      upsertIntent(cancelled);
      enqueueSnackbar('Intent cancelled', { variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to cancel intent';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="panel stack-gap">
      <header className="section-header-row">
        <div>
          <h2>Intent Details</h2>
          <p className="panel-subtitle">Intent ID: {intent.id}</p>
        </div>
        <div className="section-header-row">
          <StatusBadge status={intent.status} />
          {canCancel && (
            <button className="btn btn-secondary" onClick={cancelIntent} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Intent'}
            </button>
          )}
        </div>
      </header>

      <div className="intent-meta-grid">
        <div>
          <dt>Amount</dt>
          <dd>{intent.amountAlgo} ALGO</dd>
        </div>
        <div>
          <dt>Recipient</dt>
          <dd>{intent.recipient}</dd>
        </div>
        <div>
          <dt>Trigger</dt>
          <dd>{intent.targetValue}% {intent.condition === 'price_breakout_pct' ? 'breakout' : 'drop'}</dd>
        </div>
        <div>
          <dt>Initial Price</dt>
          <dd>${intent.initialPrice.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{intent.expirationAt ? new Date(intent.expirationAt).toLocaleString() : 'No deadline'}</dd>
        </div>
      </div>

      <section>
        <h3>Status Timeline</h3>
        <ol className="timeline-list">
          {timeline.map((step) => (
            <li key={step.label} className={step.done ? 'timeline-done' : 'timeline-pending'}>
              <strong>{step.label}</strong>
              <span>{step.time}</span>
            </li>
          ))}
        </ol>
      </section>

      {intent.status === 'executed' && intent.executionTxId && (
        <section className="panel-subtle">
          <h3>Transaction Hash</h3>
          <a className="table-link" href={getTxnExplorerUrl(intent.executionTxId)} target="_blank" rel="noreferrer">
            {intent.executionTxId}
          </a>
        </section>
      )}

      {intent.status === 'cancelled' && intent.cancelReason && (
        <section className="panel-subtle">
          <h3>Cancellation Reason</h3>
          <p>{intent.cancelReason}</p>
        </section>
      )}

      {intent.status === 'triggered' && (
        <TxApproval
          intent={intent}
          onExecuted={(executed) => {
            setIntent(executed);
            upsertIntent(executed);
          }}
        />
      )}
    </section>
  );
};

export default IntentDetailsPage;
