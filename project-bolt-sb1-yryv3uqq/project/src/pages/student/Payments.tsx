import { useEffect, useState } from 'react';
import { CreditCard, QrCode as QrCodeIcon, Upload, IndianRupee, CheckCircle2, Clock, XCircle, Eye, Download, Smartphone, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime, paymentStatusTone, uploadFile, validateImageFile, downloadPaymentReceipt, logActivity, generateUpiQrCodeDataUrl, buildUpiDeepLink } from '../../lib/helpers';
import type { Order, QrCode, Payment } from '../../types';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Pay using any UPI app' },
  { id: 'gpay', label: 'Google Pay', icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Pay with Google Pay' },
  { id: 'phonepe', label: 'PhonePe', icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Pay with PhonePe' },
  { id: 'paytm', label: 'Paytm', icon: CreditCard, color: 'text-sky-600', bg: 'bg-sky-50', desc: 'Pay with Paytm wallet' },
  { id: 'razorpay', label: 'Razorpay', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Pay via Razorpay gateway' },
];

export function StudentPayments() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const load = async () => {
    if (!profile) return;
    const [{ data: orderData }, { data: qrData }] = await Promise.all([
      supabase
        .from('orders')
        .select('*, project:projects(*), payments(*)')
        .eq('student_id', profile.id)
        .order('order_date', { ascending: false }),
      supabase.from('qr_codes').select('*').eq('is_active', true),
    ]);
    setOrders((orderData as Order[]) || []);
    setQrCodes((qrData as QrCode[]) || []);
  };

  useEffect(() => {
    load();
  }, [profile]);

  const openPay = (order: Order) => {
    setPayOrder(order);
    setScreenshot(null);
    setSelectedMethod('upi');
    setQrDataUrl(null);
    generateQr(order);
  };

  const generateQr = async (order: Order) => {
    const upiId = qrCodes[0]?.upi_id;
    if (!upiId) return;
    setQrLoading(true);
    try {
      const dataUrl = await generateUpiQrCodeDataUrl(upiId, order.amount, qrCodes[0]?.label || 'EduProject Hub', order.id.slice(0, 12));
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!payOrder || !screenshot) {
      push('Please upload a payment screenshot', 'error');
      return;
    }
    const validationError = validateImageFile(screenshot);
    if (validationError) {
      push(validationError, 'error');
      return;
    }
    setSubmitting(true);
    const uploaded = await uploadFile('payment-screenshots', screenshot, `payments/${payOrder.id}`);
    if (!uploaded) {
      setSubmitting(false);
      push('Failed to upload screenshot', 'error');
      return;
    }
    const { error } = await supabase.from('payments').insert({
      order_id: payOrder.id,
      amount: payOrder.amount,
      screenshot_url: uploaded.url,
      status: 'Verification Pending',
    });
    if (error) {
      setSubmitting(false);
      push(error.message, 'error');
      return;
    }
    await supabase.from('notifications').insert({
      user_id: profile?.id,
      message: `Payment of ${formatCurrency(payOrder.amount)} submitted for "${payOrder.project?.title || 'project'}". Awaiting verification.`,
      type: 'payment',
    });
    await logActivity('submit_payment', 'payment', payOrder.id, `Amount: ${formatCurrency(payOrder.amount)} via ${PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}`);
    setSubmitting(false);
    setPayOrder(null);
    push('Payment submitted for verification', 'success');
    load();
  };

  const allPayments = orders.flatMap((o) => (o.payments || []).map((p) => ({ ...p, order: o })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Pay via UPI, Google Pay, PhonePe, Paytm, or Razorpay and track your payment status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Paid', value: allPayments.filter((p) => p.status === 'Approved').reduce((s, p) => s + p.amount, 0), icon: IndianRupee, tone: 'green' as const },
          { label: 'Verification Pending', value: allPayments.filter((p) => p.status === 'Verification Pending').length, icon: Clock, tone: 'amber' as const },
          { label: 'Approved', value: allPayments.filter((p) => p.status === 'Approved').length, icon: CheckCircle2, tone: 'green' as const },
          { label: 'Rejected', value: allPayments.filter((p) => p.status === 'Rejected').length, icon: XCircle, tone: 'red' as const },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {typeof s.value === 'number' && s.label !== 'Total Paid' ? s.value : formatCurrency(s.value as number)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {allPayments.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payments yet" message="Submit a payment from an unpaid order." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH>Date</TH>
                  <TH>Screenshot</TH>
                  <TH>Receipt</TH>
                </TR>
              </THead>
              <TBody>
                {allPayments.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium text-slate-700">{p.order?.project?.title || 'Custom Project'}</TD>
                    <TD>{formatCurrency(p.amount)}</TD>
                    <TD>
                      <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>
                    </TD>
                    <TD className="text-slate-500">{formatDateTime(p.created_at)}</TD>
                    <TD>
                      {p.screenshot_url ? (
                        <button onClick={() => setViewUrl(p.screenshot_url)} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <Eye size={14} /> View
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TD>
                    <TD>
                      {p.status === 'Approved' ? (
                        <button onClick={() => downloadPaymentReceipt(p as Payment)} className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                          <Download size={14} /> Download
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Orders — Pay Now</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {orders.filter((o) => !o.payments?.some((p) => p.status === 'Approved')).length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All orders are paid" />
          ) : (
            <div className="divide-y divide-slate-100">
              {orders
                .filter((o) => !o.payments?.some((p) => p.status === 'Approved'))
                .map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{order.project?.title || 'Custom Project'}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(order.amount)} • Ordered {formatDate(order.order_date)}</p>
                    </div>
                    <Button size="sm" onClick={() => openPay(order)}>
                      <CreditCard size={14} /> Pay Now
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment modal */}
      <Modal open={!!payOrder} onClose={() => setPayOrder(null)} title="Complete Payment" size="lg">
        {payOrder && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Project</span>
                <span className="font-semibold text-slate-700">{payOrder.project?.title || 'Custom Project'}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Amount to pay</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(payOrder.amount)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-sm font-medium text-slate-600">1. Choose payment method</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const active = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                        active
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon size={22} className={active ? 'text-blue-600' : method.color} />
                      <span className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-slate-600'}`}>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <QrCodeIcon size={16} /> Scan to Pay
                </p>
                {qrLoading ? (
                  <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-white text-slate-300">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                  </div>
                ) : qrDataUrl ? (
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <img src={qrDataUrl} alt="UPI QR" className="h-44 w-44" />
                  </div>
                ) : qrCodes[0]?.image_url ? (
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <img src={qrCodes[0].image_url} alt="UPI QR" className="h-44 w-44" />
                  </div>
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-white text-slate-300">
                    <QrCodeIcon size={48} />
                  </div>
                )}
                <p className="mt-3 text-sm font-medium text-slate-700">UPI ID: {qrCodes[0]?.upi_id || 'eduproject@upi'}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  Amount pre-filled: {formatCurrency(payOrder.amount)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.desc}
                </p>
                {qrCodes[0]?.upi_id && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <a
                      href={buildUpiDeepLink(qrCodes[0].upi_id, payOrder.amount, qrCodes[0]?.label || 'EduProject Hub', payOrder.id.slice(0, 12))}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Zap size={12} /> Open in UPI App
                    </a>
                    <a
                      href={`tez://upi/pay?pa=${qrCodes[0].upi_id}&pn=${encodeURIComponent(qrCodes[0]?.label || 'EduProject Hub')}&am=${payOrder.amount.toFixed(2)}&cu=INR&tn=Project%20Payment&tr=${payOrder.id.slice(0, 12)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <Smartphone size={12} /> GPay
                    </a>
                    <a
                      href={`phonepe://pay?pa=${qrCodes[0].upi_id}&pn=${encodeURIComponent(qrCodes[0]?.label || 'EduProject Hub')}&am=${payOrder.amount.toFixed(2)}&cu=INR&tn=Project%20Payment&tr=${payOrder.id.slice(0, 12)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <Wallet size={12} /> PhonePe
                    </a>
                    <a
                      href={`paytmmp://pay?pa=${qrCodes[0].upi_id}&pn=${encodeURIComponent(qrCodes[0]?.label || 'EduProject Hub')}&am=${payOrder.amount.toFixed(2)}&cu=INR&tn=Project%20Payment&tr=${payOrder.id.slice(0, 12)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <CreditCard size={12} /> Paytm
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600">2. Upload payment screenshot</p>
                <p className="text-xs text-slate-400">After paying, upload a screenshot of the successful transaction for verification.</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                  <Upload size={24} className="text-slate-400" />
                  <span className="mt-2 text-sm text-slate-600">
                    {screenshot ? screenshot.name : 'Click to upload screenshot'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                </label>
                {screenshot && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <span className="truncate">{screenshot.name}</span>
                    <button onClick={() => setScreenshot(null)} className="text-emerald-600 hover:text-emerald-800">
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayOrder(null)}>Cancel</Button>
              <Button onClick={submitPayment} loading={submitting} disabled={!screenshot}>
                Submit for Verification
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!viewUrl} onClose={() => setViewUrl(null)} title="Payment Screenshot" size="md">
        {viewUrl && <img src={viewUrl} alt="Payment proof" className="w-full rounded-lg" />}
      </Modal>
    </div>
  );
}
