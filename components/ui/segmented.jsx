'use client';
import { cn } from '@/lib/utils';

// shadcn Tabs 모양의 단일 선택 버튼 묶음
export function Segmented({ value, onChange, options, className }) {
  return (
    <div role="group" className={cn('inline-flex h-9 items-center rounded-lg bg-slate-100 p-[3px] text-slate-500', className)}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={cn('inline-flex h-full items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[12.5px] font-medium transition-colors hover:text-slate-900',
            value === o.value && 'bg-white text-slate-900 shadow-sm')}>
          {o.label}{o.count != null && <span className="tabular-nums text-slate-400">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
