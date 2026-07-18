import { FormEvent, useEffect, useState } from 'react';
import { QrCode, Plus, Trash2, Pencil, Upload, X, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatDate, uploadFile, generateUpiQrCodeDataUrl, buildUpiDeepLink } from '../../lib/helpers';
import type { QrCode as QrCodeType } from '../../types';

export function AdminQrCodes() {
  const { push } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<QrCodeType | null>(null);
  const [form, setForm] = useState({ label: '', upi_id: '', image_url: '', is_active: true });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewQr, setPreviewQr] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState(5000);

  const load = async () => {
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false });
    setQrCodes((data as QrCodeType[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ label: '', upi_id: '', image_url: '', is_active: true });
    setFile(null);
    setPreviewQr(null);
    setEditOpen(true);
  };

  const openEdit = (q: QrCodeType) => {
    setEditing(q);
    setForm({ label: q.label, upi_id: q.upi_id, image_url: q.image_url, is_active: q.is_active });
    setFile(null);
    setPreviewQr(null);
    setEditOpen(true);
  };

  const generatePreview = async (upiId: string, amount: number, label: string) => {
    if (!upiId.trim()) {
      setPreviewQr(null);
      return;
    }
    try {
      const dataUrl = await generateUpiQrCodeDataUrl(upiId, amount, label || 'EduProject Hub');
      setPreviewQr(dataUrl);
    } catch {
      setPreviewQr(null);
    }
  };

  useEffect(() => {
    if (editOpen && form.upi_id.trim()) {
      generatePreview(form.upi_id, previewAmount, form.label);
    } else {
      setPreviewQr(null);
    }
  }, [form.upi_id, form.label, previewAmount, editOpen]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.upi_id.trim()) {
      push('Label and UPI ID are required', 'error');
      return;
    }
    setSaving(true);
    let imageUrl = form.image_url;
    if (file) {
      const uploaded = await uploadFile('qr-codes', file, 'upi');
      if (uploaded) imageUrl = uploaded.url;
    }
    const payload = { ...form, image_url: imageUrl };
    if (editing) {
      const { error } = await supabase.from('qr_codes').update(payload).eq('id', editing.id);
      if (error) { setSaving(false); push(error.message, 'error'); return; }
      push('QR code updated', 'success');
    } else {
      const { error } = await supabase.from('qr_codes').insert(payload);
      if (error) { setSaving(false); push(error.message, 'error'); return; }
      push('QR code added', 'success');
    }
    setSaving(false);
    setEditOpen(false);
    load();
  };

  const remove = async (q: QrCodeType) => {
    const { error } = await supabase.from('qr_codes').delete().eq('id', q.id);
    if (error) push(error.message, 'error');
    else { push('QR code deleted', 'success'); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">QR Codes</h1>
          <p className="mt-1 text-sm text-slate-500">Manage UPI payment QR codes shown to students.</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Add QR Code</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All QR Codes ({qrCodes.length})</CardTitle></CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : qrCodes.length === 0 ? (
            <EmptyState icon={QrCode} title="No QR codes" message="Add a UPI QR code for students to scan." />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {qrCodes.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {q.image_url ? <img src={q.image_url} alt="" className="h-full w-full object-cover" /> : <QrCode size={28} className="text-slate-300" />}
                    </div>
                    <Badge tone={q.is_active ? 'green' : 'slate'}>{q.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-slate-700">{q.label}</p>
                  <p className="text-sm text-slate-500">UPI: {q.upi_id}</p>
                  <p className="mt-1 text-xs text-slate-400">Added {formatDate(q.created_at)}</p>
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-700">
                    <Zap size={12} />
                    <span>Auto-generates QR with project amount</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(q)}><Pencil size={14} /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(q)} className="text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit QR Code' : 'Add QR Code'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <Zap size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <p>
              Students will see a <strong>dynamically generated QR code</strong> with the project amount pre-filled
              based on this UPI ID. When they scan it, their UPI app opens with the exact amount — no manual entry needed.
              The optional image below is a fallback if you prefer a custom QR.
            </p>
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" required placeholder="Primary UPI" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="upi">UPI ID</Label>
            <Input id="upi" required placeholder="yourname@upi" value={form.upi_id} onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))} />
          </div>

          {form.upi_id.trim() && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-medium text-slate-600">Live QR Preview (with sample amount)</p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
                {previewQr ? (
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <img src={previewQr} alt="QR Preview" className="h-36 w-36" />
                  </div>
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-lg bg-white text-slate-300">
                    <QrCode size={40} />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <Label htmlFor="preview-amt">Test Amount (INR)</Label>
                    <Input
                      id="preview-amt"
                      type="number"
                      min="1"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="rounded-lg bg-white p-2.5 text-xs text-slate-500">
                    <p className="font-mono break-all">{form.upi_id && buildUpiDeepLink(form.upi_id, previewAmount, form.label || 'EduProject Hub')}</p>
                  </div>
                  <p className="text-xs text-slate-400">This is what students see when paying — the QR auto-fills their project amount.</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Custom QR Image (optional fallback)</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-5 text-center transition-colors hover:border-violet-400 hover:bg-violet-50/50">
              {file || form.image_url ? (
                <img src={file ? URL.createObjectURL(file) : form.image_url} alt="" className="h-32 w-32 object-contain" />
              ) : (
                <>
                  <Upload size={22} className="text-slate-400" />
                  <span className="mt-2 text-sm text-slate-600">Click to upload custom QR (optional)</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <button type="button" onClick={() => setFile(null)} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600">
                <X size={12} /> Remove selected file
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
            Active (visible to students)
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save' : 'Add QR Code'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
