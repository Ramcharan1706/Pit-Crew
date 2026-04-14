import { IntentCondition } from '../types/intent';

export const CONDITIONS = {
  price_drop_pct: {
    label: 'Price Drop',
    description: 'Buy when price drops',
    icon: '📉',
    color: 'text-blue-500',
    badgeColor: 'bg-blue-500/20',
  },
  price_breakout_pct: {
    label: 'Momentum Buy',
    description: 'Buy on price spike',
    icon: '📈',
    color: 'text-green-500',
    badgeColor: 'bg-green-500/20',
  },
} as const;

export const CONDITION_OPTIONS = [
  { value: 'price_drop_pct' as IntentCondition, label: CONDITIONS.price_drop_pct.label },
  { value: 'price_breakout_pct' as IntentCondition, label: CONDITIONS.price_breakout_pct.label },
];

export const STATUS_COLORS = {
  active: 'bg-blue-500/20 text-blue-400',
  triggered: 'bg-yellow-500/20 text-yellow-400',
  executed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
} as const;

export const EXPIRY_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '7 days', value: 10080 },
];
