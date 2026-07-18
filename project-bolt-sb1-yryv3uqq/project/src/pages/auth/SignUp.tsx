import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, GraduationCap, Building2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/Toast';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Label, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SignUp() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    college: '',
    year: '',
    password: '',
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      push('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: 'student',
        },
      },
    });
    if (error) {
      setLoading(false);
      push(error.message, 'error');
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.fullName,
        phone: form.phone,
        role: 'student',
        department: form.department,
        college: form.college,
        year: form.year,
      });
    }
    setLoading(false);
    push('Account created! Please sign in.', 'success');
    navigate('/signin');
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start browsing and booking projects" side="student">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input id="fullName" required placeholder="Rahul Sharma" className="pl-9" value={form.fullName} onChange={set('fullName')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="email" type="email" required placeholder="you@college.edu" className="pl-9" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="phone" type="tel" placeholder="9876543210" className="pl-9" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="department" placeholder="Computer Science" className="pl-9" value={form.department} onChange={set('department')} />
            </div>
          </div>
          <div>
            <Label htmlFor="college">College</Label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="college" placeholder="Your college" className="pl-9" value={form.college} onChange={set('college')} />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="year">Year of study</Label>
          <Select id="year" value={form.year} onChange={set('year')}>
            <option value="">Select year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Postgraduate">Postgraduate</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input id="password" type={show ? 'text' : 'password'} required placeholder="Min. 6 characters" className="pl-9 pr-9" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
