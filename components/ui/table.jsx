import { cn } from '@/lib/utils';

export const Table = ({ className, ...p }) => (
  <div className="relative w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-[13px]', className)} {...p} /></div>
);
export const THead = ({ className, ...p }) => <thead className={cn('[&_tr]:border-b [&_tr]:border-slate-200', className)} {...p} />;
export const TBody = ({ className, ...p }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />;
export const TR = ({ className, ...p }) => <tr className={cn('border-b border-slate-100 transition-colors hover:bg-slate-50/80', className)} {...p} />;
export const TH = ({ className, ...p }) => <th className={cn('h-9 whitespace-nowrap px-3 text-left align-middle text-[12px] font-medium text-slate-500', className)} {...p} />;
export const TD = ({ className, ...p }) => <td className={cn('px-3 py-2.5 align-top', className)} {...p} />;
