import { FormEvent, useEffect, useState } from 'react';
import { LifeBuoy, Send, Plus } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Label, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatDate, ticketStatusTone } from '../../lib/helpers';
import type { Ticket } from '../../types';

export function StudentSupport() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      push('Subject and message are required', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('tickets').insert({
      student_id: profile?.id,
      subject: form.subject,
      message: form.message,
      status: 'Open',
    });
    setSubmitting(false);
    if (error) {
      push(error.message, 'error');
      return;
    }
    setForm({ subject: '', message: '' });
    setOpen(false);
    push('Support ticket created', 'success');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Support</h1>
          <p className="mt-1 text-sm text-slate-500">Raise a ticket or clarify project details with the admin team.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets yet" message="Need help? Raise a support ticket." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Subject</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH>Admin Reply</TH>
                </TR>
              </THead>
              <TBody>
                {tickets.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <p className="font-medium text-slate-700">{t.subject}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{t.message}</p>
                    </TD>
                    <TD>
                      <Badge tone={ticketStatusTone(t.status)}>{t.status}</Badge>
                    </TD>
                    <TD className="text-slate-500">{formatDate(t.created_at)}</TD>
                    <TD className="text-slate-500">
                      {t.admin_reply ? (
                        <span className="line-clamp-1 text-sm">{t.admin_reply}</span>
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

      <Modal open={open} onClose={() => setOpen(false)} title="New Support Ticket" size="md">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              required
              placeholder="Briefly describe your issue"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              required
              rows={5}
              placeholder="Describe your issue or question in detail…"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              <Send size={14} /> Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
