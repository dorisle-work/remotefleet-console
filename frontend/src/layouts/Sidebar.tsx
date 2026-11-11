import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Server,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const LINKS = [
  { to: '/', label: 'Fleet', icon: Server, end: true },
  { to: '/deployments', label: 'Deployments', icon: Rocket, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { operator } = useAuth();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          aria-label="Đóng menu"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col bg-white text-ink transition-[width,transform] lg:static lg:translate-x-0',
          collapsed && 'lg:w-[76px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center gap-2.5 px-5',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-[12px] font-bold text-white">
            RF
          </span>
          <span
            className={cn(
              'text-[15px] font-semibold tracking-tight',
              collapsed && 'lg:hidden',
            )}
          >
            RemoteFleet
          </span>
        </div>

        <nav className="min-h-0 flex-1 overflow-auto px-3">
          <p
            className={cn(
              'px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400',
              collapsed && 'lg:sr-only',
            )}
          >
            Vận hành
          </p>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              title={link.label}
              className={({ isActive }) =>
                cn(
                  'mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-500',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive ? 'bg-[#eef0f3] text-ink' : 'hover:bg-[#f5f6f8]',
                )
              }
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={cn('mt-auto px-5 py-4', collapsed && 'lg:hidden')}>
          <div className="flex items-center gap-2 rounded-xl bg-[#f5f6f8] px-3 py-2.5">
            <LayoutDashboard className="h-4 w-4 text-tide" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">
                {operator?.name ?? 'Operator'}
              </p>
              <p className="truncate text-[12px] text-slate-400">
                {operator?.email}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="hidden h-12 items-center justify-center text-slate-400 hover:text-ink lg:flex"
          onClick={onToggle}
          aria-label={collapsed ? 'Mở sidebar' : 'Thu sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </aside>
    </>
  );
}
