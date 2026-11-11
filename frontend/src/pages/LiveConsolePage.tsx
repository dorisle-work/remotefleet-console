import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { TerminalStream } from '../components/TerminalStream';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';
import type {
  Deployment,
  DeploymentLog,
  DeploymentStatus,
  DeploymentTarget,
} from '../types/fleet';

const STATUS_TONE: Record<DeploymentStatus, string> = {
  queued: 'border-slate-300 bg-slate-100 text-slate-700',
  running: 'border-blue-300 bg-blue-50 text-blue-700',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-300 bg-rose-50 text-rose-700',
  rolled_back: 'border-amber-300 bg-amber-50 text-amber-700',
};

export function LiveConsolePage() {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<DeploymentTarget | null>(
    null,
  );
  const [historyLogs, setHistoryLogs] = useState<DeploymentLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!deploymentId) return;

    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const res = await apiFetch(`/api/v1/deployments/${deploymentId}`);
        if (!res.ok) throw new Error('Không tải được deployment');
        const data = (await res.json()) as Deployment;
        if (!cancelled) setDeployment(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [deploymentId]);

  async function openHistory(target: DeploymentTarget): Promise<void> {
    if (!deploymentId) return;
    setHistoryTarget(target);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(
        `/api/v1/deployments/${deploymentId}/targets/${target.id}/logs`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { logs: DeploymentLog[] };
      setHistoryLogs(data.logs);
    } catch (err) {
      setHistoryLogs([]);
      alert((err as Error).message);
    } finally {
      setHistoryLoading(false);
    }
  }

  if (!deploymentId) {
    return <p className="p-6 text-[13px] text-rose-600">Thiếu deployment id</p>;
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <section className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-slate-500 hover:bg-white hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Fleet
        </Link>
        {deployment ? (
          <>
            <span
              className={cn(
                'inline-flex h-5 items-center rounded border px-1.5 text-[11px] font-medium leading-none',
                STATUS_TONE[deployment.status],
              )}
            >
              {deployment.status}
            </span>
            <span className="text-[12px] text-slate-400">
              nhánh{' '}
              <span className="font-medium text-slate-600">
                {deployment.targetBranch}
              </span>
              {' · '}
              {deployment.successfulServers}/{deployment.totalServers} ok
            </span>
          </>
        ) : null}
      </section>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}
      {!deployment && !error && (
        <p className="text-[13px] text-slate-400">Đang kết nối console…</p>
      )}

      {deployment ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Server</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Exit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {deployment.targets.map((target) => (
                <tr key={target.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {target.server?.name ?? `#${target.serverId}`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{target.status}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {target.exitCode ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openHistory(target)}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-ink hover:underline"
                    >
                      <ScrollText className="h-3.5 w-3.5" />
                      Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="space-y-4">
        {deployment?.targets.map((target) => (
          <TerminalStream
            key={target.id}
            deploymentId={deployment.id}
            serverId={target.serverId}
            serverName={target.server?.name ?? `Server #${target.serverId}`}
          />
        ))}
      </div>

      {historyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-dock">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[15px] font-semibold text-ink">
                  Log lịch sử — {historyTarget.server?.name ?? historyTarget.id}
                </p>
                <p className="text-[12px] text-slate-400">{historyTarget.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="h-9 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:bg-[#f5f6f8]"
              >
                Đóng
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-ink px-4 py-3 text-[12px] leading-relaxed text-[#f5f6f8]">
              {historyLoading && <p className="text-slate-400">Đang tải logs…</p>}
              {!historyLoading && historyLogs.length === 0 && (
                <p className="text-slate-400">Chưa có log được lưu.</p>
              )}
              {historyLogs.map((log) => (
                <pre key={log.id} className="whitespace-pre-wrap break-words font-sans">
                  <span className="text-slate-500">[{log.streamType}] </span>
                  {log.logContent}
                </pre>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
