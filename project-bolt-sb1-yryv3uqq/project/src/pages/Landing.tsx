import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Package,
  Activity,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const categories = [
  { name: 'Artificial Intelligence', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { name: 'Machine Learning', icon: Activity, color: 'from-violet-500 to-purple-500' },
  { name: 'Web Development', icon: ShieldCheck, color: 'from-emerald-500 to-teal-500' },
  { name: 'Data Science', icon: Search, color: 'from-amber-500 to-orange-500' },
  { name: 'Cybersecurity', icon: ShieldCheck, color: 'from-rose-500 to-pink-500' },
  { name: 'IoT Projects', icon: Activity, color: 'from-indigo-500 to-blue-500' },
];

const features = [
  { icon: Search, title: 'Browse 50+ Projects', desc: 'Curated, ready-to-submit projects across 12 categories.' },
  { icon: CreditCard, title: 'Easy UPI Payments', desc: 'Pay via QR code and upload screenshot for verification.' },
  { icon: Activity, title: 'Live Progress Tracking', desc: 'Track your project through 8 clear stages in real time.' },
  { icon: Package, title: 'Complete File Delivery', desc: 'Source code, documentation, PPT, and report — all delivered.' },
];

const steps = [
  { title: 'Browse & Request', desc: 'Find a project from the catalog and submit your requirements.' },
  { title: 'Pay via UPI', desc: 'Scan the QR code and upload your payment screenshot.' },
  { title: 'Track Progress', desc: 'Watch your project move through development stages live.' },
  { title: 'Get Deliverables', desc: 'Download all project files once completed and delivered.' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-1.5 text-white">
              <GraduationCap size={22} />
            </div>
            <span className="text-lg font-bold text-slate-800">EduProject Hub</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">Features</a>
            <a href="#categories" className="text-sm font-medium text-slate-600 hover:text-blue-600">Categories</a>
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-blue-600">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/signin" className="text-sm font-medium text-slate-600 hover:text-blue-600">Sign in</Link>
            <Button size="sm" onClick={() => (window.location.href = '/signup')}>Get started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 py-20 lg:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="violet" className="mb-5 bg-white/15 text-white ring-white/20 backdrop-blur">
              <Sparkles size={12} /> Trusted by 5,000+ students
            </Badge>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Industry-ready academic projects, delivered to you.
            </h1>
            <p className="mt-5 text-lg text-blue-100">
              Browse, request, and track academic projects across AI, ML, Web, IoT, and more.
              Pay via UPI, track progress live, and get complete deliverables — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="w-full bg-white text-blue-700 hover:bg-blue-50 sm:w-auto">
                  Start as Student <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { label: 'Projects Available', value: '50+' },
            { label: 'Categories', value: '12' },
            { label: 'Students Served', value: '5,000+' },
            { label: 'Delivery Rate', value: '100%' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-blue-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-800">Everything you need to ship your project</h2>
            <p className="mt-3 text-slate-500">From discovery to delivery, EduProject Hub covers the entire journey.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-800">Explore project categories</h2>
            <p className="mt-3 text-slate-500">Find the perfect project across 12 specialized domains.</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  to="/signup"
                  key={c.name}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{c.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-800">How it works</h2>
            <p className="mt-3 text-slate-500">Four simple steps from request to delivery.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-slate-300">Create your account today and browse 50+ ready-to-submit projects.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="w-full bg-white text-slate-800 hover:bg-slate-100 sm:w-auto">
                Sign up free <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-1.5 text-white"><GraduationCap size={18} /></div>
            <span className="font-bold text-slate-800">EduProject Hub</span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} EduProject Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
