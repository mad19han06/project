import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShoppingBag,
  CreditCard,
  Bell,
  LifeBuoy,
  Package,
  QrCode,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/deliverables', label: 'Deliverables', icon: Package },
  { to: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [pendingTickets, setPendingTickets] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['Open', 'In Progress']);
      setPendingTickets(count ?? 0);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-700 px-6">
          <div className="rounded-lg bg-violet-600 p-1.5 text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">EduProject Hub</p>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                  {item.label}
                </span>
                {item.to === '/admin/tickets' && pendingTickets > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingTickets}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{profile?.full_name || 'Admin'}</p>
              <p className="truncate text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-600 hover:text-white"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-violet-600 p-1.5 text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-white">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 shadow-xl animate-slide-in-right">
            <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-violet-600 p-1.5 text-white">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-bold text-white">Admin Panel</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                    {item.label}
                    {item.to === '/admin/tickets' && pendingTickets > 0 && (
                      <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {pendingTickets}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-700 p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-rose-600 hover:text-white"
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur lg:flex">
          <p className="text-sm text-slate-400">
            {navItems.find((n) => n.to === location.pathname)?.label || 'Admin'}
          </p>
          <div className="relative">
            <button
              onClick={() => setProfileMenu((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="max-w-[160px] truncate">{profile?.full_name || 'Admin'}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {profileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
