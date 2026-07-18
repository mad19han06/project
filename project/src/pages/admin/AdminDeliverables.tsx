import { useEffect, useState } from 'react';
import { Package, Upload, Trash2, FileCode, FileText, Presentation, Database, File as FileIcon, Eye, Link2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Label, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatDate, uploadFile } from '../../lib/helpers';
import type { Order, DeliverableFile, FileType } from '../../types';

const fileTypes: FileType[] = ['Source Code', 'Documentation', 'Presentation', 'Report', 'Database', 'Other'];
const fileIcon: Record<FileType, typeof FileCode> = {
  'Source Code': FileCode,
  Documentation: FileText,
  Presentation: Presentation,
  Report: FileText,
  Database: Database,
  Other: FileIcon,
};

export function AdminDeliverables() {
  const { push } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOrder, setUploadOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('Source Code');
  const [uploading, setUploading] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, project:projects(*), student:profiles(*), deliverable_files(*)')
      .order('order_date', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openUpload = (order: Order) => {
    setUploadOrder(order);
    setFile(null);
    setFileType('Source Code');
    setAddMode('file');
    setLinkUrl('');
    setLinkName('');
  };

  const addDeliverable = async () => {
    if (!uploadOrder) return;
    if (addMode === 'file') {
      if (!file) {
        push('Select a file to upload', 'error');
        return;
      }
      setUploading(true);
      const uploaded = await uploadFile('deliverables', file, `orders/${uploadOrder.id}`);
      if (!uploaded) {
        setUploading(false);
        push('Upload failed', 'error');
        return;
      }
      const { error } = await supabase.from('deliverable_files').insert({
        order_id: uploadOrder.id,
        file_name: file.name,
        file_url: uploaded.url,
        file_type: fileType,
      });
      if (error) {
        setUploading(false);
        push(error.message, 'error');
        return;
      }
      await supabase.from('notifications').insert({
        user_id: uploadOrder.student_id,
        message: `New file "${file.name}" uploaded for your project "${uploadOrder.project?.title || ''}".`,
        type: 'file',
      });
      setUploading(false);
      setUploadOrder(null);
      push('File uploaded', 'success');
      load();
    } else {
      const url = linkUrl.trim();
      const name = linkName.trim() || url;
      if (!url) {
        push('Enter a link URL', 'error');
        return;
      }
      let valid: URL;
      try {
        valid = new URL(url);
      } catch {
        push('Enter a valid URL (include https://)', 'error');
        return;
      }
      const { error } = await supabase.from('deliverable_files').insert({
        order_id: uploadOrder.id,
        file_name: name,
        file_url: valid.href,
        file_type: fileType,
      });
      if (error) {
        push(error.message, 'error');
        return;
      }
      await supabase.from('notifications').insert({
        user_id: uploadOrder.student_id,
        message: `New link "${name}" added for your project "${uploadOrder.project?.title || ''}".`,
        type: 'file',
      });
      setUploadOrder(null);
      push('Link added', 'success');
      load();
    }
  };

  const removeFile = async (f: DeliverableFile) => {
    const { error } = await supabase.from('deliverable_files').delete().eq('id', f.id);
    if (error) push(error.message, 'error');
    else {
      push('File removed', 'success');
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Deliverables</h1>
        <p className="mt-1 text-sm text-slate-500">Upload source code, documentation, and other project files for orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders & Files</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : orders.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" />
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-700">{order.project?.title || 'Custom Project'}</p>
                      <p className="text-xs text-slate-400">{order.student?.full_name} • Ordered {formatDate(order.order_date)}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openUpload(order)}>
                      <Upload size={14} /> Add File / Link
                    </Button>
                  </div>
                  {order.deliverable_files && order.deliverable_files.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      {order.deliverable_files.map((f) => {
                        const Icon = fileIcon[f.file_type] || FileIcon;
                        const isLink = /^https?:\/\//i.test(f.file_url) && !f.file_url.includes('supabase.co');
                        return (
                          <div key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2.5">
                              {isLink ? <Link2 size={16} className="text-blue-500" /> : <Icon size={16} className="text-slate-500" />}
                              <div>
                                <p className="text-sm font-medium text-slate-700">{f.file_name}</p>
                                <p className="text-xs text-slate-400">
                                  {f.file_type} • {isLink ? 'Link' : 'File'} • {formatDate(f.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a href={f.file_url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-blue-600">
                                {isLink ? <ExternalLink size={14} /> : <Eye size={14} />}
                              </a>
                              <button onClick={() => removeFile(f)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">No files uploaded yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={!!uploadOrder} onClose={() => setUploadOrder(null)} title="Add Deliverable" size="md">
        {uploadOrder && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Project: <span className="font-semibold text-slate-700">{uploadOrder.project?.title || 'Custom'}</span></p>
              <p className="mt-0.5 text-slate-500">Student: <span className="font-semibold text-slate-700">{uploadOrder.student?.full_name}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAddMode('file')}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  addMode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload size={15} /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setAddMode('link')}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  addMode === 'link' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Link2 size={15} /> Add Link
              </button>
            </div>

            <div>
              <Label htmlFor="ftype">Type</Label>
              <Select id="ftype" value={fileType} onChange={(e) => setFileType(e.target.value as FileType)}>
                {fileTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>

            {addMode === 'file' ? (
              <div>
                <Label>File</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition-colors hover:border-violet-400 hover:bg-violet-50/50">
                  <Upload size={24} className="text-slate-400" />
                  <span className="mt-2 text-sm text-slate-600">{file ? file.name : 'Click to select a file'}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="linkurl">Link URL</Label>
                  <Input
                    id="linkurl"
                    placeholder="https://github.com/username/project"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="linkname">Display name (optional)</Label>
                  <Input
                    id="linkname"
                    placeholder="GitHub Repository"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Add a link to a GitHub repo, Google Drive folder, live demo, or any external resource.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadOrder(null)}>Cancel</Button>
              <Button onClick={addDeliverable} loading={uploading} disabled={addMode === 'file' ? !file : !linkUrl.trim()}>
                {addMode === 'file' ? 'Upload' : 'Add Link'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
