import { cn } from '@/lib/utils';

export function Input({ className, ...props }) {
  return <input className={cn('flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-[13px] shadow-xs outline-none placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-[3px] focus-visible:ring-slate-200', className)} {...props} />;
}
