import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'indigo';
  hint?: string;
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
};

export function StatCard({ label, value, icon: Icon, tone = 'blue', hint }: StatCardProps) {
  const t = toneClasses[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`rounded-xl p-3 ring-8 ${t.bg} ${t.text} ${t.ring}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
