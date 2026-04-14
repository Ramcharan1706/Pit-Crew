import React from 'react';
import { STATUS_COLORS } from '../../constants/conditions';
import { IntentStatus } from '../../types/intent';

interface BadgeProps {
  status: IntentStatus;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[status]}`}>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
