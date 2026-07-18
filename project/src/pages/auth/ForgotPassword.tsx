import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/Toast';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Label } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ForgotPassword() {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      push(error.message, 'error');
      return;
    }
    setSent(true);
    push('Reset link sent to your email', 'success');
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link" side="student">
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          A password reset link has been sent to <strong>{email}</strong>. Check your inbox and follow the instructions.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="email" type="email" required placeholder="you@college.edu" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/signin" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
    </AuthLayout>
  );
}
