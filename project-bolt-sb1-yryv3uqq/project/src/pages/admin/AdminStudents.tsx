import { useEffect, useState } from 'react';
import { Users, Search, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { formatDate } from '../../lib/helpers';
import type { Profile } from '../../types';

export function AdminStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [orderCount, setOrderCount] = useState<Record<string, number>>({});

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents((data as Profile[]) || []);
    setLoading(false);

    // count orders per student
    const counts: Record<string, number> = {};
    const { data: orders } = await supabase.from('orders').select('student_id');
    (orders || []).forEach((o: any) => {
      counts[o.student_id] = (counts[o.student_id] || 0) + 1;
    });
    setOrderCount(counts);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = students.filter(
    (s) =>
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.college?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Students</h1>
        <p className="mt-1 text-sm text-slate-500">Manage student accounts registered on the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Students ({filtered.length})</CardTitle>
          <div className="relative sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search by name, college, department…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No students found" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Department</TH>
                  <TH>College</TH>
                  <TH>Year</TH>
                  <TH>Orders</TH>
                  <TH>Joined</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-full w-full object-cover" /> : s.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.phone || '—'}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>{s.department || '—'}</TD>
                    <TD>{s.college || '—'}</TD>
                    <TD><Badge tone="slate">{s.year || '—'}</Badge></TD>
                    <TD className="font-semibold text-slate-700">{orderCount[s.id] || 0}</TD>
                    <TD className="text-slate-500">{formatDate(s.created_at)}</TD>
                    <TD>
                      <button onClick={() => setSelected(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Student Details" size="md">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                {selected.avatar_url ? <img src={selected.avatar_url} alt="" className="h-full w-full object-cover" /> : selected.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">{selected.full_name}</p>
                <p className="text-slate-500">{selected.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4">
              <div><p className="text-slate-400">Department</p><p className="font-medium text-slate-700">{selected.department || '—'}</p></div>
              <div><p className="text-slate-400">College</p><p className="font-medium text-slate-700">{selected.college || '—'}</p></div>
              <div><p className="text-slate-400">Year</p><p className="font-medium text-slate-700">{selected.year || '—'}</p></div>
              <div><p className="text-slate-400">Joined</p><p className="font-medium text-slate-700">{formatDate(selected.created_at)}</p></div>
            </div>
            {selected.resume_url && (
              <a href={selected.resume_url} target="_blank" rel="noreferrer" className="block rounded-lg bg-violet-50 px-4 py-2.5 text-center text-sm font-medium text-violet-700 hover:bg-violet-100">
                View Resume
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
