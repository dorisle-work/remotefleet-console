import type { ServerStatus } from '../types/fleet';
import { cn } from '../lib/utils';

const TONE: Record<ServerStatus, string> = {
  idle: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  deploying: 'border-blue-300 bg-blue-50 text-blue-700',
  offline: 'border-slate-300 bg-slate-100 text-slate-700',
  error: 'border-rose-300 bg-rose-50 text-rose-700',
};

const DOT: Partial<Record<ServerStatus, string>> = {
  deploying: 'bg-blue-500 animate-pulse',
  idle: 'bg-emerald-500',
  error: 'bg-rose-500',
  offline: 'bg-slate-400',
};

const LABEL: Record<ServerStatus, string> = {
  idle: 'Idle',
  deploying: 'Deploying',
  offline: 'Offline',
  error: 'Error',
};

export function HealthBadge({ status }: { status: ServerStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded border px-1.5 text-[11px] font-medium leading-none',
        TONE[status],
      )}
    >
      {DOT[status] ? (
        <span className={cn('mr-1 h-1.5 w-1.5 rounded-full', DOT[status])} />
      ) : null}
      {LABEL[status]}
    </span>
  );
}
