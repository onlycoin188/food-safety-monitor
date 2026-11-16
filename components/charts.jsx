'use client';
import { useState } from 'react';
import { cn, fmt } from '@/lib/utils';

// 월별 막대 (시리즈 하나). 마지막 달이 진행 중이면 옅게 표시합니다.
export function MonthlyBars({ data, field, color, partialLast = true, label }) {
  const [hover, setHover] = useState(null);
  const W = 480, H = 190, top = 24, bottom = 26, left = 34, right = 4;
  const max = Math.max(...data.map(d => d[field]), 1);
  const nice = (() => { const step = Math.pow(10, Math.floor(Math.log10(max))); const m = Math.ceil(max / step); return (m <= 2 ? 2 : m <= 5 ? 5 : 10) * step; })();
  const ticks = [0, nice / 2, nice];
  const iw = W - left - right, ih = H - top - bottom;
  const bw = iw / data.length, barW = Math.min(26, bw - 10);
  const y = v => top + ih - (v / nice) * ih;
  const peak = data.reduce((a, b, i) => (b[field] > data[a][field] ? i : a), 0);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`${label} 월별 건수`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} className={t === 0 ? 'stroke-slate-300' : 'stroke-slate-100'} strokeWidth="1" shapeRendering="crispEdges" />
            <text x={left - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[12px] tabular-nums">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = left + i * bw + (bw - barW) / 2, v = d[field], h = Math.max(0, y(0) - y(v));
          const partial = partialLast && i === data.length - 1;
          const r = Math.min(4, h);
          return (
            <g key={d.m} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={left + i * bw} y={top} width={bw} height={ih} fill="transparent" />
              {h > 0 && <path d={`M${x},${y(0)} V${y(v) + r} Q${x},${y(v)} ${x + r},${y(v)} H${x + barW - r} Q${x + barW},${y(v)} ${x + barW},${y(v) + r} V${y(0)} Z`}
                fill={color} opacity={hover == null || hover === i ? (partial ? 0.45 : 1) : 0.35} />}
              {(i === peak || i === data.length - 1) && <text x={x + barW / 2} y={y(v) - 6} textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold tabular-nums">{fmt(v)}</text>}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-slate-500 text-[12px] tabular-nums">{Number(d.m.slice(5))}월</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2.5 py-1.5 text-[13px] whitespace-nowrap text-white shadow-md"
          style={{ left: `${((left + hover * bw + bw / 2) / W) * 100}%`, top: `${(y(data[hover][field]) / H) * 100}%`, marginTop: -8 }}>
          {data[hover].m.replace('-', '.')} · <b className="tabular-nums">{fmt(data[hover][field])}건</b>
          {partialLast && hover === data.length - 1 && <span className="text-slate-500"> (진행 중)</span>}
        </div>
      )}
    </div>
  );
}

// 가로 막대 목록 (분류별 건수)
export function HBars({ items, color, total }) {
  const max = Math.max(...items.map(i => i.n), 1);
  return (
    <ul className="grid gap-2.5">
      {items.map(it => (
        <li key={it.name} className="group" title={`${it.name} ${fmt(it.n)}건`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[14px]">
            <span className="truncate text-slate-700">{it.name}</span>
            <span className="shrink-0 tabular-nums text-slate-900"><b className="font-semibold">{fmt(it.n)}</b><span className="ml-1.5 text-[13px] text-slate-500">{Math.round((it.n / total) * 100)}%</span></span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className={cn('h-2.5 rounded-full transition-opacity group-hover:opacity-80')} style={{ width: `${Math.max(2, (it.n / max) * 100)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
