import React from 'react';
import { Link } from 'react-router-dom';
import { Intent } from '../types/intent';
import StatusBadge from './StatusBadge';

interface IntentsTableProps {
  intents: Intent[];
  title: string;
  emptyMessage: string;
}

const IntentsTable: React.FC<IntentsTableProps> = ({ intents, title, emptyMessage }) => {
  return (
    <section className="table-section">
      <div className="table-section-header">
        <h2>{title}</h2>
        <span className="table-count">{intents.length}</span>
      </div>

      {intents.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="table-wrapper">
          <table className="intents-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Amount</th>
                <th>Recipient</th>
                <th>Trigger</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {intents.map((intent) => (
                <tr key={intent.id}>
                  <td>
                    <StatusBadge status={intent.status} />
                  </td>
                  <td>{intent.amountAlgo} ALGO</td>
                  <td>{intent.recipient.slice(0, 10)}...{intent.recipient.slice(-6)}</td>
                  <td>{intent.targetValue}% drop</td>
                  <td>{new Date(intent.updatedAt).toLocaleString()}</td>
                  <td>
                    <Link className="table-link" to={`/intents/${intent.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default IntentsTable;
