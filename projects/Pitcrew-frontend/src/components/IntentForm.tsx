import React, { useMemo, useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import { intentApi } from '../services/intentApi';
import { Intent } from '../types/intent';

interface IntentFormProps {
  onIntentCreated: (intent: Intent) => void;
  currentPrice: number | null;
}

const isValidAlgorandAddress = (address: string) => /^[A-Z0-9]{58}$/.test(address);

const IntentForm: React.FC<IntentFormProps> = ({ onIntentCreated, currentPrice }) => {
  const { activeAddress } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [targetPct, setTargetPct] = useState('');
  const [condition, setCondition] = useState<'price_drop_pct' | 'price_breakout_pct'>('price_drop_pct');
  const [expirationMinutes, setExpirationMinutes] = useState('1440');
  const [submitting, setSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!amount || Number(amount) <= 0) return 'Amount must be greater than 0';
    if (!recipient || !isValidAlgorandAddress(recipient)) return 'Recipient must be a valid Algorand address';
    if (!targetPct || Number(targetPct) <= 0 || Number(targetPct) > 100) return 'Target threshold must be between 0 and 100';
    if (!expirationMinutes || Number(expirationMinutes) < 5) return 'Expiration must be at least 5 minutes';
    return null;
  }, [amount, recipient, targetPct, expirationMinutes]);

  const triggerPrice = useMemo(() => {
    if (!currentPrice || !targetPct) return null;
    const ratio = Number(targetPct) / 100;
    return condition === 'price_breakout_pct'
      ? currentPrice * (1 + ratio)
      : currentPrice * (1 - ratio);
  }, [condition, currentPrice, targetPct]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeAddress) {
      enqueueSnackbar('Connect wallet before creating an intent', { variant: 'warning' });
      return;
    }

    if (validationError) {
      enqueueSnackbar(validationError, { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const createdIntent = await intentApi.create({
        userAddress: activeAddress,
        condition,
        targetValue: Number(targetPct),
        amountAlgo: Number(amount),
        recipient: recipient.trim(),
        expirationMinutes: Number(expirationMinutes),
      });

      enqueueSnackbar('Intent created successfully', { variant: 'success' });
      enqueueSnackbar(
        condition === 'price_breakout_pct'
          ? 'Transaction will only appear after the breakout trigger is met.'
          : 'Transaction will only appear after the drop trigger is met.',
        { variant: 'info' },
      );
      setAmount('');
      setRecipient('');
      setTargetPct('');
      onIntentCreated(createdIntent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create intent';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Create Intent</h2>
        <p className="panel-subtitle">Current ALGO price: {currentPrice ? `$${currentPrice.toFixed(4)}` : 'Loading...'}</p>
      </header>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Trigger Type
          <select value={condition} onChange={(event) => setCondition(event.target.value as 'price_drop_pct' | 'price_breakout_pct')}>
            <option value="price_drop_pct">Price Drop</option>
            <option value="price_breakout_pct">Price Breakout</option>
          </select>
        </label>

        <label>
          Amount (ALGO)
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 2.5"
            required
          />
        </label>

        <label>
          Recipient Address
          <input
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value.toUpperCase())}
            placeholder="Algorand address"
            required
          />
        </label>

        <label>
          Valid For (minutes)
          <input
            type="number"
            min="5"
            step="5"
            value={expirationMinutes}
            onChange={(event) => setExpirationMinutes(event.target.value)}
            placeholder="1440"
            required
          />
        </label>

        <label>
          Trigger Threshold (%)
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={targetPct}
            onChange={(event) => setTargetPct(event.target.value)}
            placeholder="e.g. 5"
            required
          />
        </label>

        {currentPrice && triggerPrice !== null && (
          <div className="panel-subtle">
            <p className="form-hint">Current ALGO price: ${currentPrice.toFixed(4)}</p>
            <p className="form-hint">Target price: ${triggerPrice.toFixed(4)}</p>
          </div>
        )}

        {validationError && <p className="form-error">{validationError}</p>}

        <button className="btn btn-primary" type="submit" disabled={!!validationError || submitting}>
          {submitting ? 'Creating...' : 'Create Intent'}
        </button>
      </form>
    </section>
  );
};

export default IntentForm;
