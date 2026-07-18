import { ReactNode } from 'react';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: 'student' | 'admin';
  side: 'student' | 'admin';
}

export function AuthLayout({ children, title, subtitle, icon = 'student', side }: AuthLayoutProps) {
  const isAdmin = side === 'admin';
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div
        className={`relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between ${
          isAdmin
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900'
            : 'bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700'
        }`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 text-white">
            <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
              {icon === 'admin' ? <ShieldCheck size={26} /> : <GraduationCap size={26} />}
            </div>
            <span className="text-xl font-bold tracking-tight">EduProject Hub</span>
          </div>
        </div>

        <div className="relative space-y-6 text-white">
          <h2 className="text-3xl font-bold leading-tight">
            {isAdmin
              ? 'Admin Control Center'
              : 'Your gateway to industry-ready academic projects'}
          </h2>
          <p className="max-w-md text-blue-100">
            {isAdmin
              ? 'Manage students, orders, payments, and deliverables — all from one powerful dashboard.'
              : 'Browse 50+ curated projects across AI, ML, Web, IoT and more. Request, pay, and track delivery in real time.'}
          </p>
          <ul className="space-y-3 text-sm text-blue-100">
            {(isAdmin
              ? ['Secure role-based access', 'End-to-end order management', 'Payment verification & reports']
              : ['Verified, ready-to-submit projects', 'UPI payments with QR code', 'Live progress tracking']
            ).map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-200" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-blue-200/70">
          © {new Date().getFullYear()} EduProject Hub. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 inline-flex rounded-xl bg-blue-600 p-2.5 text-white">
              {icon === 'admin' ? <ShieldCheck size={24} /> : <GraduationCap size={24} />}
            </div>
            <p className="text-lg font-bold text-slate-800">EduProject Hub</p>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
