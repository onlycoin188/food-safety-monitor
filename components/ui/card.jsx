import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('min-w-0 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-[16px] font-semibold leading-none tracking-tight', className)} {...props} />;
}
export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[14px] text-slate-600', className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}
