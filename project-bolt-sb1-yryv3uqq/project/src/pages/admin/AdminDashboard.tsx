import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, IndianRupee, Activity, CheckCircle2, Clock, ArrowRight, TrendingUp, FolderKanban, Hourglass, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Table';
import { formatCurrency, formatDate, stageIndex } from '../../lib/helpers';
import type { Order } from '../../types';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    orders: 0,
    pendingOrders: 0,
    revenue: 0,
    active: 0,
    completed: 0,
    pendingPayments: 0,
    monthlyEarnings: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const [
        { count: students },
        { count: orders },
        { count: pendingPayments },
        { data: recentOrderData },
        { data: payments },
        { data: allOrders },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }).in('status', ['Pending', 'Verification Pending']),
        supabase.from('orders').select('*, project:projects(*), student:profiles(*)').order('order_date', { ascending: false }).limit(5),
        supabase.from('payments').select('amount, status, created_at'),
        supabase.from('orders').select('status'),
      ]);

      const orderStatuses = (allOrders || []).map((o: any) => o.status as string);
      const pendingOrders = orderStatuses.filter((s) => s === 'Request Submitted').length;
      const active = orderStatuses.filter((s) => stageIndex(s) < stageIndex('Project Completed')).length;
      const completed = orderStatuses.filter((s) => stageIndex(s) >= stageIndex('Project Completed')).length;

      const approvedRevenue = (payments || [])
        .filter((p: any) => p.status === 'Approved')
        .reduce((s: number, p: any) => s + Number(p.amount), 0);

      const monthlyEarnings = (payments || [])
        .filter((p: any) => {
          const pd = new Date(p.created_at);
          return p.status === 'Approved' && pd.getMonth() === currentMonth && pd.getFullYear() === currentYear;
        })
        .reduce((s: number, p: any) => s + Number(p.amount), 0);

      setStats({
        students: students ?? 0,
        orders: orders ?? 0,
        pendingOrders,
        revenue: approvedRevenue,
        active,
        completed,
        pendingPayments: pendingPayments ?? 0,
        monthlyEarnings,
      });
      setRecentOrders((recentOrderData as Order[]) || []);

      // monthly revenue chart
      const months: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const value = (payments || [])
          .filter((p: any) => {
            const pd = new Date(p.created_at);
            return (
              p.status === 'Approved' &&
              pd.getMonth() === d.getMonth() &&
              pd.getFullYear() === d.getFullYear()
            );
          })
          .reduce((s: number, p: any) => s + Number(p.amount), 0);
        months.push({ label, value });
      }
      setMonthlyData(months);
      setLoading(false);
    };
    load();
  }, []);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of platform activity and performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.students} icon={Users} tone="blue" />
        <StatCard label="Total Orders" value={stats.orders} icon={ShoppingBag} tone="violet" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} icon={Hourglass} tone="amber" />
        <StatCard label="Completed Orders" value={stats.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={IndianRupee} tone="green" />
        <StatCard label="Monthly Earnings" value={formatCurrency(stats.monthlyEarnings)} icon={Calendar} tone="indigo" />
        <StatCard label="Active Projects" value={stats.active} icon={Activity} tone="indigo" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} icon={Clock} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
              View all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-slate-400">Loading…</div>
            ) : recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No orders yet" />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {order.project?.title || 'Custom Project'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {order.student?.full_name || 'Student'} • {formatDate(order.order_date)} • {formatCurrency(order.amount)}
                      </p>
                    </div>
                    <Badge tone={stageIndex(order.status) >= stageIndex('Delivered') ? 'green' : 'blue'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (6 months)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex h-48 items-end justify-between gap-2">
              {monthlyData.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-violet-300 transition-all"
                      style={{ height: `${(m.value / maxMonthly) * 100}%`, minHeight: m.value > 0 ? '8px' : '2px' }}
                      title={formatCurrency(m.value)}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-slate-600">Total approved revenue: <strong className="text-slate-800">{formatCurrency(stats.revenue)}</strong></span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3">
              <FolderKanban size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Manage your project catalog</h3>
              <p className="text-sm text-slate-300">Add, edit, or remove projects to keep your catalog fresh.</p>
            </div>
          </div>
          <Link to="/admin/projects" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-transform hover:scale-105">
            Manage Projects <ArrowRight size={14} />
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
