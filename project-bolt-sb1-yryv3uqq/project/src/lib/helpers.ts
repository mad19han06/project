import type { PaymentStatus, ProjectStatus, TicketStatus } from '../types';
import { PROJECT_STAGES } from '../types';
import { supabase } from './supabaseClient';
import QRCode from 'qrcode';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function stageIndex(status: ProjectStatus): number {
  return PROJECT_STAGES.indexOf(status);
}

export function paymentStatusTone(status: PaymentStatus): 'amber' | 'blue' | 'green' | 'red' {
  switch (status) {
    case 'Approved':
      return 'green';
    case 'Rejected':
      return 'red';
    case 'Verification Pending':
      return 'amber';
    default:
      return 'blue';
  }
}

export function ticketStatusTone(status: TicketStatus): 'green' | 'amber' | 'blue' | 'slate' {
  switch (status) {
    case 'Resolved':
      return 'green';
    case 'In Progress':
      return 'amber';
    case 'Open':
      return 'blue';
    default:
      return 'slate';
  }
}

export function difficultyTone(d: string): 'green' | 'amber' | 'red' {
  switch (d) {
    case 'Beginner':
      return 'green';
    case 'Intermediate':
      return 'amber';
    default:
      return 'red';
  }
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File size must be under 10 MB';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only PNG, JPEG, and WebP images are allowed';
  return null;
}

export function validateDocFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File size must be under 10 MB';
  if (!ALLOWED_DOC_TYPES.includes(file.type)) return 'Only PDF, DOC, and DOCX files are allowed';
  return null;
}

export async function uploadFile(
  bucket: string,
  file: File,
  pathPrefix: string,
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('Upload error', error);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { url: data.publicUrl, path: fileName };
}

export async function logActivity(
  action: string,
  entityType = '',
  entityId = '',
  details = '',
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

export function downloadPaymentReceipt(payment: {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  verified_at: string | null;
  order?: { project?: { title: string | null } | null } | null;
}): void {
  const date = new Date(payment.created_at).toLocaleString('en-IN');
  const verified = payment.verified_at
    ? new Date(payment.verified_at).toLocaleString('en-IN')
    : 'Not yet verified';
  const projectTitle = payment.order?.project?.title || 'Custom Project';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payment Receipt</title>
<style>
body{font-family:Inter,sans-serif;padding:40px;color:#1e293b;max-width:600px;margin:0 auto}
h1{color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:10px}
.receipt{border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-top:20px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}
.row:last-child{border-bottom:none}
.label{color:#64748b;font-size:14px}
.value{font-weight:600}
.badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534}
.footer{margin-top:24px;text-align:center;color:#94a3b8;font-size:12px}
</style></head><body>
<h1>Payment Receipt</h1>
<div class="receipt">
<div class="row"><span class="label">Receipt ID</span><span class="value">${payment.id.slice(0, 8).toUpperCase()}</span></div>
<div class="row"><span class="label">Project</span><span class="value">${projectTitle}</span></div>
<div class="row"><span class="label">Amount</span><span class="value">${formatCurrency(payment.amount)}</span></div>
<div class="row"><span class="label">Status</span><span class="badge">${payment.status}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
<div class="row"><span class="label">Verified At</span><span class="value">${verified}</span></div>
</div>
<p class="footer">This is a computer-generated receipt from EduProject Hub.</p>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt_${payment.id.slice(0, 8)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildUpiDeepLink(upiId: string, amount: number, label = 'EduProject Hub', txnRef?: string): string {
  const pa = upiId.trim();
  const pn = encodeURIComponent(label);
  const am = amount.toFixed(2);
  const tr = txnRef ? `&tr=${encodeURIComponent(txnRef)}` : '';
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=Project%20Payment${tr}`;
}

export async function generateUpiQrCodeDataUrl(upiId: string, amount: number, label = 'EduProject Hub', txnRef?: string): Promise<string> {
  const deepLink = buildUpiDeepLink(upiId, amount, label, txnRef);
  return QRCode.toDataURL(deepLink, {
    width: 256,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
