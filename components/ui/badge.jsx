import { cn } from '@/lib/utils';

const variants = {
  default: 'border-transparent bg-slate-900 text-white',
  secondary: 'border-transparent bg-slate-100 text-slate-700',
  outline: 'border-slate-200 text-slate-700',
  danger: 'border-transparent bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15',
  warn: 'border-transparent bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  success: 'border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  new: 'border-transparent bg-red-600 text-white',
};

export function Badge({ className, variant = 'default', ...props }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[12.5px] font-medium leading-4', variants[variant], className)} {...props} />;
}
