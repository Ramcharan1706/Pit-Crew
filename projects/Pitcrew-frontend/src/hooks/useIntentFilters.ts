import { useState, useCallback } from 'react';
import { Intent } from '../types/intent';

export interface IntentFilters {
  search: string;
  status: Intent['status'] | 'all';
  condition: 'price_drop_pct' | 'price_breakout_pct' | 'all';
  amountMin: number;
  amountMax: number;
  sortBy: 'createdAt' | 'amountAlgo' | 'recipient' | 'status';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: IntentFilters = {
  search: '',
  status: 'all',
  condition: 'all',
  amountMin: 0,
  amountMax: Infinity,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useIntentFilters() {
  const [filters, setFilters] = useState<IntentFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback((key: keyof IntentFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filterIntents = useCallback((intents: Intent[]) => {
    return intents.filter((intent) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          intent.id.toLowerCase().includes(searchLower) ||
          intent.recipient.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.status !== 'all' && intent.status !== filters.status) {
        return false;
      }

      if (filters.condition !== 'all' && intent.condition !== filters.condition) {
        return false;
      }

      if (intent.amountAlgo < filters.amountMin || intent.amountAlgo > filters.amountMax) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const sortIntents = useCallback((intents: Intent[]) => {
    const sorted = [...intents];
    const { sortBy, sortOrder } = filters;

    const normalizeComparable = (value: unknown): string | number => {
      if (typeof value === 'number') {
        return value;
      }

      if (typeof value === 'string') {
        return value;
      }

      if (value === null || value === undefined) {
        return '';
      }

      return String(value);
    };

    sorted.sort((a, b) => {
      const aVal = normalizeComparable(sortBy === 'amountAlgo' ? a.amountAlgo : a[sortBy as keyof Intent]);
      const bVal = normalizeComparable(sortBy === 'amountAlgo' ? b.amountAlgo : b[sortBy as keyof Intent]);

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filters]);

  const processIntents = useCallback((intents: Intent[]) => {
    const filtered = filterIntents(intents);
    return sortIntents(filtered);
  }, [filterIntents, sortIntents]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filterIntents,
    sortIntents,
    processIntents,
  };
}
