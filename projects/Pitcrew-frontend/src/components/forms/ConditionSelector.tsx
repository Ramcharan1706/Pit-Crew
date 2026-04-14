import React from 'react';
import { Card } from '../ui/Card';
import { CONDITIONS } from '../../constants/conditions';

interface ConditionSelectorProps {
  selected: 'price_drop_pct' | 'price_breakout_pct';
  onChange: (condition: 'price_drop_pct' | 'price_breakout_pct') => void;
  disabled?: boolean;
}

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  selected,
  onChange,
  disabled = false,
}) => {
  const conditionTypes = ['price_drop_pct', 'price_breakout_pct'] as const;

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-3">
        Trigger Condition
      </label>

      <div className="grid grid-cols-2 gap-3">
        {conditionTypes.map((type) => {
          const config = CONDITIONS[type];
          const isSelected = selected === type;

          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              disabled={disabled}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <span className="font-bold text-white">{config.label}</span>
              </div>
              <p className="text-xs text-slate-400">{config.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
