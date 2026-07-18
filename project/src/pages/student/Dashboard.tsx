import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Activity,
  CheckCircle2,
  Clock,
  Bell,
  ArrowRight,
  FolderSearch,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Table';
import { formatCurrency, formatDate, timeAgo, stageIndex } from '../../lib/helpers';
import { PROJECT_STAGES, type Order, type Notification } from '../../types';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pendingPayments: 0 });

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const load = async () => {
      const [{ data: orderData }, { data: notifData }] = await Promise.all([
        supabase
          .from('orders')
          .select('*, project:projects(*), payments(*)')
          .eq('student_id', profile.id)
          .order('order_date', { ascending: false }),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (!active) return;
      setOrders((orderData as Order[]) || []);
      setNotifications((notifData as Notification[]) || []);

      const total = orderData?.length || 0;
      const completedCount = orderData?.filter((o) => stageIndex(o.status) >= stageIndex('Project Completed')).length || 0;
      const activeCount = total - completedCount;
      const pending = (orderData || []).reduce(
        (sum, o: any) => sum + (o.payments || []).filter((p: any) => p.status === 'Pending' || p.status === 'Verification Pending').length,
        0,
      );
      setStats({ total, active: activeCount, completed: completedCount, pendingPayments: pending });
      setLoading(false);
    };
    load();
  }, [profile]);

  const recentOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</h1>
        <p className="mt-1 text-sm text-slate-500">Here's a snapshot of your project activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Projects Ordered" value={stats.total} icon={ShoppingBag} tone="blue" />
        <StatCard label="Active Projects" value={stats.active} icon={Activity} tone="violet" />
        <StatCard label="Completed Projects" value={stats.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} icon={Clock} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-6 text-sm text-slate-400">Loading…</div>
              ) : recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" message="Browse the catalog to place your first order." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {order.project?.title || 'Custom Project Request'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDate(order.order_date)} • {formatCurrency(order.amount)}
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardBody>
              {recentOrders.length === 0 ? (
                <EmptyState icon={TrendingUp} title="No active projects" message="Your project progress will appear here." />
              ) : (
                <div className="space-y-5">
                  {recentOrders.slice(0, 3).map((order) => {
                    const idx = stageIndex(order.status);
                    const pct = Math.round((idx / (PROJECT_STAGES.length - 1)) * 100);
                    return (
                      <div key={order.id}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <p className="truncate font-medium text-slate-700">
                            {order.project?.title || 'Custom Project'}
                          </p>
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{order.status}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Notifications</CardTitle>
              <Link to="/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6 bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <CardBody>
              <FolderSearch size={28} className="mb-3 text-blue-100" />
              <h3 className="text-lg font-bold">Explore the catalog</h3>
              <p className="mt-1 text-sm text-blue-100">
                Discover 50+ ready-to-submit projects across AI, ML, Web, IoT, and more.
              </p>
              <Link
                to="/catalog"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-transform hover:scale-105"
              >
                Browse projects <ArrowRight size={14} />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
