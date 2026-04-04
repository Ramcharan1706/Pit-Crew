import React from 'react';
import { Intent } from '../types/intent';
import { getTxnExplorerUrl } from '../utils/explorer';

interface TransactionsTableProps {
  intents: Intent[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ intents }) => {
  if (intents.length === 0) {
    return <div className="empty-state">No executed transactions yet.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="intents-table">
        <thead>
          <tr>
            <th>Intent</th>
            <th>Amount</th>
            <th>Recipient</th>
            <th>Executed At</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {intents.map((intent) => (
            <tr key={intent.id}>
              <td>{intent.id.slice(0, 8)}...</td>
              <td>{intent.amountAlgo} ALGO</td>
              <td>{intent.recipient.slice(0, 10)}...{intent.recipient.slice(-6)}</td>
              <td>{intent.executedAt ? new Date(intent.executedAt).toLocaleString() : '-'}</td>
              <td>
                {intent.executionTxId ? (
                  <a className="table-link" href={getTxnExplorerUrl(intent.executionTxId)} target="_blank" rel="noreferrer">
                    {intent.executionTxId.slice(0, 10)}...
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
