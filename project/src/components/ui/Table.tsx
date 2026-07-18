import { ReactNode, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

export function Table({ children, className = '', ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={`w-full text-left text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TR({ children, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className="transition-colors hover:bg-slate-50/70" {...rest}>
      {children}
    </tr>
  );
}

export function TH({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function TD({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3.5 text-slate-700 ${className}`} {...rest}>
      {children}
    </td>
  );
}

export function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4 text-slate-400">
        <Icon size={28} />
      </div>
      <div>
        <p className="font-medium text-slate-700">{title}</p>
        {message && <p className="mt-1 text-sm text-slate-400">{message}</p>}
      </div>
    </div>
  );
}
