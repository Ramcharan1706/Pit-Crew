import React, { useMemo, useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import { useIntentRealtime } from '../context/IntentRealtimeContext';
import { IntentCard } from '../components/intents/IntentCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { intentApi } from '../services/intentApi';
import { Intent, IntentStatus } from '../types/intent';

const STATUS_FILTERS: Array<{ label: string; value: IntentStatus | 'expired' | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Triggered', value: 'triggered' },
  { label: 'Expired', value: 'expired' },
  { label: 'Executed', value: 'executed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const isIntentExpired = (intent: Intent): boolean => {
  if (intent.status !== 'active' || !intent.expirationAt) {
    return false;
  }

  return new Date(intent.expirationAt).getTime() <= Date.now();
};

export const Intents: React.FC = () => {
  const { activeAddress } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { intents, loading, fetchError, refreshIntents } = useIntentRealtime();
  const [statusFilter, setStatusFilter] = useState<IntentStatus | 'expired' | 'all'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return intents.filter((intent) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'expired' && !isIntentExpired(intent)) {
          return false;
        }

        if (statusFilter !== 'expired' && intent.status !== statusFilter) {
          return false;
        }
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.trim().toLowerCase();
      return intent.id.toLowerCase().includes(query) || intent.recipient.toLowerCase().includes(query);
    });
  }, [intents, search, statusFilter]);

  const handleCancel = async (intentId: string) => {
    if (!activeAddress) {
      enqueueSnackbar('Connect your wallet to cancel an intent', { variant: 'warning' });
      return;
    }

    try {
      setBusyId(intentId);
      await intentApi.cancel(intentId, activeAddress, 'Cancelled from Intents page');
      enqueueSnackbar('Intent cancelled', { variant: 'success' });
      await refreshIntents();
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Cancellation failed', {
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!activeAddress) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect Wallet"
        description="Connect your wallet to manage your intents"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Intents</h1>
        <p className="text-slate-300">Manage all intents with real-time lifecycle updates.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by intent ID or recipient"
            className="w-full rounded-xl border border-white/15 bg-[#0f1730] px-3 py-2 text-white outline-none focus:border-cyan-300/70"
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${statusFilter === filter.value ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-red-200">{fetchError}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧭"
          title="No intents found"
          description="Try changing your status filter or search query."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((intent) => (
            <div key={intent.id} className="space-y-2">
              <IntentCard
                intent={intent}
                onCancel={(intent.status === 'active' || intent.status === 'triggered') && !isIntentExpired(intent)
                  ? () => void handleCancel(intent.id)
                  : undefined}
              />
              {busyId === intent.id ? (
                <Button variant="secondary" size="sm" isLoading className="w-full">
                  Processing
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
