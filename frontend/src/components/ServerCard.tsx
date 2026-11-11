import {
  Activity,
  GitCommitHorizontal,
  Pencil,
  Server,
  Trash2,
} from 'lucide-react';
import type { FleetServer } from '../types/fleet';
import { cn } from '../lib/utils';
import { HealthBadge } from './HealthBadge';

interface ServerCardProps {
  server: FleetServer;
  selected: boolean;
  busy?: boolean;
  onToggle: (id: string) => void;
  onEdit: (server: FleetServer) => void;
  onDelete: (server: FleetServer) => void;
  onHealthCheck: (server: FleetServer) => void;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg bg-[#f5f6f8] px-2 py-1.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-ink">
        {value === null ? '—' : `${value}%`}
      </p>
    </div>
  );
}

export function ServerCard({
  server,
  selected,
  busy,
  onToggle,
  onEdit,
  onDelete,
  onHealthCheck,
}: ServerCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition-shadow',
        selected && 'ring-2 ring-ink shadow-dock',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(server.id)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f6f8] text-ink">
                <Server className="h-4 w-4" />
              </span>
              <h3 className="truncate text-[14px] font-semibold text-ink">
                {server.name}
              </h3>
            </div>
            <p className="mt-2 truncate text-[12px] text-slate-500">
              {server.sshUser}@{server.ipAddress}:{server.sshPort}
            </p>
            <p className="mt-1 truncate text-[12px] text-slate-400">
              {server.appDirectory}
            </p>
          </div>
          <HealthBadge status={server.status} />
        </div>
      </button>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <Metric label="CPU" value={server.cpuPercent} />
        <Metric label="RAM" value={server.memPercent} />
        <Metric label="Disk" value={server.diskPercent} />
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-[12px] text-slate-400">
        <GitCommitHorizontal className="h-3.5 w-3.5" />
        <span className="min-w-0 flex-1 truncate tracking-tight">
          {server.currentCommit?.slice(0, 10) ?? 'Chưa theo dõi commit'}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Health check"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onHealthCheck(server);
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#f5f6f8] hover:text-ink disabled:opacity-40"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Sửa"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(server);
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#f5f6f8] hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Xoá"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(server);
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
