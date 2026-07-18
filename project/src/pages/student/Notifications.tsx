import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Table';
import { timeAgo } from '../../lib/helpers';
import type { Notification } from '../../types';

export function StudentNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    load();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    load();
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">{unread} unread notification{unread !== 1 ? 's' : ''}.</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${!n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell size={14} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!n.is_read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-slate-400 hover:text-blue-600" title="Mark as read">
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
