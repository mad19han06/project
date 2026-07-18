import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/Toast';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Label } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SignIn() {
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
    setLoading(false);
    if (error) {
      push(error.message, 'error');
      return;
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      push('Welcome back!', 'success');
      if (profile?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="Sign in to your account" subtitle="Continue your project journey" side="student">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@college.edu"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9 pr-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-slate-500">
        Admin?{' '}
        <Link to="/admin/login" className="font-semibold text-violet-600 hover:text-violet-700">
          Admin login
        </Link>
      </p>
    </AuthLayout>
  );
}
