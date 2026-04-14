import React from 'react';
import { Intent } from '../../types/intent';

interface IntentLifecycleProps {
  intent: Intent;
  compact?: boolean;
}

const stages = ['active', 'triggered', 'awaiting approval', 'executed'] as const;

export const IntentLifecycle: React.FC<IntentLifecycleProps> = ({ intent, compact = false }) => {
  const currentStage = intent.status === 'executed'
    ? 3
    : intent.status === 'triggered'
      ? 2
      : 0;

  const stepLabels = stages.map((stage, index) => {
    const isActive = index <= currentStage;
    const isTriggered = intent.status === 'triggered' && index === 1;
    const isApproval = intent.status === 'triggered' && index === 2;
    return { stage, index, isActive, isTriggered, isApproval };
  });

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
      {stepLabels.map((step) => (
        <div
          key={step.stage}
          className={`rounded-2xl border px-3 py-3 ${step.isTriggered ? 'border-amber-300/60 bg-amber-400/15 text-amber-50' : step.isApproval ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-50' : step.isActive ? 'border-emerald-300/40 bg-emerald-400/10 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}
        >
          <div className="text-xs uppercase tracking-wide opacity-75">Step {step.index + 1}</div>
          <div className="mt-1 text-sm font-semibold capitalize">{step.stage}</div>
        </div>
      ))}

      {intent.status === 'cancelled' ? (
        <div className={`rounded-2xl border border-rose-300/40 bg-rose-500/10 px-3 py-3 text-rose-100 ${compact ? 'col-span-4' : 'col-span-2 md:col-span-4'}`}>
          <div className="text-xs uppercase tracking-wide opacity-75">Outcome</div>
          <div className="mt-1 text-sm font-semibold">Cancelled by user or expiry</div>
        </div>
      ) : null}
    </div>
  );
};
