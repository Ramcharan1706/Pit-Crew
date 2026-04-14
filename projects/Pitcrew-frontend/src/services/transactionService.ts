import algosdk from 'algosdk';
import { intentApi } from './intentApi';

export const transactionService = {
  /**
   * Wait for transaction confirmation
   */
  waitForConfirmation: async (
    client: algosdk.Algodv2,
    txId: string,
    maxAttempts = 30,
    intervalMs = 1500
  ): Promise<void> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pendingInfo = await client.pendingTransactionInformation(txId).do();
      const confirmedRound = Number(
        (pendingInfo as any)['confirmed-round'] ??
          (pendingInfo as any).confirmedRound ??
          0
      );

      if (confirmedRound > 0) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Transaction confirmation timed out');
  },

  /**
   * Sign and send transaction with retry logic
   */
  signAndSend: async (
    txBytes: Uint8Array,
    signTransactions: (txs: Uint8Array[]) => Promise<Uint8Array[] | null>,
    algodClient: algosdk.Algodv2
  ): Promise<string> => {
    const signedTxs = await signTransactions([txBytes]);
    if (!signedTxs?.[0]) {
      throw new Error('Transaction signing was cancelled or failed');
    }

    const result = await algodClient.sendRawTransaction(signedTxs[0]).do();
    return result.txid;
  },

  /**
   * Create payment transaction
   */
  createPaymentTxn: async (
    sender: string,
    receiver: string,
    amount: number,
    algodClient: algosdk.Algodv2,
    note?: string
  ): Promise<algosdk.Transaction> => {
    const suggestedParams = await algodClient.getTransactionParams().do();

    return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender,
      receiver,
      amount: Math.round(amount * 1_000_000), // Convert to microAlgos
      note: note ? new TextEncoder().encode(note) : undefined,
      suggestedParams,
    });
  },
};
