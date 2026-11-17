import { Bug, PackageX, Gavel } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HBars } from '@/components/charts';
import { fmt, dot } from '@/lib/utils';

export function HygieneBadge({ type, className }) {
  if (!type) return null;
  return <Badge variant="outline" className={`border-red-200 bg-red-50/60 text-red-700 ${className ?? ''}`}><Bug className="size-3" aria-hidden />{type}</Badge>;
}

// 업장 위생 관리·방역으로 막을 수 있는 건만 따로 모아 봅니다
export default function HygieneSection({ H, totalRecall, totalAction }) {
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const totalH = H.byType.reduce((s, x) => s + x.n, 0);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bug className="size-4 text-red-600" aria-hidden />최근 12개월 중 위생·방역 관련</CardTitle>
          <CardDescription>폐업 정리성 폐쇄는 뺀 숫자입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[13.5px] text-slate-600"><PackageX className="size-3.5 text-red-600" aria-hidden />회수·판매중지</div>
              <div className="mt-1 text-[26px] font-bold leading-none tabular-nums">{fmt(H.recall)}<span className="ml-1 text-[14px] font-semibold text-slate-500">건</span></div>
              <div className="mt-1.5 text-[13px] tabular-nums text-slate-600">전체 {fmt(totalRecall)}건 중 {pct(H.recall, totalRecall)}%</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[13.5px] text-slate-600"><Gavel className="size-3.5 text-blue-600" aria-hidden />행정처분</div>
              <div className="mt-1 text-[26px] font-bold leading-none tabular-nums">{fmt(H.action)}<span className="ml-1 text-[14px] font-semibold text-slate-500">건</span></div>
              <div className="mt-1.5 text-[13px] tabular-nums text-slate-600">전체 {fmt(totalAction)}건 중 {pct(H.action, totalAction)}%</div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold text-slate-700">유형별</div>
            <HBars items={H.byType} color="var(--color-recall)" total={totalH} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>최근 위생·방역 관련 건</CardTitle>
          <CardDescription>회수와 행정처분을 등록일 순으로 함께 모았습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {H.latest.map(r => (
              <li key={`${r.src}-${r.id}`} className="flex gap-3 py-2.5">
                <span className="w-[76px] shrink-0 pt-0.5 text-[13.5px] tabular-nums text-slate-500">{dot(r.date)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={r.src === 'recall' ? 'danger' : 'secondary'} className={r.src === 'action' ? 'bg-blue-50 text-blue-700' : ''}>{r.src === 'recall' ? '회수' : r.kind}</Badge>
                    <b className="text-[14.5px] font-semibold">{r.src === 'recall' ? r.product : r.company}</b>
                    <span className="text-[13.5px] text-slate-500">{r.src === 'recall' ? r.company : `${r.industry} · ${r.region}`}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-start gap-1.5 text-[14px] text-slate-700">
                    <HygieneBadge type={r.hyg} className="mt-px" /><span className="min-w-0 flex-1 line-clamp-2">{r.src === 'recall' ? r.reason : r.violation}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
