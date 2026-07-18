import { useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea, Label } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatDate, ticketStatusTone } from '../../lib/helpers';
import type { Ticket, TicketStatus } from '../../types';

const statuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

export function AdminTickets() {
  const { push } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*, student:profiles(*)')
      .order('created_at', { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: TicketStatus) => {
    const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
    if (error) push(error.message, 'error');
    else { push('Ticket status updated', 'success'); load(); }
  };

  const sendReply = async (t: Ticket) => {
    const msg = reply[t.id]?.trim();
    if (!msg) { push('Reply cannot be empty', 'error'); return; }
    const { error } = await supabase.from('tickets').update({ admin_reply: msg, status: 'In Progress' }).eq('id', t.id);
    if (error) { push(error.message, 'error'); return; }
    await supabase.from('notifications').insert({
      user_id: t.student_id,
      message: `Admin replied to your support ticket "${t.subject}".`,
      type: 'message',
    });
    setReply((r) => ({ ...r, [t.id]: '' }));
    push('Reply sent', 'success');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
        <p className="mt-1 text-sm text-slate-500">Respond to student queries and manage ticket status.</p>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-400">Loading…</div>
      ) : tickets.length === 0 ? (
        <Card><CardBody className="py-16"><EmptyState icon={LifeBuoy} title="No tickets" message="Student support tickets will appear here." /></CardBody></Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.subject}</CardTitle>
                  <p className="mt-0.5 text-xs text-slate-400">{t.student?.full_name} • {formatDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={ticketStatusTone(t.status)}>{t.status}</Badge>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t.message}</div>
                {t.admin_reply && (
                  <div className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
                    <p className="mb-1 text-xs font-semibold text-violet-700">Admin reply</p>
                    {t.admin_reply}
                  </div>
                )}
                <div>
                  <Label htmlFor={`reply-${t.id}`}>Reply</Label>
                  <Textarea
                    id={`reply-${t.id}`}
                    rows={2}
                    placeholder="Type your reply…"
                    value={reply[t.id] || ''}
                    onChange={(e) => setReply((r) => ({ ...r, [t.id]: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => sendReply(t)}><Send size={14} /> Send Reply</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
