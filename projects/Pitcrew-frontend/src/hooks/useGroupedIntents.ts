import { useMemo } from 'react';
import { Intent } from '../types/intent';

export function useGroupedIntents(intents: Intent[]) {
  return useMemo(
    () => ({
      active: intents.filter((intent) => intent.status === 'active'),
      triggered: intents.filter((intent) => intent.status === 'triggered'),
      completed: intents.filter((intent) => intent.status === 'executed' || intent.status === 'cancelled'),
    }),
    [intents],
  );
}
