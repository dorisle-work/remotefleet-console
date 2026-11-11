import { LogOut, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Topbar({
  onMenu,
  onSearchFocus,
}: {
  onMenu: () => void;
  onSearchFocus?: () => void;
}) {
  const { pathname } = useLocation();
  const { operator, logout } = useAuth();
  const title = pathname.startsWith('/console')
    ? 'Live Console'
    : pathname.startsWith('/deployments')
      ? 'Deployments'
      : pathname.startsWith('/settings')
        ? 'Settings'
        : 'Fleet';

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 bg-[#f5f6f8] px-4 lg:px-6">
      <button
        type="button"
        className="rounded-full p-2 text-slate-500 hover:bg-white lg:hidden"
        onClick={onMenu}
        aria-label="Mở menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-ink">{title}</p>
        {pathname.startsWith('/console/') ? (
          <p className="truncate text-[12px] text-slate-400">
            {pathname.split('/').pop()}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onSearchFocus}
        className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-full bg-white px-4 text-[13px] text-slate-400 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:inline-flex"
      >
        <Search className="h-4 w-4" />
        Tra cứu server, branch...
        <span className="ml-auto text-[11px] text-slate-300">/</span>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden text-right sm:block">
          <p className="text-[12px] font-medium leading-none text-slate-800">
            {operator?.name}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">{operator?.role}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(28,31,38,0.18)]">
          {operator?.name?.slice(0, 1) ?? 'R'}
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-full p-2 text-slate-500 hover:bg-white hover:text-ink"
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
