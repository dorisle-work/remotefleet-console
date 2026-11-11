import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';
import type { Deployment, DeploymentStatus } from '../types/fleet';

const STATUS_TONE: Record<DeploymentStatus, string> = {
  queued: 'border-slate-300 bg-slate-100 text-slate-700',
  running: 'border-blue-300 bg-blue-50 text-blue-700',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-300 bg-rose-50 text-rose-700',
  rolled_back: 'border-amber-300 bg-amber-50 text-amber-700',
};

export function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/deployments');
      if (!res.ok) throw new Error('Không tải được deployments');
      setDeployments((await res.json()) as Deployment[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <section className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-slate-500">
          Lịch sử các đợt triển khai gần đây
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </section>

      {loading && <p className="text-[13px] text-slate-400">Đang tải…</p>}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Deployment</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Servers</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {deployments.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.initiatedBy}</p>
                    <p className="mt-0.5 text-[11px] tracking-tight text-slate-400">
                      {item.id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.targetBranch}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex h-5 items-center rounded border px-1.5 text-[11px] font-medium leading-none',
                        STATUS_TONE[item.status],
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.successfulServers}/{item.totalServers}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/console/${item.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-ink hover:underline"
                    >
                      Console
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {deployments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    Chưa có deployment nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
