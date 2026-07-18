import { useEffect, useState } from 'react';
import { Package, Download, FileCode, FileText, Presentation, Database, File as FileIcon, Calendar, Link2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Table';
import { formatDate } from '../../lib/helpers';
import type { Order, FileType } from '../../types';

const fileIcon: Record<FileType, typeof FileCode> = {
  'Source Code': FileCode,
  Documentation: FileText,
  Presentation: Presentation,
  Report: FileText,
  Database: Database,
  Other: FileIcon,
};

export function StudentDeliverables() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('orders')
      .select('*, project:projects(*), deliverable_files(*)')
      .eq('student_id', profile.id)
      .order('order_date', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || []);
        setLoading(false);
      });
  }, [profile]);

  const ordersWithFiles = orders.filter((o) => (o.deliverable_files || []).length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Deliverables</h1>
        <p className="mt-1 text-sm text-slate-500">Download source code, documentation, and other project files.</p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : ordersWithFiles.length === 0 ? (
        <Card>
          <CardBody className="py-16">
            <EmptyState icon={Package} title="No deliverables yet" message="Files uploaded by the admin will appear here once your project is ready." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-5">
          {ordersWithFiles.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{order.project?.title || 'Custom Project'}</CardTitle>
                  <Badge tone="green">Delivered</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-slate-100">
                  {order.deliverable_files?.map((file) => {
                    const Icon = fileIcon[file.file_type] || FileIcon;
                    const isLink = /^https?:\/\//i.test(file.file_url) && !file.file_url.includes('supabase.co');
                    return (
                      <div key={file.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${isLink ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isLink ? <Link2 size={18} /> : <Icon size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{file.file_name}</p>
                            <p className="text-xs text-slate-400">
                              {file.file_type} • {isLink ? 'Link' : 'File'} • <Calendar size={10} className="inline" /> {formatDate(file.created_at)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          {isLink ? <><ExternalLink size={14} /> Open Link</> : <><Download size={14} /> Download</>}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
