import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/Toast';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Label } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function AdminLogin() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      push(error.message, 'error');
      return;
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setLoading(false);
        push('This account does not have admin access.', 'error');
        return;
      }
      push('Welcome, Admin!', 'success');
      navigate('/admin');
    }
  };

  return (
    <AuthLayout title="Admin sign in" subtitle="Authorized personnel only" icon="admin" side="admin">
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
        <ShieldCheck size={20} className="text-violet-600" />
        <span>Secure area. Access is restricted to administrators.</span>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="adminEmail">Admin email</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input id="adminEmail" type="email" required placeholder="admin@eduprojecthub.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="adminPassword">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input id="adminPassword" type={show ? 'text' : 'password'} required placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg" variant="secondary">
          Sign in to admin panel
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Not an admin?{' '}
        <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-700">
          Student sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
