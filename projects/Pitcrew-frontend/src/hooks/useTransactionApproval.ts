import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import algosdk from 'algosdk';
import { Intent } from '../types/intent';
import { intentApi } from '../services/intentApi';
import { transactionService } from '../services/transactionService';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';

type ApprovalStage = 'idle' | 'waiting_wallet' | 'confirming_chain' | 'done' | 'failed';

export function useTransactionApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [approvalStage, setApprovalStage] = useState<ApprovalStage>('idle');
  const { activeAddress, signTransactions } = useWallet();
  const { enqueueSnackbar } = useSnackbar();

  const approveTransaction = async (intent: Intent): Promise<Intent | null> => {
    if (!activeAddress || !signTransactions) {
      const msg = 'Wallet not connected';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
      return null;
    }

    setIsLoading(true);
    setError(null);
    setTxId(null);
    setApprovalStage('waiting_wallet');

    try {
      const latestIntent = await intentApi.getById(intent.id);
      if (latestIntent.status !== 'triggered') {
        throw new Error(
          `Intent is ${latestIntent.status}. Refresh before approving.`
        );
      }

      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algodClient = new algosdk.Algodv2(
        String(algodConfig.token || ''),
        algodConfig.server,
        algodConfig.port ? parseInt(String(algodConfig.port), 10) : undefined
      );

      const paymentTxn = await transactionService.createPaymentTxn(
        activeAddress,
        intent.recipient,
        intent.amountAlgo,
        algodClient,
        `pitcrew_intent_${intent.id}`
      );

      const txBytes = algosdk.encodeUnsignedTransaction(paymentTxn);

      // Wrap signTransactions to match expected signature
      const wrappedSign = async (txs: Uint8Array[]) => {
        const result = await signTransactions(txs);
        if (!result) return [];
        return result.filter((b): b is Uint8Array => b !== null);
      };

      const newTxId = await transactionService.signAndSend(
        txBytes,
        wrappedSign,
        algodClient
      );

      setTxId(newTxId);
      setApprovalStage('confirming_chain');

      let onChainConfirmed = false;
      try {
        await transactionService.waitForConfirmation(algodClient, newTxId);
        onChainConfirmed = true;
      } catch {
        onChainConfirmed = false;
      }

      const confirmation = await intentApi.confirmExecution(intent.id, newTxId);

      if ('id' in confirmation) {
        const msg = onChainConfirmed
          ? 'Transaction confirmed on-chain'
          : 'Transaction submitted successfully';
        enqueueSnackbar(msg, { variant: 'success' });
        setApprovalStage('done');
        return confirmation;
      }

      enqueueSnackbar(confirmation.message, { variant: 'info' });
      setApprovalStage('failed');
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
      setApprovalStage('failed');
      enqueueSnackbar(msg, { variant: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    txId,
    approvalStage,
    approveTransaction,
  };
}
