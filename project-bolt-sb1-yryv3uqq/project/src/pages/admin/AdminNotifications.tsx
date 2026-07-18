import { FormEvent, useEffect, useState } from 'react';
import { Bell, Send, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label, Textarea, Select } from '../../components/ui/Input';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { timeAgo } from '../../lib/helpers';
import type { Notification, Profile } from '../../types';

export function AdminNotifications() {
  const { push } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ user_id: '', message: '', type: 'general' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [{ data: notifData }, { data: studentData }] = await Promise.all([
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name', { ascending: true }),
    ]);
    setNotifications((notifData as Notification[]) || []);
    setStudents((studentData as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.user_id || !form.message.trim()) {
      push('Select a student and enter a message', 'error');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('notifications').insert({
      user_id: form.user_id,
      message: form.message,
      type: form.type,
    });
    setSending(false);
    if (error) { push(error.message, 'error'); return; }
    setForm({ user_id: '', message: '', type: 'general' });
    push('Notification sent', 'success');
    load();
  };

  const filtered = notifications.filter((n) => !search || n.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">Send notifications to students and view all sent notifications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={send} className="space-y-4">
              <div>
                <Label htmlFor="student">Send to</Label>
                <Select id="student" value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="general">General</option>
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="file">File Upload</option>
                  <option value="message">Message</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={4} required placeholder="Type your notification message…" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
              </div>
              <Button type="submit" loading={sending} className="w-full"><Send size={14} /> Send Notification</Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Sent Notifications ({filtered.length})</CardTitle>
            <div className="relative sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search messages…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-slate-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications sent" />
            ) : (
              <Table>
                <THead>
                  <TR><TH>Message</TH><TH>Type</TH><TH>Sent</TH></TR>
                </THead>
                <TBody>
                  {filtered.map((n) => (
                    <TR key={n.id}>
                      <TD className="text-slate-700">{n.message}</TD>
                      <TD><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{n.type}</span></TD>
                      <TD className="text-slate-500">{timeAgo(n.created_at)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
