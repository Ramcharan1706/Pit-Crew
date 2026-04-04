import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useWallet } from '@txnlab/use-wallet-react';
import { Intent } from '../types/intent';
import { intentApi } from '../services/intentApi';
import { socketService } from '../services/socket';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface IntentRealtimeContextValue {
  intents: Intent[];
  loading: boolean;
  fetchError: string | null;
  latestPrice: number | null;
  connectionStatus: ConnectionStatus;
  refreshIntents: () => Promise<void>;
  refreshPrice: () => Promise<void>;
  upsertIntent: (intent: Intent) => void;
}

const IntentRealtimeContext = createContext<IntentRealtimeContextValue | undefined>(undefined);

export const IntentRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeAddress } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const upsertIntent = (incomingIntent: Intent) => {
    setIntents((previous) => {
      const index = previous.findIndex((intent) => intent.id === incomingIntent.id);
      if (index === -1) {
        return [incomingIntent, ...previous];
      }

      const updated = [...previous];
      updated[index] = { ...updated[index], ...incomingIntent };
      return updated;
    });
  };

  const refreshIntents = async () => {
    if (!activeAddress) {
      setIntents([]);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const data = await intentApi.list(activeAddress);
      setIntents(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load intents';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrice = async () => {
    try {
      const health = await intentApi.health();
      if (typeof health.price === 'number') {
        setLatestPrice(health.price);
      }
    } catch {
      // Do not block UX if price service is momentarily unavailable.
    }
  };

  useEffect(() => {
    void refreshIntents();
  }, [activeAddress]);

  useEffect(() => {
    void refreshPrice();
    const intervalId = window.setInterval(() => {
      void refreshPrice();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!activeAddress) {
      return;
    }

    socketService.joinUser(activeAddress);
    const unsubscribePrice = socketService.subscribePrice((snapshot) => {
      if (typeof snapshot.usd === 'number' && snapshot.usd > 0) {
        setLatestPrice(snapshot.usd);
      }
    });

    const unsubscribeCreated = socketService.subscribe('intent_created', (intent) => {
      if (intent.userAddress !== activeAddress) return;
      upsertIntent(intent);
      enqueueSnackbar('New intent created', { variant: 'success' });
    });

    const unsubscribeTriggered = socketService.subscribe('intent_triggered', (intent) => {
      if (intent.userAddress !== activeAddress) return;
      upsertIntent(intent);
      enqueueSnackbar('Intent triggered: approval required', { variant: 'warning' });
    });

    const unsubscribeExecuted = socketService.subscribe('intent_executed', (intent) => {
      if (intent.userAddress !== activeAddress) return;
      upsertIntent(intent);
      enqueueSnackbar('Intent executed on-chain', { variant: 'success' });
    });

    const unsubscribeCancelled = socketService.subscribe('intent_cancelled', (intent) => {
      if (intent.userAddress !== activeAddress) return;
      upsertIntent(intent);
      enqueueSnackbar('Intent cancelled', { variant: 'info' });
    });

    return () => {
      socketService.leaveUser(activeAddress);
      unsubscribePrice();
      unsubscribeCreated();
      unsubscribeTriggered();
      unsubscribeExecuted();
      unsubscribeCancelled();
    };
  }, [activeAddress, enqueueSnackbar]);

  useEffect(() => {
    const stop = socketService.onConnectionState((state) => {
      setConnectionStatus(state);
      if (state === 'connected' && activeAddress) {
        socketService.joinUser(activeAddress);
      }
    });

    return () => {
      stop();
    };
  }, [activeAddress]);

  const value = useMemo(
    () => ({
      intents,
      loading,
      fetchError,
      latestPrice,
      connectionStatus,
      refreshIntents,
      refreshPrice,
      upsertIntent,
    }),
    [intents, loading, fetchError, latestPrice, connectionStatus],
  );

  return <IntentRealtimeContext.Provider value={value}>{children}</IntentRealtimeContext.Provider>;
};

export const useIntentRealtime = () => {
  const context = useContext(IntentRealtimeContext);
  if (!context) {
    throw new Error('useIntentRealtime must be used within IntentRealtimeProvider');
  }
  return context;
};
