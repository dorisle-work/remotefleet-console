import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckSquare,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Square,
} from 'lucide-react';
import { ServerCard } from '../components/ServerCard';
import { DeploymentTriggerModal } from '../components/DeploymentTriggerModal';
import { ServerFormModal } from '../components/ServerFormModal';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';
import type {
  Deployment,
  FleetServer,
  HealthCheckResult,
  ServerFormValues,
  ServerStatus,
} from '../types/fleet';

const STATUS_FILTERS: Array<{ id: 'all' | ServerStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'idle', label: 'Idle' },
  { id: 'deploying', label: 'Deploying' },
  { id: 'offline', label: 'Offline' },
  { id: 'error', label: 'Error' },
];

export function FleetOverviewPage() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<FleetServer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FleetServer | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServerStatus>('all');

  async function loadServers(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/servers');
      if (!res.ok) throw new Error('Không tải được danh sách server');
      const data = (await res.json()) as FleetServer[];
      setServers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServers();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((server) => {
      if (statusFilter !== 'all' && server.status !== statusFilter) return false;
      if (!q) return true;
      return (
        server.name.toLowerCase().includes(q) ||
        server.ipAddress.toLowerCase().includes(q) ||
        server.sshUser.toLowerCase().includes(q)
      );
    });
  }, [servers, query, statusFilter]);

  const counts = useMemo(
    () => ({
      idle: servers.filter((s) => s.status === 'idle').length,
      deploying: servers.filter((s) => s.status === 'deploying').length,
      offline: servers.filter((s) => s.status === 'offline').length,
      error: servers.filter((s) => s.status === 'error').length,
    }),
    [servers],
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  function toggleServer(id: string): void {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll(): void {
    if (allFilteredSelected) {
      const filteredSet = new Set(filtered.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
      return;
    }
    setSelectedIds((prev) => [
      ...new Set([...prev, ...filtered.map((s) => s.id)]),
    ]);
  }

  async function handleDeploy(payload: {
    serverIds: string[];
    targetBranch: string;
    targetCommitHash?: string;
  }): Promise<void> {
    const res = await apiFetch('/api/v1/deployments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || 'Deploy thất bại');
    }
    const deployment = (await res.json()) as Deployment;
    navigate(`/console/${deployment.id}`);
  }

  async function handleSaveServer(values: ServerFormValues): Promise<void> {
    if (editing) {
      const res = await apiFetch(`/api/v1/servers/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast(`Đã cập nhật ${values.name}`);
    } else {
      if (!values.credential) throw new Error('Credential là bắt buộc');
      const res = await apiFetch('/api/v1/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast(`Đã thêm ${values.name}`);
    }
    setFormOpen(false);
    setEditing(null);
    await loadServers();
  }

  async function handleDelete(server: FleetServer): Promise<void> {
    if (!window.confirm(`Xoá server ${server.name}?`)) return;
    const res = await apiFetch(`/api/v1/servers/${server.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => id !== server.id));
    setToast(`Đã xoá ${server.name}`);
    await loadServers();
  }

  async function runHealthCheck(ids?: string[]): Promise<void> {
    setChecking(true);
    try {
      const res = await apiFetch('/api/v1/servers/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids && ids.length > 0 ? { serverIds: ids } : {}),
      });
      if (!res.ok) throw new Error(await res.text());
      const results = (await res.json()) as HealthCheckResult[];
      const ok = results.filter((r) => r.ok).length;
      setToast(`Health check xong: ${ok}/${results.length} online`);
      await loadServers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChecking(false);
      setBusyId(null);
    }
  }

  async function handleHealthOne(server: FleetServer): Promise<void> {
    setBusyId(server.id);
    await runHealthCheck([server.id]);
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <section className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="fleet-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tra cứu server, IP..."
            className="h-10 w-full rounded-full border-0 bg-white pl-9 pr-4 text-[13px] shadow-[0_6px_16px_rgba(15,23,42,0.04)] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={toggleSelectAll}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:text-ink"
        >
          {allFilteredSelected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          Chọn hết
        </button>
        <button
          type="button"
          onClick={() => void loadServers()}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
        <button
          type="button"
          disabled={checking}
          onClick={() =>
            void runHealthCheck(
              selectedIds.length > 0 ? selectedIds : undefined,
            )
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:text-ink disabled:opacity-40"
        >
          <Activity className="h-3.5 w-3.5" />
          {checking ? 'Checking…' : 'Health check'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm server
        </button>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={selectedIds.length === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(28,31,38,0.16)] hover:bg-black disabled:opacity-40"
        >
          <Rocket className="h-3.5 w-3.5" />
          Deploy ({selectedIds.length})
        </button>
      </section>

      <section className="flex flex-wrap items-center gap-1">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatusFilter(item.id)}
            className={cn(
              'h-8 rounded-lg px-2.5 text-[12px] font-medium',
              statusFilter === item.id
                ? 'bg-ink text-white shadow-[0_8px_18px_rgba(28,31,38,0.16)]'
                : 'bg-white text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Idle', value: counts.idle, tone: 'text-emerald-600' },
          { label: 'Deploying', value: counts.deploying, tone: 'text-blue-600' },
          { label: 'Offline', value: counts.offline, tone: 'text-slate-600' },
          { label: 'Error', value: counts.error, tone: 'text-rose-600' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white px-4 py-3 shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[12px] font-medium text-slate-400">{item.label}</p>
            <p className={cn('mt-1 text-[22px] font-semibold tracking-tight', item.tone)}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {loading && <p className="text-[13px] text-slate-400">Đang tải fleet…</p>}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              selected={selectedIds.includes(server.id)}
              busy={busyId === server.id || checking}
              onToggle={toggleServer}
              onEdit={(s) => {
                setEditing(s);
                setFormOpen(true);
              }}
              onDelete={(s) => void handleDelete(s)}
              onHealthCheck={(s) => void handleHealthOne(s)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white px-6 py-16 text-center text-[13px] text-slate-400 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
              {servers.length === 0
                ? 'Chưa có server. Thêm VPS đầu tiên để bắt đầu.'
                : 'Không tìm thấy server khớp bộ lọc.'}
            </div>
          )}
        </div>
      )}

      <DeploymentTriggerModal
        open={modalOpen}
        servers={servers}
        selectedIds={selectedIds}
        onClose={() => setModalOpen(false)}
        onSubmit={handleDeploy}
      />

      <ServerFormModal
        open={formOpen}
        server={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSaveServer}
      />

      {toast ? (
        <div className="pointer-events-none fixed right-4 top-14 z-50 w-72">
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 shadow-dock">
            {toast}
          </p>
        </div>
      ) : null}
    </div>
  );
}
