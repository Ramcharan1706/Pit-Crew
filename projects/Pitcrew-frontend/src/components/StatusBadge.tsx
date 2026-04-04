import React from 'react';
import { Intent } from '../types/intent';

type IntentStatus = Intent['status'] | 'awaiting_approval';

const STATUS_CONFIG: Record<IntentStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'status-active' },
  triggered: { label: 'Triggered', className: 'status-triggered' },
  awaiting_approval: { label: 'Awaiting Approval', className: 'status-triggered' },
  executed: { label: 'Executed', className: 'status-executed' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
};

interface StatusBadgeProps {
  status: IntentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
};

export default StatusBadge;
