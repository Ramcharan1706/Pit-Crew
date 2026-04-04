import React from 'react';
import { Link } from 'react-router-dom';
import { Intent } from '../types/intent';
import StatusBadge from './StatusBadge';

interface IntentCardProps {
  intent: Intent;
  highlight?: boolean;
  currentPrice?: number | null;
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const IntentCard: React.FC<IntentCardProps> = ({ intent, highlight = false, currentPrice = null }) => {
  const targetPrice = intent.condition === 'price_breakout_pct'
    ? intent.initialPrice * (1 + intent.targetValue / 100)
    : intent.initialPrice * (1 - intent.targetValue / 100);
  const liveMove = currentPrice ? ((currentPrice - intent.initialPrice) / intent.initialPrice) * 100 : null;
  const distanceToTrigger = currentPrice ? Math.abs(((currentPrice - targetPrice) / targetPrice) * 100) : null;

  return (
    <article className={`intent-card ${highlight ? 'intent-card-highlight' : ''}`}>
      <header className="intent-card-header">
        <div>
          <h3 className="intent-card-title">{intent.amountAlgo} ALGO</h3>
          <p className="intent-card-subtitle">To {intent.recipient.slice(0, 8)}...{intent.recipient.slice(-6)}</p>
        </div>
        <StatusBadge status={intent.status} />
      </header>

      <dl className="intent-meta-grid">
        <div>
          <dt>Condition</dt>
          <dd>{intent.condition === 'price_breakout_pct' ? 'Price breakout' : 'Price drop'}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{intent.targetValue}%</dd>
        </div>
        <div>
          <dt>Target Price</dt>
          <dd>${targetPrice.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Live Move</dt>
          <dd>{liveMove !== null ? `${liveMove.toFixed(2)}%` : '—'}</dd>
        </div>
      </dl>

      <div className="panel-subtle">
        <p className="form-hint">Created {formatDate(intent.createdAt)}</p>
        {intent.expirationAt && <p className="form-hint">Expires {formatDate(intent.expirationAt)}</p>}
        {distanceToTrigger !== null && <p className="form-hint">Distance to trigger: {distanceToTrigger.toFixed(2)}%</p>}
        {intent.cancelReason && <p className="form-hint">Cancellation reason: {intent.cancelReason}</p>}
      </div>

      <footer className="intent-card-footer">
        <Link className="btn btn-secondary" to={`/intents/${intent.id}`}>
          View Details
        </Link>
      </footer>
    </article>
  );
};

export default IntentCard;
