import { useEffect, useState } from 'react';
import { CreditCard, Eye, Check, X, Filter, RotateCcw, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDateTime, paymentStatusTone, logActivity, downloadPaymentReceipt } from '../../lib/helpers';
import type { Payment, Order } from '../../types';

export function AdminPayments() {
  const { push } = useToast();
  const [payments, setPayments] = useState<(Payment & { order?: Order })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<(Payment & { order?: Order }) | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, order:orders(*, project:projects(*), student:profiles(*))')
      .order('created_at', { ascending: false });
    setPayments((data as (Payment & { order?: Order })[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (id: string, status: 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('payments')
      .update({ status, verified_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      push(error.message, 'error');
      return;
    }
    const payment = payments.find((p) => p.id === id);
    if (payment?.order) {
      await supabase.from('notifications').insert({
        user_id: payment.order.student_id,
        message: `Your payment of ${formatCurrency(payment.amount)} has been ${status.toLowerCase()}.`,
        type: 'payment',
      });
      if (status === 'Approved') {
        await supabase.from('orders').update({ status: 'Payment Verified' }).eq('id', payment.order.id);
      }
    }
    await logActivity(status === 'Approved' ? 'approve_payment' : 'reject_payment', 'payment', id, `Amount: ${formatCurrency(payment?.amount || 0)}`);
    push(`Payment ${status.toLowerCase()}`, 'success');
    load();
  };

  const processRefund = async () => {
    if (!refundTarget || !refundReason.trim()) {
      push('Please provide a refund reason', 'error');
      return;
    }
    const { error } = await supabase
      .from('payments')
      .update({
        refund_status: 'Refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', refundTarget.id);
    if (error) {
      push(error.message, 'error');
      return;
    }
    if (refundTarget.order) {
      await supabase.from('notifications').insert({
        user_id: refundTarget.order.student_id,
        message: `A refund of ${formatCurrency(refundTarget.amount)} has been processed for your payment. Reason: ${refundReason}`,
        type: 'payment',
      });
    }
    await logActivity('process_refund', 'payment', refundTarget.id, `Reason: ${refundReason}`);
    push('Refund processed successfully', 'success');
    setRefundTarget(null);
    setRefundReason('');
    load();
  };

  const filtered = filter ? payments.filter((p) => p.status === filter) : payments;
  const totalApproved = payments.filter((p) => p.status === 'Approved').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'Verification Pending').length;
  const totalRefunds = payments.filter((p) => p.refund_status === 'Refunded').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Verify student payments, manage refunds, and generate receipts.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardBody><p className="text-sm text-slate-500">Total Approved Revenue</p><p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalApproved)}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Verification Pending</p><p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Total Payments</p><p className="mt-1 text-2xl font-bold text-slate-800">{payments.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Total Refunded</p><p className="mt-1 text-2xl font-bold text-rose-600">{formatCurrency(totalRefunds)}</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Payments ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verification Pending">Verification Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payments found" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Student</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH>Refund</TH>
                  <TH>Date</TH>
                  <TH>Screenshot</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium text-slate-700">{p.order?.project?.title || '—'}</TD>
                    <TD>{p.order?.student?.full_name || '—'}</TD>
                    <TD className="font-semibold text-slate-700">{formatCurrency(p.amount)}</TD>
                    <TD><Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge></TD>
                    <TD>
                      {p.refund_status === 'Refunded' ? (
                        <Badge tone="red">Refunded</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TD>
                    <TD className="text-slate-500">{formatDateTime(p.created_at)}</TD>
                    <TD>
                      {p.screenshot_url ? (
                        <button onClick={() => setViewUrl(p.screenshot_url)} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <Eye size={14} /> View
                        </button>
                      ) : <span className="text-slate-400">—</span>}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        {p.status === 'Verification Pending' && (
                          <>
                            <button onClick={() => verify(p.id, 'Approved')} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="Approve">
                              <Check size={16} />
                            </button>
                            <button onClick={() => verify(p.id, 'Rejected')} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Reject">
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {p.status === 'Approved' && p.refund_status !== 'Refunded' && (
                          <button onClick={() => setRefundTarget(p)} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50" title="Process refund">
                            <RotateCcw size={16} />
                          </button>
                        )}
                        {p.status === 'Approved' && (
                          <button onClick={() => downloadPaymentReceipt(p)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="Download receipt">
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={!!viewUrl} onClose={() => setViewUrl(null)} title="Payment Screenshot" size="md">
        {viewUrl && <img src={viewUrl} alt="Payment proof" className="w-full rounded-lg" />}
      </Modal>

      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Process Refund" size="md">
        {refundTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Payment amount</span><span className="font-semibold text-slate-700">{formatCurrency(refundTarget.amount)}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-slate-500">Student</span><span className="font-semibold text-slate-700">{refundTarget.order?.student?.full_name || '—'}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-slate-500">Project</span><span className="font-semibold text-slate-700">{refundTarget.order?.project?.title || '—'}</span></div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Refund reason</label>
              <textarea
                rows={3}
                required
                placeholder="Enter the reason for this refund…"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={processRefund}>
                <RotateCcw size={14} /> Process Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
