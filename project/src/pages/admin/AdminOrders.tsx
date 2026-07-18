import { useEffect, useState } from 'react';
import { ShoppingBag, Eye, Filter, Check, X, UserCog, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select, Input, Label } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, stageIndex, logActivity } from '../../lib/helpers';
import { PROJECT_STAGES, type Order, type ProjectStatus } from '../../types';

export function AdminOrders() {
  const { push } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [developer, setDeveloper] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, project:projects(*), student:profiles(*), payments(*), deliverable_files(*)')
      .order('order_date', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: ProjectStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) push(error.message, 'error');
    else {
      push('Order status updated', 'success');
      const order = orders.find((o) => o.id === id);
      if (order) {
        await supabase.from('notifications').insert({
          user_id: order.student_id,
          message: `Your order "${order.project?.title || 'project'}" status updated to: ${status}.`,
          type: 'order',
        });
      }
      await logActivity('update_order_status', 'order', id, `Status → ${status}`);
    }
    setSelected(null);
    load();
  };

  const acceptOrder = async (id: string) => {
    await updateStatus(id, 'Payment Verified');
  };

  const rejectOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({ status: 'Request Submitted' }).eq('id', id);
    if (error) { push(error.message, 'error'); return; }
    const order = orders.find((o) => o.id === id);
    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.student_id,
        message: `Your order "${order.project?.title || 'project'}" has been rejected. Please contact support.`,
        type: 'order',
      });
    }
    await logActivity('reject_order', 'order', id, 'Order rejected');
    push('Order rejected', 'success');
    setSelected(null);
    load();
  };

  const assignDeveloper = async () => {
    if (!selected || !developer.trim()) return;
    const { error } = await supabase.from('orders').update({ assigned_developer: developer.trim() }).eq('id', selected.id);
    if (error) { push(error.message, 'error'); return; }
    await logActivity('assign_developer', 'order', selected.id, `Developer: ${developer.trim()}`);
    push('Developer assigned', 'success');
    setDeveloper('');
    load();
    setSelected(null);
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const pendingOrders = orders.filter((o) => o.status === 'Request Submitted');

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Review, accept, reject, and track all student orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
            <option value="">All statuses</option>
            {PROJECT_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShoppingBag size={18} className="shrink-0 text-amber-600" />
          <span><strong>{pendingOrders.length}</strong> pending order{pendingOrders.length !== 1 ? 's' : ''} awaiting review.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filtered.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders found" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Student</TH>
                  <TH>Amount</TH>
                  <TH>Order Date</TH>
                  <TH>Status</TH>
                  <TH>Developer</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-medium text-slate-700">{o.project?.title || 'Custom Project'}</TD>
                    <TD>{o.student?.full_name || '—'}</TD>
                    <TD>{formatCurrency(o.amount)}</TD>
                    <TD className="text-slate-500">{formatDate(o.order_date)}</TD>
                    <TD>
                      <Badge tone={stageIndex(o.status) >= stageIndex('Delivered') ? 'green' : 'blue'}>{o.status}</Badge>
                    </TD>
                    <TD className="text-slate-500">{o.assigned_developer || '—'}</TD>
                    <TD>
                      <button onClick={() => { setSelected(o); setDeveloper(o.assigned_developer || ''); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600">
                        <Eye size={16} />
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{selected.project?.title || 'Custom Project'}</h3>
              <p className="mt-1 text-sm text-slate-500">{selected.student?.full_name} • {selected.student?.college}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <div><p className="text-slate-400">Amount</p><p className="font-semibold text-slate-700">{formatCurrency(selected.amount)}</p></div>
              <div><p className="text-slate-400">Order date</p><p className="font-semibold text-slate-700">{formatDate(selected.order_date)}</p></div>
              <div><p className="text-slate-400">Deadline</p><p className="font-semibold text-slate-700">{formatDate(selected.deadline)}</p></div>
              <div><p className="text-slate-400">Category</p><p className="font-semibold text-slate-700">{selected.project?.category || '—'}</p></div>
            </div>
            {selected.requirements && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Student requirements</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{selected.requirements}</p>
              </div>
            )}

            {selected.status === 'Request Submitted' && (
              <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="flex-1 text-sm text-slate-600">This order is awaiting your review.</p>
                <Button size="sm" variant="success" onClick={() => acceptOrder(selected.id)}>
                  <Check size={14} /> Accept Order
                </Button>
                <Button size="sm" variant="danger" onClick={() => rejectOrder(selected.id)}>
                  <X size={14} /> Reject
                </Button>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Assign developer</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UserCog size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Developer name"
                    className="pl-9"
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                  />
                </div>
                <Button onClick={assignDeveloper} disabled={!developer.trim()}>
                  <Save size={14} /> Assign
                </Button>
              </div>
              {selected.assigned_developer && (
                <p className="mt-1.5 text-xs text-slate-400">Currently assigned: <strong>{selected.assigned_developer}</strong></p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Update status</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_STAGES.map((s) => {
                  const active = selected.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Progress</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                  style={{ width: `${(stageIndex(selected.status) / (PROJECT_STAGES.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
