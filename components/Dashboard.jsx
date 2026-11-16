'use client';
import { useMemo, useState } from 'react';
import {
  ShieldCheck, PackageX, Gavel, TriangleAlert, BellRing, Search, ArrowUpRight, ArrowDownRight, Minus,
  CloudDownload, ListChecks, Tags, GitCommitHorizontal, Clock, Database, ChevronDown, ExternalLink, CircleCheck, CircleAlert, Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { MonthlyBars, HBars } from '@/components/charts';
import { cn, fmt, dot, kstTime } from '@/lib/utils';

const RECALL = 'var(--color-recall)', ACTION = 'var(--color-action)';
const addDays = (ymd, n) => new Date(Date.parse(ymd) + n * 864e5).toISOString().slice(0, 10);

function Change({ now, prev }) {
  if (prev == null) return null;
  const d = now - prev;
  const Icon = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums text-slate-700">
      <Icon className="size-3.5" aria-hidden />{d > 0 ? '+' : ''}{fmt(d)}건
      <span className="ml-1 text-slate-500">직전 30일 {fmt(prev)}건</span>
    </span>
  );
}

function Kpi({ icon: Icon, label, value, unit = '건', foot, tone }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-slate-600">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', tone)}><Icon className="size-4" aria-hidden /></span>
      </div>
      <div className="mt-2 text-[36px] font-bold leading-none tracking-tight tabular-nums">
        {fmt(value)}<span className="ml-1 text-[16px] font-semibold text-slate-600">{unit}</span>
      </div>
      <div className="mt-3 text-[13.5px]">{foot}</div>
    </Card>
  );
}

const gradeVariant = g => (g === '1등급' ? 'danger' : g === '2등급' ? 'warn' : 'secondary');

function SectionHead({ id, no, title, desc }) {
  return (
    <div id={id} className="mb-4 scroll-mt-20">
      <div className="flex items-baseline gap-2">
        <span className="text-[13.5px] font-semibold tabular-nums text-slate-500">{no}</span>
        <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      </div>
      {desc && <p className="mt-1 max-w-3xl text-[15px] text-slate-600">{desc}</p>}
    </div>
  );
}

function Detail({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-4">
      {items.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="min-w-0"><dt className="text-slate-500">{k}</dt><dd className="truncate tabular-nums text-slate-700">{v}</dd></div>
      ))}
    </dl>
  );
}

function RecallTable({ rows, isNew, infoUrl }) {
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('all');
  const [open, setOpen] = useState(null);
  const [limit, setLimit] = useState(12);
  const counts = useMemo(() => Object.fromEntries(['1등급', '2등급', '3등급'].map(g => [g, rows.filter(r => r.grade === g).length])), [rows]);
  const list = rows.filter(r => (grade === 'all' || r.grade === grade) && (!q || `${r.product} ${r.company} ${r.reason} ${r.type}`.includes(q.trim())));
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><PackageX className="size-4 text-red-600" aria-hidden />최근 회수·판매중지</CardTitle>
          <CardDescription className="mt-1.5">최근 {fmt(rows.length)}건입니다. 행을 누르면 소비기한, 바코드, 일련번호가 나옵니다.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="제품명, 업체, 사유 검색" className="pl-8" aria-label="회수 목록 검색" />
          </div>
          <Segmented value={grade} onChange={setGrade} options={[{ value: 'all', label: '전체' }, ...['1등급', '2등급', '3등급'].map(g => ({ value: g, label: g, count: counts[g] }))]} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-5">
        <Table>
          <THead><TR className="hover:bg-transparent"><TH className="w-[104px]">등록일</TH><TH>제품</TH><TH className="hidden md:table-cell">업체</TH><TH>회수 사유</TH><TH className="text-right">등급</TH></TR></THead>
          <TBody>
            {list.slice(0, limit).map(r => (
              <FragmentRow key={r.id} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} cols={5}
                detail={<Detail items={[['식품유형', r.type], ['제조일자', r.made], ['유통·소비기한', r.expiry], ['바코드', r.barcode], ['품목제조보고번호', r.reportNo], ['일련번호', r.seq], ['처음 확인', r.firstSeen ? dot(r.firstSeen) : '첫 수집 때 이미 있던 건'], ['출처', 'I0490 회수·판매중지']]} />}>
                <TD className="whitespace-nowrap tabular-nums text-slate-700">
                  {dot(r.date)}{isNew(r) && <Badge variant="new" className="ml-1.5 align-[1px]">신규</Badge>}
                </TD>
                <TD className="min-w-[150px]"><div className="font-medium text-slate-900">{r.product}</div><div className="text-[13px] text-slate-500 md:hidden">{r.company}</div></TD>
                <TD className="hidden whitespace-nowrap text-slate-700 md:table-cell">{r.company}</TD>
                <TD className="min-w-[180px]"><div className="text-slate-700">{r.reason}</div><Badge variant="outline" className="mt-1">{r.cat}</Badge></TD>
                <TD className="text-right"><Badge variant={gradeVariant(r.grade)}>{r.grade}</Badge></TD>
              </FragmentRow>
            ))}
            {!list.length && <TR><TD colSpan={5} className="py-10 text-center text-slate-500">해당하는 건이 없습니다.</TD></TR>}
          </TBody>
        </Table>
        <TableFoot shown={Math.min(limit, list.length)} total={list.length} onMore={() => setLimit(limit + 20)} source={infoUrl} label="I0490" />
      </CardContent>
    </Card>
  );
}

function ActionTable({ rows, isNew, infoUrl, kinds }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [open, setOpen] = useState(null);
  const [limit, setLimit] = useState(12);
  const top = kinds.slice(0, 4).map(k => k.name);
  const list = rows.filter(r => (kind === 'all' || r.kindCat === kind) && (!q || `${r.company} ${r.industry} ${r.violation} ${r.region} ${r.law ?? ''}`.includes(q.trim())));
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Gavel className="size-4 text-blue-600" aria-hidden />최근 행정처분</CardTitle>
          <CardDescription className="mt-1.5">처분 확정일 기준 최근 {fmt(rows.length)}건입니다. 행을 누르면 위반 법령과 처분 기간이 나옵니다.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="업소명, 업종, 위반 내용 검색" className="pl-8" aria-label="행정처분 목록 검색" />
          </div>
          <Segmented value={kind} onChange={setKind} className="max-w-full overflow-x-auto" options={[{ value: 'all', label: '전체' }, ...top.map(k => ({ value: k, label: k }))]} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-5">
        <Table>
          <THead><TR className="hover:bg-transparent"><TH className="w-[104px]">확정일</TH><TH>업소</TH><TH>처분</TH><TH>위반 내용</TH></TR></THead>
          <TBody>
            {list.slice(0, limit).map(r => (
              <FragmentRow key={r.id} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} cols={4}
                detail={<Detail items={[['위반 법령', r.law], ['처분 기간', r.period], ['지역', r.region], ['인허가번호', r.licenseNo], ['위반 분류', r.vCat], ['처음 확인', r.firstSeen ? dot(r.firstSeen) : '첫 수집 때 이미 있던 건'], ['출처', 'I0470 행정처분']]} />}>
                <TD className="whitespace-nowrap tabular-nums text-slate-700">
                  {dot(r.date)}{isNew(r) && <Badge variant="new" className="ml-1.5 align-[1px]">신규</Badge>}
                </TD>
                <TD className="min-w-[140px]"><div className="font-medium text-slate-900">{r.company}</div><div className="text-[13px] text-slate-500">{r.industry} · {r.region}</div></TD>
                <TD className="whitespace-nowrap"><Badge variant={/정지|폐쇄|취소/.test(r.kindCat) ? 'danger' : 'secondary'}>{r.kind}</Badge></TD>
                <TD className="min-w-[200px] text-slate-700">{r.violation}</TD>
              </FragmentRow>
            ))}
            {!list.length && <TR><TD colSpan={4} className="py-10 text-center text-slate-500">해당하는 건이 없습니다.</TD></TR>}
          </TBody>
        </Table>
        <TableFoot shown={Math.min(limit, list.length)} total={list.length} onMore={() => setLimit(limit + 20)} source={infoUrl} label="I0470" />
      </CardContent>
    </Card>
  );
}

function FragmentRow({ open, onToggle, cols, detail, children }) {
  return (
    <>
      <TR className={cn('cursor-pointer', open && 'bg-slate-50')} onClick={onToggle} aria-expanded={open}>{children}</TR>
      {open && <tr className="border-b border-slate-100 bg-slate-50"><td colSpan={cols} className="px-3 pb-3 pt-1">{detail}</td></tr>}
    </>
  );
}

function TableFoot({ shown, total, onMore, source, label }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3 text-[13.5px] text-slate-600 sm:px-0">
      <span className="tabular-nums">{fmt(shown)} / {fmt(total)}건</span>
      <div className="flex items-center gap-3">
        <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-slate-900">원본 데이터 {label}<ExternalLink className="size-3.5" aria-hidden /></a>
        {shown < total && <button type="button" onClick={onMore} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-700 shadow-xs hover:bg-slate-50">더 보기<ChevronDown className="size-3.5" aria-hidden /></button>}
      </div>
    </div>
  );
}

export default function Dashboard({ D }) {
  const K = D.kpis, M = D.meta;
  const sample = M.source === 'sample';
  const since = addDays(M.asOf, -7);
  const isNew = r => r.firstSeen && r.firstSeen > since;
  const svc = Object.fromEntries(M.services.map(s => [s.key, s]));
  const totalRecall = D.recallReasons.reduce((s, x) => s + x.n, 0);
  const totalAction = D.actionKinds.reduce((s, x) => s + x.n, 0);
  const hardChecks = M.checks.filter(c => c.hard);
  const lastChange = D.changes[0];

  return (
    <>
      {sample && (
        <div className="bg-amber-50 px-4 py-2.5 text-center text-[14px] text-amber-900 ring-1 ring-amber-200">
          지금 보이는 숫자와 업체명은 화면 확인용 <b>가상 샘플 데이터</b>입니다. 인증키를 넣고 <code className="rounded bg-amber-100 px-1">npm run data</code>로 실제 데이터를 받아야 합니다.
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <span className="grid size-7 place-items-center rounded-lg bg-red-600 text-white"><ShieldCheck className="size-4" aria-hidden /></span>
            <span className="text-[14.5px] font-bold tracking-tight">식품 회수·행정처분 모니터</span>
          </div>
          <nav aria-label="목차" className="ml-auto hidden gap-5 text-[14.5px] text-slate-600 md:flex">
            <a href="#trend" className="hover:text-slate-900">추이</a>
            <a href="#class" className="hover:text-slate-900">사유</a>
            <a href="#list" className="hover:text-slate-900">목록</a>
            <a href="#how" className="hover:text-slate-900">돌아가는 방식</a>
          </nav>
          <Badge variant="success" className="ml-auto md:ml-0"><span className="size-1.5 rounded-full bg-emerald-500" />매일 09:00 갱신</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* 소개 */}
        <section className="pt-10 pb-2">
          <Badge variant="outline" className="mb-4 bg-white px-2.5 py-1 text-[13.5px]"><Database className="size-3.5 text-red-600" aria-hidden />식품안전나라 공개 데이터 · 매일 자동 수집</Badge>
          <h1 className="text-[clamp(26px,4.2vw,40px)] font-bold leading-tight tracking-tight">
            어제 이후 새로 올라온<br />식품 회수·행정처분
          </h1>
          <p className="mt-3 max-w-2xl text-[16.5px] text-slate-700">
            식품안전나라에는 회수·판매중지와 행정처분이 매일 올라옵니다. 사이트에 들어가 어제와 뭐가 달라졌는지 눈으로 찾던 일을, 매일 아침 9시에 대신 하도록 만들었습니다.
            전날까지 없던 건에는 <Badge variant="new" className="align-[2px]">신규</Badge>가 붙습니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden />수집 <b className="font-medium tabular-nums text-slate-700">{kstTime(M.fetchedAt)}</b> (KST)</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">기간 {M.window}</span>
            <span>출처 식품의약품안전처 식품안전나라 Open API (I0490, I0470)</span>
          </div>

          <ul className="mt-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-5 text-[15px] text-slate-700 shadow-sm">
            {[
              '목록은 두 API를 통째로 받아서 만듭니다. 받은 건수가 맞지 않거나 날짜가 깨져 있으면 그날은 반영하지 않고 전날 화면을 그대로 둡니다.',
              '달라진 게 없는 날은 다시 배포하지 않습니다. 그래서 수집 시각이 곧 마지막으로 내용이 바뀐 시각입니다.',
              '건마다 등록일과 일련번호(행정처분은 인허가번호)를 같이 적어 두었습니다. 식품안전나라에서 원문을 바로 찾아볼 수 있습니다.',
            ].map(t => (
              <li key={t} className="flex gap-2.5"><CircleCheck className="mt-[5px] size-4 shrink-0 text-red-600" aria-hidden />{t}</li>
            ))}
          </ul>
        </section>

        {/* KPI */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="최근 30일 요약">
          <Kpi icon={PackageX} tone="bg-red-50 text-red-600" label="회수·판매중지 · 최근 30일" value={K.recall30} foot={<Change now={K.recall30} prev={K.recall30Prev} />} />
          <Kpi icon={Gavel} tone="bg-blue-50 text-blue-600" label="행정처분 · 최근 30일" value={K.action30} foot={<Change now={K.action30} prev={K.action30Prev} />} />
          <Kpi icon={TriangleAlert} tone="bg-amber-50 text-amber-600" label="1등급 회수 · 최근 30일" value={K.grade1_30}
            foot={<span className="text-slate-600">위해 우려가 가장 큰 등급 · 영업·제조정지 <b className="font-semibold tabular-nums text-slate-700">{fmt(K.stop30)}</b>건</span>} />
          <Kpi icon={BellRing} tone="bg-slate-100 text-slate-700" label="새로 올라온 건 · 최근 7일" value={K.new7.recall + K.new7.action}
            foot={<span className="text-slate-600 tabular-nums">회수 {fmt(K.new7.recall)}건 · 행정처분 {fmt(K.new7.action)}건</span>} />
        </section>

        {/* 추이 */}
        <section className="mt-12">
          <SectionHead id="trend" no="01" title="월별 추이" desc="최근 12개월 동안 달마다 몇 건 올라왔는지입니다. 행정처분이 회수보다 훨씬 많아서 그래프를 나눴습니다. 이번 달은 아직 안 끝나 옅게 칠했습니다." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="grid grid-cols-1 gap-6 pt-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[14.5px] font-semibold"><span className="size-2.5 rounded-sm bg-recall" />회수·판매중지<span className="ml-auto text-[13px] font-normal tabular-nums text-slate-500">12개월 {fmt(M.inWindow.recall)}건</span></div>
                  <MonthlyBars data={D.monthly} field="recall" color={RECALL} label="회수·판매중지" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[14.5px] font-semibold"><span className="size-2.5 rounded-sm bg-action" />행정처분<span className="ml-auto text-[13px] font-normal tabular-nums text-slate-500">12개월 {fmt(M.inWindow.action)}건</span></div>
                  <MonthlyBars data={D.monthly} field="action" color={ACTION} label="행정처분" />
                </div>
              </CardContent>
              <details className="border-t border-slate-100 px-5 py-3 text-[13.5px] text-slate-600">
                <summary className="cursor-pointer select-none hover:text-slate-900">표로 보기</summary>
                <Table className="mt-2">
                  <THead><TR className="hover:bg-transparent"><TH>월</TH><TH className="text-right">회수·판매중지</TH><TH className="text-right">행정처분</TH></TR></THead>
                  <TBody>{D.monthly.map(m => <TR key={m.m}><TD className="tabular-nums">{m.m.replace('-', '.')}</TD><TD className="text-right tabular-nums">{fmt(m.recall)}</TD><TD className="text-right tabular-nums">{fmt(m.action)}</TD></TR>)}</TBody>
                </Table>
              </details>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BellRing className="size-4 text-slate-600" aria-hidden />새 항목이 잡힌 날</CardTitle>
                <CardDescription>아무것도 안 올라온 날은 빠집니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {D.changes.length ? (
                  <ul className="relative grid gap-0 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                    {D.changes.slice(0, 8).map((c, i) => (
                      <li key={c.date} className="relative flex items-center gap-3 py-1.5 pl-5 text-[14px]">
                        <span className={cn('absolute left-0 size-[11px] rounded-full border-2 border-white', i === 0 ? 'bg-red-600' : 'bg-slate-300')} />
                        <span className="w-[76px] tabular-nums text-slate-600">{dot(c.date).slice(5)}</span>
                        <span className="tabular-nums text-slate-700">회수 <b className="font-semibold">{c.recall}</b></span>
                        <span className="tabular-nums text-slate-700">처분 <b className="font-semibold">{c.action}</b></span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[14px] text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{dot(M.baselineAt)}에 처음 수집했습니다. 이날 이미 있던 건은 신규로 치지 않고, 다음 날부터 새로 올라온 건만 여기에 적습니다.</p>
                )}
                {lastChange && <p className="mt-3 text-[13px] text-slate-500">가장 최근 {dot(lastChange.date)}</p>}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 분류 */}
        <section className="mt-12">
          <SectionHead id="class" no="02" title="사유별로 보면" desc="API가 주는 사유는 문장이라 그대로는 셀 수 없습니다. 대장균, 이물, 위생교육 같은 단어가 들어 있는지로 묶었고, 어디에도 안 걸리면 기타로 뒀습니다. 최근 12개월 기준입니다." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>회수 사유</CardTitle><CardDescription className="tabular-nums">회수·판매중지 {fmt(totalRecall)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.recallReasons} color={RECALL} total={totalRecall} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>처분 종류</CardTitle><CardDescription className="tabular-nums">행정처분 {fmt(totalAction)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.actionKinds} color={ACTION} total={totalAction} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>위반 내용</CardTitle><CardDescription className="tabular-nums">행정처분 {fmt(totalAction)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.violations} color={ACTION} total={totalAction} /></CardContent>
            </Card>
          </div>
        </section>

        {/* 목록 */}
        <section className="mt-12">
          <SectionHead id="list" no="03" title="최근 목록" desc="최근 등록순입니다. 지난 7일 사이 새로 잡힌 건에 신규가 붙습니다." />
          <div className="grid grid-cols-1 gap-4">
            <RecallTable rows={D.recent.recall} isNew={isNew} infoUrl={svc.recall.infoUrl} />
            <ActionTable rows={D.recent.action} isNew={isNew} infoUrl={svc.action.infoUrl} kinds={D.actionKinds} />
          </div>
        </section>

        {/* 자동화 구조 */}
        <section className="mt-12">
          <SectionHead id="how" no="04" title="어떻게 돌아가나" desc="이 페이지는 열 때마다 API를 부르지 않습니다. 하루 한 번 받아서 확인을 마친 결과만 올려 둡니다." />
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [CloudDownload, '수집', '매일 09:00에 GitHub Actions가 두 API를 1,000건씩 끊어서 끝까지 받습니다. 접속이 안 되면 2분 쉬고 다시 해 보고, 세 번 안 되면 그날은 건너뜁니다.', `${fmt(M.totals.recall + M.totals.action)}건`],
              [ListChecks, '확인', '받은 건수가 API가 알려준 전체 건수와 맞는지, 날짜와 업체명이 비어 있지 않은지, 전날보다 갑자기 줄지 않았는지 봅니다.', `${hardChecks.filter(c => c.ok).length} / ${hardChecks.length} 통과`],
              [Tags, '정리·분류', '영문 필드명을 읽기 쉬운 이름으로 바꾸고, 사유 문장을 단어 기준으로 묶습니다. 똑같은 행이 두 번 오면 하나만 남깁니다.', `${D.recallReasons.length + D.violations.length}개 분류`],
              [GitCommitHorizontal, '신규 표시·배포', '건마다 처음 본 날짜를 적어 두고 어제 목록과 비교합니다. 달라진 날에만 커밋이 생기고, 그때 Vercel이 다시 배포합니다.', lastChange ? `최근 ${dot(lastChange.date).slice(5)}` : '첫 수집'],
            ].map(([Icon, t, b, big], i) => (
              <li key={t}>
                <Card className="h-full p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon className="size-4" aria-hidden /></span>
                    <span className="text-[13px] font-semibold tabular-nums text-red-600">{i + 1}단계</span>
                  </div>
                  <h3 className="mt-3 text-[16px] font-semibold">{t}</h3>
                  <p className="mt-1 text-[14px] text-slate-600">{b}</p>
                  <div className="mt-3 text-[20px] font-bold tracking-tight tabular-nums">{big}</div>
                </Card>
              </li>
            ))}
          </ol>

          <Card className="mt-4">
            <CardHeader><CardTitle>이번 수집 확인 결과</CardTitle><CardDescription>하나라도 실패하면 전날 화면을 그대로 둡니다. 노란 표시는 참고로만 남깁니다.</CardDescription></CardHeader>
            <CardContent>
              <ul className="grid gap-x-8 gap-y-1.5 text-[14px] md:grid-cols-2">
                {M.checks.map(c => (
                  <li key={c.name} className="flex items-center gap-2">
                    {c.ok ? <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-label="통과" /> : <CircleAlert className={cn('size-4 shrink-0', c.hard ? 'text-red-600' : 'text-amber-500')} aria-label={c.hard ? '실패' : '경고'} />}
                    <span className="text-slate-700">{c.name}</span>
                    <span className="ml-auto truncate tabular-nums text-slate-500">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 text-[13.5px] text-slate-600">
          <p>데이터: 식품의약품안전처 식품안전나라 Open API · 회수·판매중지(<a className="underline-offset-2 hover:underline" href={svc.recall.infoUrl} target="_blank" rel="noreferrer">I0490</a>), 행정처분(<a className="underline-offset-2 hover:underline" href={svc.action.infoUrl} target="_blank" rel="noreferrer">I0470</a>). 처분이나 회수의 정확한 내용은 <a className="underline-offset-2 hover:underline" href={M.portal} target="_blank" rel="noreferrer">식품안전나라</a> 에서 확인해 주세요.</p>
          <p>사유 분류는 제가 정한 단어 기준이라 식약처 공식 분류와 다를 수 있습니다. 공개 데이터로 만든 개인 포트폴리오이며, 특정 기업이나 기관의 자료가 아닙니다.</p>
        </div>
      </footer>
    </>
  );
}
