import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import algosdk from 'algosdk';
import { Intent } from '../types/intent';
import { intentApi } from '../services/intentApi';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';

interface TxApprovalProps {
  intent: Intent;
  onExecuted: (intent: Intent) => void;
  onClose?: () => void;
}

const TxApproval: React.FC<TxApprovalProps> = ({ intent, onExecuted, onClose }) => {
  const { activeAddress, signTransactions, wallets } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const triggerPrice = intent.condition === 'price_breakout_pct'
    ? intent.initialPrice * (1 + intent.targetValue / 100)
    : intent.initialPrice * (1 - intent.targetValue / 100);

  const waitForConfirmation = async (client: algosdk.Algodv2, txId: string, maxAttempts = 30) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const pendingInfo = await client.pendingTransactionInformation(txId).do();
      const confirmedRound = Number((pendingInfo as { 'confirmed-round'?: number; confirmedRound?: number })['confirmed-round'] ?? (pendingInfo as { confirmedRound?: number }).confirmedRound ?? 0);
      if (confirmedRound > 0) {
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
    throw new Error('Transaction confirmation timed out. The intent will stay pending until the network confirms it.');
  };

  const approveTransaction = async () => {
    if (!activeAddress || !signTransactions) {
      setError('Wallet not connected. Please reconnect and retry.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const latestIntent = await intentApi.getById(intent.id);
      if (latestIntent.status !== 'triggered') {
        throw new Error(`Intent is ${latestIntent.status}. Refresh the page before approving again.`);
      }

      const algodClient = new algosdk.Algodv2(
        String(algodConfig.token || ''),
        algodConfig.server,
        algodConfig.port ? parseInt(String(algodConfig.port), 10) : undefined,
      );

      const suggestedParams = await algodClient.getTransactionParams().do();
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: intent.recipient,
        amount: Math.round(intent.amountAlgo * 1_000_000),
        note: new TextEncoder().encode(`pitcrew_intent_${intent.id}`),
        suggestedParams,
      });

      const txBytes = algosdk.encodeUnsignedTransaction(paymentTxn);
      const signedTransactions = await signTransactions([txBytes]);

      if (!signedTransactions?.[0]) {
        throw new Error('Signing was cancelled in wallet');
      }

      const sendResult = await algodClient.sendRawTransaction(signedTransactions[0]).do();
      const txId = sendResult.txid;
      setPendingTxId(txId);

      let confirmedOnChain = false;
      try {
        await waitForConfirmation(algodClient, txId);
        confirmedOnChain = true;
      } catch {
        confirmedOnChain = false;
      }

      const confirmation = await intentApi.confirmExecution(intent.id, txId);
      if ('id' in confirmation) {
        enqueueSnackbar(confirmedOnChain ? 'Transaction confirmed on-chain' : 'Transaction submitted and confirmed asynchronously', { variant: 'success' });
        onExecuted(confirmation);
        return;
      }

      enqueueSnackbar(confirmation.message, { variant: 'info' });
    } catch (caughtError) {
      const baseMessage = caughtError instanceof Error ? caughtError.message : 'Transaction failed';
      const message = `${baseMessage}. You can retry approval.`;
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="approval-modal" role="dialog" aria-modal="true" aria-label="Approve transaction">
      <div className="approval-card">
        <header>
          <h2>Approve Transaction</h2>
          <p className="panel-subtitle">
            Condition met: {intent.condition === 'price_breakout_pct' ? 'price breakout' : 'price drop'} at {intent.targetValue}%.
          </p>
        </header>

        <div className="approval-grid">
          <p>
            <strong>Amount</strong>
            <span>{intent.amountAlgo} ALGO</span>
          </p>
          <p>
            <strong>Receiver</strong>
            <span>{intent.recipient}</span>
          </p>
          <p>
            <strong>Target Price</strong>
            <span>${triggerPrice.toFixed(4)}</span>
          </p>
          <p>
            <strong>Expires</strong>
            <span>{intent.expirationAt ? new Date(intent.expirationAt).toLocaleString() : 'No deadline'}</span>
          </p>
        </div>

        <div className="panel-subtle">
          <p className="form-hint">Intent: {intent.id}</p>
          <p className="form-hint">Your wallet will only sign the payment after you approve this preview.</p>
        </div>

        {pendingTxId && <p className="form-hint">Submitted tx: {pendingTxId}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="approval-actions">
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
          )}
          <button className="btn btn-primary" onClick={approveTransaction} disabled={loading}>
            {loading ? 'Processing...' : 'Approve Transaction'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default TxApproval;
