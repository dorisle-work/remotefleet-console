import { FormEvent, useState } from 'react';
import { Rocket, X } from 'lucide-react';
import type { FleetServer } from '../types/fleet';

interface DeploymentTriggerModalProps {
  open: boolean;
  servers: FleetServer[];
  selectedIds: string[];
  onClose: () => void;
  onSubmit: (payload: {
    serverIds: string[];
    targetBranch: string;
    targetCommitHash?: string;
  }) => Promise<void>;
}

export function DeploymentTriggerModal({
  open,
  servers,
  selectedIds,
  onClose,
  onSubmit,
}: DeploymentTriggerModalProps) {
  const [branch, setBranch] = useState('main');
  const [commit, setCommit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const selectedServers = servers.filter((s) => selectedIds.includes(s.id));

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        serverIds: selectedIds,
        targetBranch: branch.trim(),
        targetCommitHash: commit.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white shadow-dock"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f6f8]">
              <Rocket className="h-4 w-4 text-ink" />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">Deploy Fleet</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-[#f5f6f8] hover:text-ink"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
              Nhánh mục tiêu
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
              Commit (tuỳ chọn)
            </label>
            <input
              value={commit}
              onChange={(e) => setCommit(e.target.value)}
              placeholder="abc123..."
              className="h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] tracking-tight text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-slate-600">
              Server đã chọn ({selectedServers.length})
            </p>
            <ul className="max-h-36 space-y-1 overflow-auto rounded-xl bg-[#f5f6f8] p-3">
              {selectedServers.map((server) => (
                <li key={server.id} className="text-[12px] tracking-tight text-slate-600">
                  {server.name} — {server.ipAddress}
                </li>
              ))}
              {selectedServers.length === 0 && (
                <li className="text-[12px] text-rose-600">Chọn ít nhất một server.</li>
              )}
            </ul>
          </div>

          {error && <p className="text-[13px] text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:bg-[#f5f6f8]"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting || selectedServers.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-bold text-white hover:bg-black disabled:opacity-50"
          >
            {submitting ? 'Đang deploy…' : 'Bắt đầu deploy'}
          </button>
        </div>
      </form>
    </div>
  );
}
