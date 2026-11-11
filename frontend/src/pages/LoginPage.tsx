import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@remotefleet.test',
    name: 'Fleet Admin',
    roleLabel: 'Admin',
  },
  {
    email: 'ops@remotefleet.test',
    name: 'Console Operator',
    roleLabel: 'Operator',
  },
];

export function LoginPage() {
  const { operator, loading, login } = useAuth();
  const [email, setEmail] = useState('ops@remotefleet.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!loading && operator) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden flex-col justify-between bg-white px-7 py-7 text-ink lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-[12px] font-bold text-white">
              RF
            </span>
            <span className="text-[16px] font-semibold tracking-tight">
              RemoteFleet
            </span>
          </div>
          <p className="mt-8 text-[26px] font-semibold leading-snug">
            Deploy nhiều server, theo dõi log, rollback tự động.
          </p>
        </div>
        <p className="text-[19px] font-bold">Fleet · Console · Vault</p>
      </aside>
      <main className="flex items-center justify-center bg-[#f5f6f8] px-4 py-10">
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="w-full max-w-sm"
        >
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            Đăng nhập
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Mật khẩu demo của mọi tài khoản là <strong>password</strong>.
          </p>
          <label
            className="mt-5 block text-[12px] font-medium text-slate-600"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            className="mt-1 h-10 w-full rounded-xl border-0 bg-white px-3 text-[13px] shadow-[0_6px_16px_rgba(15,23,42,0.04)] outline-none"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label
            className="mt-3 block text-[12px] font-medium text-slate-600"
            htmlFor="password"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            className="mt-1 h-10 w-full rounded-xl border-0 bg-white px-3 text-[13px] shadow-[0_6px_16px_rgba(15,23,42,0.04)] outline-none"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p className="mt-2 text-[12px] text-rose-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-4 h-10 w-full rounded-lg bg-ink text-[13px] font-bold text-white hover:bg-black disabled:opacity-50"
          >
            {pending ? 'Đang đăng nhập...' : 'Vào console'}
          </button>
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                onClick={() => {
                  setEmail(account.email);
                  setPassword('password');
                }}
              >
                <span>
                  <span className="block text-[13px] text-slate-800">
                    {account.name}
                  </span>
                  <span className="text-[11px] tracking-tight text-slate-500">
                    {account.email}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {account.roleLabel}
                </span>
              </button>
            ))}
          </div>
        </form>
      </main>
    </div>
  );
}
