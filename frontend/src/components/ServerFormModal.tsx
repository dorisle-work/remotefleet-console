import { FormEvent } from 'react';
import type { FleetServer, ServerFormValues } from '../types/fleet';

interface ServerFormModalProps {
  open: boolean;
  server?: FleetServer | null;
  onClose: () => void;
  onSubmit: (values: ServerFormValues) => Promise<void>;
}

export function ServerFormModal({
  open,
  server,
  onClose,
  onSubmit,
}: ServerFormModalProps) {
  if (!open) return null;

  const editing = Boolean(server);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credential = String(form.get('credential') || '');
    const values: ServerFormValues = {
      name: String(form.get('name') || ''),
      ipAddress: String(form.get('ipAddress') || ''),
      sshPort: Number(form.get('sshPort') || 22),
      sshUser: String(form.get('sshUser') || ''),
      appDirectory: String(form.get('appDirectory') || ''),
      gitRepository: String(form.get('gitRepository') || '') || undefined,
      authType: String(form.get('authType') || 'key') as 'key' | 'password',
    };
    if (credential) {
      values.credential = credential;
    }
    await onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <form
        className="w-full max-w-lg rounded-2xl bg-white shadow-dock"
        onSubmit={(e) => {
          void handleSubmit(e).catch((err: Error) => alert(err.message));
        }}
      >
        <div className="px-5 py-4 text-[15px] font-semibold text-ink">
          {editing ? 'Cập nhật server' : 'Đăng ký server'}
        </div>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-slate-600">
            Tên
            <input
              name="name"
              defaultValue={server?.name ?? ''}
              placeholder="VPS-Client-HCM-01"
              required
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Địa chỉ IP
            <input
              name="ipAddress"
              defaultValue={server?.ipAddress ?? ''}
              placeholder="203.0.113.10"
              required
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Cổng SSH
            <input
              name="sshPort"
              defaultValue={server?.sshPort ?? 22}
              required
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            User SSH
            <input
              name="sshUser"
              defaultValue={server?.sshUser ?? ''}
              placeholder="deployer"
              required
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Thư mục app
            <input
              name="appDirectory"
              defaultValue={server?.appDirectory ?? ''}
              placeholder="/var/www/app"
              required
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Git repo
            <input
              name="gitRepository"
              defaultValue={server?.gitRepository ?? ''}
              placeholder="git@github.com:org/app.git"
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600 sm:col-span-2">
            Kiểu xác thực
            <select
              name="authType"
              defaultValue={server?.authType ?? 'key'}
              className="mt-1.5 h-10 w-full rounded-xl border-0 bg-[#f5f6f8] pl-3 text-[13px] text-ink outline-none"
            >
              <option value="key">SSH private key</option>
              <option value="password">Password</option>
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-600 sm:col-span-2">
            Credential {editing ? '(để trống nếu giữ nguyên)' : '(private key hoặc password)'}
            <textarea
              name="credential"
              required={!editing}
              rows={4}
              className="mt-1.5 w-full rounded-xl border-0 bg-[#f5f6f8] px-3 py-2 text-[12px] tracking-tight text-ink outline-none focus:ring-2 focus:ring-ink/20"
            />
          </label>
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
            className="h-9 rounded-lg bg-ink px-3 text-[13px] font-bold text-white hover:bg-black"
          >
            {editing ? 'Lưu thay đổi' : 'Lưu server'}
          </button>
        </div>
      </form>
    </div>
  );
}
