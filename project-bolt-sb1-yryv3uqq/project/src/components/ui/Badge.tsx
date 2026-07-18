type Tone = 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'slate' | 'indigo';

const toneClasses: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  slate: 'bg-slate-100 text-slate-700 ring-slate-600/10',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
};

export function Badge({ tone = 'slate', children, className = '' }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
