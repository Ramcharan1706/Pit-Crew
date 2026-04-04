import React from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import IntentForm from '../components/IntentForm';
import { useIntentRealtime } from '../context/IntentRealtimeContext';

const CreateIntentPage: React.FC = () => {
  const { activeAddress } = useWallet();
  const { latestPrice, upsertIntent } = useIntentRealtime();

  if (!activeAddress) {
    return (
      <section className="panel">
        <h2>Connect Wallet</h2>
        <p>You need a connected wallet to create intents.</p>
      </section>
    );
  }

  return <IntentForm currentPrice={latestPrice} onIntentCreated={upsertIntent} />;
};

export default CreateIntentPage;
