import { useEffect, useState } from 'react';
import { ShoppingBag, ChevronRight, Calendar, IndianRupee, FileText, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Table';
import { formatCurrency, formatDate, stageIndex } from '../../lib/helpers';
import { PROJECT_STAGES, type Order } from '../../types';

export function StudentOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*, project:projects(*), payments(*), deliverable_files(*)')
      .eq('student_id', profile.id)
      .order('order_date', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track your project requests and their progress.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardBody className="py-16">
            <EmptyState icon={ShoppingBag} title="No orders yet" message="Browse the catalog to submit your first project request." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const idx = stageIndex(order.status);
            const pct = Math.round((idx / (PROJECT_STAGES.length - 1)) * 100);
            return (
              <Card key={order.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelected(order)}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{order.project?.title || 'Custom Project Request'}</h3>
                      <Badge tone={pct === 100 ? 'green' : 'blue'}>{order.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(order.order_date)}</span>
                      <span className="flex items-center gap-1"><IndianRupee size={12} /> {formatCurrency(order.amount)}</span>
                      {order.deadline && <span className="flex items-center gap-1"><FileText size={12} /> Due: {formatDate(order.deadline)}</span>}
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{selected.project?.title || 'Custom Project Request'}</h3>
              <p className="mt-1 text-sm text-slate-500">{selected.project?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-slate-400">Amount</p>
                <p className="font-semibold text-slate-700">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <p className="text-slate-400">Order date</p>
                <p className="font-semibold text-slate-700">{formatDate(selected.order_date)}</p>
              </div>
              <div>
                <p className="text-slate-400">Deadline</p>
                <p className="font-semibold text-slate-700">{formatDate(selected.deadline)}</p>
              </div>
              <div>
                <p className="text-slate-400">Category</p>
                <p className="font-semibold text-slate-700">{selected.project?.category || '—'}</p>
              </div>
            </div>
            {selected.requirements && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Your requirements</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{selected.requirements}</p>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-medium text-slate-600">Progress Timeline</p>
              <ol className="relative ml-3 border-l-2 border-slate-200">
                {PROJECT_STAGES.map((stage, i) => {
                  const done = i <= stageIndex(selected.status);
                  return (
                    <li key={stage} className="mb-4 ml-5 last:mb-0">
                      <span className={`absolute -left-[11px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${done ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        {done ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={8} className="text-slate-400" />}
                      </span>
                      <p className={`text-sm font-medium ${done ? 'text-slate-800' : 'text-slate-400'}`}>{stage}</p>
                      {i === stageIndex(selected.status) && (
                        <p className="text-xs text-blue-600">Current status</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
