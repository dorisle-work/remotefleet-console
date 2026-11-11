import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface SystemStatus {
  service: string;
  healthCheckCronEnabled: boolean;
  healthCheckCron: string;
  alerting: {
    telegramConfigured: boolean;
    discordConfigured: boolean;
  };
  fleet: {
    totalServers: number;
    idle: number;
    deploying: number;
    offline: number;
    error: number;
    deployments: number;
  };
}

export function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/system/status');
      if (!res.ok) throw new Error('Không tải được system status');
      setStatus((await res.json()) as SystemStatus);
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
      <section className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">
          Trạng thái hệ thống & lịch health check
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

      {status && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Scheduler
            </p>
            <p className="mt-2 text-[15px] font-semibold text-ink">
              Health check cron:{' '}
              {status.healthCheckCronEnabled ? 'Bật' : 'Tắt'}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              Biểu thức: {status.healthCheckCron}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Alerting
            </p>
            <p className="mt-2 text-[13px] text-slate-600">
              Telegram:{' '}
              {status.alerting.telegramConfigured
                ? 'đã cấu hình'
                : 'chưa cấu hình'}
            </p>
            <p className="mt-1 text-[13px] text-slate-600">
              Discord:{' '}
              {status.alerting.discordConfigured
                ? 'đã cấu hình'
                : 'chưa cấu hình'}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.04)] md:col-span-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Fleet snapshot
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Servers', status.fleet.totalServers],
                ['Idle', status.fleet.idle],
                ['Deploying', status.fleet.deploying],
                ['Offline', status.fleet.offline],
                ['Error', status.fleet.error],
                ['Deployments', status.fleet.deployments],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl bg-[#f5f6f8] px-3 py-2">
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className="text-[18px] font-semibold tabular-nums text-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
