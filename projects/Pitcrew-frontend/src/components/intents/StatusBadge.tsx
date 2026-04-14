import React from 'react';
import { Badge } from '../ui/Badge';
import { IntentStatus } from '../../types/intent';

interface StatusBadgeProps {
  status: IntentStatus;
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showLabel = true }) => {
  const icons = {
    active: '🔵',
    triggered: '🟠',
    executed: '✅',
    cancelled: '❌',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icons[status]}</span>
      {showLabel && <Badge status={status} />}
    </div>
  );
};
