import { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Users, ShoppingBag, IndianRupee, FolderKanban } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../lib/helpers';
import type { Profile, Project, Order, Payment } from '../../types';

export function AdminReports() {
  const { push } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: s }, { data: p }, { data: o }, { data: pay }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('projects').select('*'),
        supabase.from('orders').select('*, project:projects(*), student:profiles(*)'),
        supabase.from('payments').select('*, order:orders(*, project:projects(*), student:profiles(*))'),
      ]);
      setStudents((s as Profile[]) || []);
      setProjects((p as Project[]) || []);
      setOrders((o as Order[]) || []);
      setPayments((pay as Payment[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const revenue = payments.filter((p) => p.status === 'Approved').reduce((s, p) => s + p.amount, 0);

  const downloadCSV = (filename: string, rows: Record<string, any>[]) => {
    if (rows.length === 0) { push('No data to export', 'error'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Excel/CSV exported', 'success');
  };

  const downloadHTMLReport = (title: string, content: string) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Inter,sans-serif;padding:40px;color:#1e293b}h1{color:#1e40af;border-bottom:2px solid #ddd;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:13px}th{background:#f1f5f9}</style></head>
    <body><h1>${title}</h1><p>Generated: ${new Date().toLocaleString('en-IN')}</p>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    push('PDF report exported', 'success');
  };

  const studentReport = () => {
    const orderCount: Record<string, number> = {};
    orders.forEach((o) => { orderCount[o.student_id] = (orderCount[o.student_id] || 0) + 1; });
    const rows = students.map((s) => ({
      Name: s.full_name,
      Department: s.department,
      College: s.college,
      Year: s.year,
      Phone: s.phone,
      'Total Orders': orderCount[s.id] || 0,
      Joined: formatDate(s.created_at),
    }));
    downloadCSV('student_report', rows);
  };

  const projectReport = () => {
    const orderCount: Record<string, number> = {};
    orders.forEach((o) => { if (o.project_id) orderCount[o.project_id] = (orderCount[o.project_id] || 0) + 1; });
    const rows = projects.map((p) => ({
      Title: p.title,
      Category: p.category,
      Technology: p.technology,
      Price: p.price,
      Duration: `${p.duration_weeks} weeks`,
      Difficulty: p.difficulty,
      'Total Orders': orderCount[p.id] || 0,
      Active: p.is_active ? 'Yes' : 'No',
    }));
    downloadCSV('project_report', rows);
  };

  const paymentReport = () => {
    const rows = payments.map((p) => ({
      'Payment ID': p.id.slice(0, 8),
      Project: (p as any).order?.project?.title || '',
      Student: (p as any).order?.student?.full_name || '',
      Amount: p.amount,
      Status: p.status,
      Date: formatDate(p.created_at),
    }));
    downloadCSV('payment_report', rows);
  };

  const revenueReport = () => {
    const monthly: Record<string, number> = {};
    payments.filter((p) => p.status === 'Approved').forEach((p) => {
      const m = new Date(p.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      monthly[m] = (monthly[m] || 0) + p.amount;
    });
    const rows = Object.entries(monthly).map(([Month, Revenue]) => ({ Month, Revenue }));
    downloadCSV('revenue_report', rows);
  };

  const fullPDFReport = () => {
    const studentTable = `<h2>Students (${students.length})</h2><table><tr><th>Name</th><th>College</th><th>Orders</th></tr>${students.map((s) => `<tr><td>${s.full_name}</td><td>${s.college || '—'}</td><td>${orders.filter((o) => o.student_id === s.id).length}</td></tr>`).join('')}</table>`;
    const orderTable = `<h2>Orders (${orders.length})</h2><table><tr><th>Project</th><th>Student</th><th>Amount</th><th>Status</th></tr>${orders.map((o) => `<tr><td>${o.project?.title || 'Custom'}</td><td>${o.student?.full_name || '—'}</td><td>${formatCurrency(o.amount)}</td><td>${o.status}</td></tr>`).join('')}</table>`;
    const paymentTable = `<h2>Payments (${payments.length})</h2><table><tr><th>Project</th><th>Amount</th><th>Status</th></tr>${payments.map((p) => `<tr><td>${(p as any).order?.project?.title || '—'}</td><td>${formatCurrency(p.amount)}</td><td>${p.status}</td></tr>`).join('')}</table>`;
    downloadHTMLReport('EduProject Hub Full Report', `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0"><div style="background:#eff6ff;padding:16px;border-radius:8px"><strong style="font-size:24px">${students.length}</strong><br>Students</div><div style="background:#f5f3ff;padding:16px;border-radius:8px"><strong style="font-size:24px">${orders.length}</strong><br>Orders</div><div style="background:#ecfdf5;padding:16px;border-radius:8px"><strong style="font-size:24px">${formatCurrency(revenue)}</strong><br>Revenue</div></div>${studentTable}${orderTable}${paymentTable}`);
  };

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading reports…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Generate and export platform reports.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardBody><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2.5 text-blue-600"><Users size={20} /></div><div><p className="text-sm text-slate-500">Students</p><p className="text-xl font-bold text-slate-800">{students.length}</p></div></div></CardBody></Card>
        <Card><CardBody><div className="flex items-center gap-3"><div className="rounded-lg bg-violet-50 p-2.5 text-violet-600"><FolderKanban size={20} /></div><div><p className="text-sm text-slate-500">Projects</p><p className="text-xl font-bold text-slate-800">{projects.length}</p></div></div></CardBody></Card>
        <Card><CardBody><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-2.5 text-amber-600"><ShoppingBag size={20} /></div><div><p className="text-sm text-slate-500">Orders</p><p className="text-xl font-bold text-slate-800">{orders.length}</p></div></div></CardBody></Card>
        <Card><CardBody><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600"><IndianRupee size={20} /></div><div><p className="text-sm text-slate-500">Revenue</p><p className="text-xl font-bold text-slate-800">{formatCurrency(revenue)}</p></div></div></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Student Report', desc: 'Export student details and order counts', icon: Users, onExcel: studentReport, onPDF: () => downloadHTMLReport('Student Report', `<h2>Students (${students.length})</h2><table><tr><th>Name</th><th>College</th><th>Department</th><th>Year</th></tr>${students.map((s) => `<tr><td>${s.full_name}</td><td>${s.college || '—'}</td><td>${s.department || '—'}</td><td>${s.year || '—'}</td></tr>`).join('')}</table>`) },
          { title: 'Project Report', desc: 'Export project catalog and order counts', icon: FolderKanban, onExcel: projectReport, onPDF: () => downloadHTMLReport('Project Report', `<h2>Projects (${projects.length})</h2><table><tr><th>Title</th><th>Category</th><th>Price</th><th>Difficulty</th></tr>${projects.map((p) => `<tr><td>${p.title}</td><td>${p.category}</td><td>${formatCurrency(p.price)}</td><td>${p.difficulty}</td></tr>`).join('')}</table>`) },
          { title: 'Payment Report', desc: 'Export all payment records', icon: IndianRupee, onExcel: paymentReport, onPDF: () => downloadHTMLReport('Payment Report', `<h2>Payments (${payments.length})</h2><table><tr><th>Project</th><th>Student</th><th>Amount</th><th>Status</th></tr>${payments.map((p) => `<tr><td>${(p as any).order?.project?.title || '—'}</td><td>${(p as any).order?.student?.full_name || '—'}</td><td>${formatCurrency(p.amount)}</td><td>${p.status}</td></tr>`).join('')}</table>`) },
          { title: 'Revenue Report', desc: 'Monthly revenue statistics', icon: BarChart3, onExcel: revenueReport, onPDF: () => downloadHTMLReport('Revenue Report', `<h2>Revenue: ${formatCurrency(revenue)}</h2><table><tr><th>Month</th><th>Revenue</th></tr>${Object.entries(payments.filter((p) => p.status === 'Approved').reduce((acc: Record<string, number>, p) => { const m = new Date(p.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); acc[m] = (acc[m] || 0) + p.amount; return acc; }, {})).map(([m, r]) => `<tr><td>${m}</td><td>${formatCurrency(r)}</td></tr>`).join('')}</table>`) },
        ].map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title}>
              <CardBody>
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600"><Icon size={20} /></div>
                  <div>
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={r.onExcel}><FileSpreadsheet size={14} /> Excel</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={r.onPDF}><FileText size={14} /> PDF</Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardBody className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3"><BarChart3 size={24} /></div>
            <div>
              <h3 className="text-lg font-bold">Full Platform Report</h3>
              <p className="text-sm text-slate-300">Complete report with students, orders, payments, and revenue summary.</p>
            </div>
          </div>
          <Button onClick={fullPDFReport} className="bg-white text-slate-800 hover:bg-slate-100"><Download size={14} /> Generate PDF</Button>
        </CardBody>
      </Card>
    </div>
  );
}
