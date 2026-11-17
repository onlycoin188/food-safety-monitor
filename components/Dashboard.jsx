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
import MailPreview from '@/components/MailPreview';
import HygieneSection, { HygieneBadge } from '@/components/HygieneSection';
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
  const list = rows.filter(r => (grade === 'all' || r.grade === grade || (grade === 'hyg' && r.hyg)) && (!q || `${r.product} ${r.company} ${r.reason} ${r.type}`.includes(q.trim())));
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><PackageX className="size-4 text-red-600" aria-hidden />최근 회수·판매중지</CardTitle>
          <CardDescription className="mt-1.5">최근 {fmt(rows.length)}건입니다. 행을 누르면 소비기한, 바코드, 일련번호를 볼 수 있습니다.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="제품명, 업체, 사유 검색" className="pl-8" aria-label="회수 목록 검색" />
          </div>
          <Segmented value={grade} onChange={setGrade} className="max-w-full overflow-x-auto" options={[{ value: 'all', label: '전체' }, ...['1등급', '2등급', '3등급'].map(g => ({ value: g, label: g, count: counts[g] })), { value: 'hyg', label: '위생·방역', count: rows.filter(r => r.hyg).length }]} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-5">
        <Table>
          <THead><TR className="hover:bg-transparent"><TH className="w-[104px]">등록일</TH><TH>제품</TH><TH className="hidden md:table-cell">업체</TH><TH>회수 사유</TH><TH className="text-right">등급</TH></TR></THead>
          <TBody>
            {list.slice(0, limit).map(r => (
              <FragmentRow key={r.id} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} cols={5}
                detail={<Detail items={[['식품유형', r.type], ['제조일자', r.made], ['유통·소비기한', r.expiry], ['바코드', r.barcode], ['품목제조보고번호', r.reportNo], ['일련번호', r.seq], ['처음 확인', r.firstSeen ? dot(r.firstSeen) : '첫 수집 이전'], ['출처', 'I0490 회수·판매중지']]} />}>
                <TD className="whitespace-nowrap tabular-nums text-slate-700">
                  {dot(r.date)}{isNew(r) && <Badge variant="new" className="ml-1.5 align-[1px]">신규</Badge>}
                </TD>
                <TD className="min-w-[150px]"><div className="font-medium text-slate-900">{r.product}</div><div className="text-[13px] text-slate-500 md:hidden">{r.company}</div></TD>
                <TD className="hidden whitespace-nowrap text-slate-700 md:table-cell">{r.company}</TD>
                <TD className="min-w-[180px]"><div className="text-slate-700">{r.reason}</div><div className="mt-1 flex flex-wrap gap-1"><Badge variant="outline">{r.cat}</Badge><HygieneBadge type={r.hyg} /></div></TD>
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
  const list = rows.filter(r => (kind === 'all' || r.kindCat === kind || (kind === 'hyg' && r.hyg)) && (!q || `${r.company} ${r.industry} ${r.violation} ${r.region} ${r.law ?? ''}`.includes(q.trim())));
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Gavel className="size-4 text-blue-600" aria-hidden />최근 행정처분</CardTitle>
          <CardDescription className="mt-1.5">처분 확정일 기준 최근 {fmt(rows.length)}건입니다. 행을 누르면 위반 법령과 처분 기간을 볼 수 있습니다.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="업소명, 업종, 위반 내용 검색" className="pl-8" aria-label="행정처분 목록 검색" />
          </div>
          <Segmented value={kind} onChange={setKind} className="max-w-full overflow-x-auto" options={[{ value: 'all', label: '전체' }, ...top.map(k => ({ value: k, label: k })), { value: 'hyg', label: '위생·방역' }]} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-5">
        <Table>
          <THead><TR className="hover:bg-transparent"><TH className="w-[104px]">확정일</TH><TH>업소</TH><TH>처분</TH><TH>위반 내용</TH></TR></THead>
          <TBody>
            {list.slice(0, limit).map(r => (
              <FragmentRow key={r.id} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} cols={4}
                detail={<Detail items={[['위반 법령', r.law], ['처분 기간', r.period], ['지역', r.region], ['인허가번호', r.licenseNo], ['위반 분류', r.vCat], ['처음 확인', r.firstSeen ? dot(r.firstSeen) : '첫 수집 이전'], ['출처', 'I0470 행정처분']]} />}>
                <TD className="whitespace-nowrap tabular-nums text-slate-700">
                  {dot(r.date)}{isNew(r) && <Badge variant="new" className="ml-1.5 align-[1px]">신규</Badge>}
                </TD>
                <TD className="min-w-[140px]"><div className="font-medium text-slate-900">{r.company}</div><div className="text-[13px] text-slate-500">{r.industry} · {r.region}</div></TD>
                <TD className="whitespace-nowrap"><Badge variant={/정지|폐쇄|취소/.test(r.kindCat) ? 'danger' : 'secondary'}>{r.kind}</Badge></TD>
                <TD className="min-w-[200px] text-slate-700"><p className={open === r.id ? '' : 'line-clamp-2'}>{r.violation}</p>{r.hyg && <HygieneBadge type={r.hyg} className="mt-1" />}</TD>
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
          지금은 화면 확인용 <b>가상 데이터</b>입니다. 숫자와 업체명 모두 실제가 아닙니다.
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <span className="grid size-7 place-items-center rounded-lg bg-red-600 text-white"><ShieldCheck className="size-4" aria-hidden /></span>
            <span className="text-[14.5px] font-bold tracking-tight">식품 회수·행정처분 모니터</span>
          </div>
          <nav aria-label="목차" className="ml-auto hidden gap-5 text-[14.5px] text-slate-600 md:flex">
            <a href="#mail" className="hover:text-slate-900">오늘의 메일</a>
            <a href="#hygiene" className="hover:text-slate-900">위생·방역</a>
            <a href="#trend" className="hover:text-slate-900">추이</a>
            <a href="#class" className="hover:text-slate-900">사유</a>
            <a href="#list" className="hover:text-slate-900">목록</a>
            <a href="#how" className="hover:text-slate-900">운영 방식</a>
          </nav>
          <Badge variant="success" className="ml-auto md:ml-0"><span className="size-1.5 rounded-full bg-emerald-500" />매일 09:00 갱신</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* 소개 */}
        <section className="pt-10 pb-2">
          <Badge variant="outline" className="mb-4 bg-white px-2.5 py-1 text-[13.5px]"><Database className="size-3.5 text-red-600" aria-hidden />식품안전나라 공개 데이터 · 매일 자동 수집</Badge>
          <h1 className="text-[clamp(26px,4.2vw,40px)] font-bold leading-tight tracking-tight">
            오늘 새로 올라온<br />식품 회수·행정처분
          </h1>
          <p className="mt-3 max-w-2xl text-[16.5px] text-slate-700">
            식품안전나라에 올라오는 회수·판매중지와 행정처분을 매일 오전 9시에 모아 옵니다.
            어제까지 없던 건은 <Badge variant="new" className="align-[2px]">신규</Badge>로 표시해서, 새로 올라온 것만 바로 확인할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden />수집 <b className="font-medium tabular-nums text-slate-700">{kstTime(M.fetchedAt)}</b> (KST)</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">기간 {M.window}</span>
            <span>출처 식품의약품안전처 식품안전나라 Open API (I0490, I0470)</span>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Info className="size-4 text-red-600" aria-hidden />만든 이유</h2>
            <p className="mt-2 max-w-3xl text-[15px] text-slate-700">
              회사에서는 UiPath 봇으로 식품 법령 과제를 매일 운영하고 있습니다. 관련 사이트를 크롤링해 데이터를 정리하고 담당자에게 메일로 보내는 과제로, 담당자의 확인 시간이 하루 1시간에서 10분 안쪽으로 줄었습니다.
            </p>
            <p className="mt-1.5 max-w-3xl text-[15px] text-slate-700">
              RPA 툴이 아닌 방식으로도 같은 일을 만들 수 있을지 궁금했습니다. 그래서 Claude Code로 직접 코드를 짜서 수집, 검증, 배포까지 자동으로 돌아가게 구현했습니다.
            </p>
          </div>
        </section>

        {/* KPI */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="최근 30일 요약">
          <Kpi icon={PackageX} tone="bg-red-50 text-red-600" label="회수·판매중지 · 최근 30일" value={K.recall30} foot={<Change now={K.recall30} prev={K.recall30Prev} />} />
          <Kpi icon={Gavel} tone="bg-blue-50 text-blue-600" label="행정처분 · 최근 30일" value={K.action30} foot={<><Change now={K.action30} prev={K.action30Prev} /><div className="mt-1 text-slate-500">폐업 업소 정리 <b className="font-semibold tabular-nums text-slate-700">{fmt(K.closed30)}</b>건은 제외</div></>} />
          <Kpi icon={TriangleAlert} tone="bg-amber-50 text-amber-600" label="1등급 회수 · 최근 30일" value={K.grade1_30}
            foot={<span className="text-slate-600">건강에 미치는 위해가 가장 큰 등급 · 같은 기간 영업·제조정지 <b className="font-semibold tabular-nums text-slate-700">{fmt(K.stop30)}</b>건</span>} />
          <Kpi icon={BellRing} tone="bg-slate-100 text-slate-700" label="새로 올라온 건 · 최근 7일" value={K.new7.recall + K.new7.action}
            foot={<span className="text-slate-600 tabular-nums">회수 {fmt(K.new7.recall)}건 · 행정처분 {fmt(K.new7.action)}건</span>} />
        </section>

        {/* 오늘의 메일 */}
        <section className="mt-12">
          <SectionHead id="mail" no="01" title="오늘의 메일" desc="실무에서는 이 내용을 담당자에게 메일로 보냅니다. 매일 수집이 끝나면 아래와 같은 메일 본문이 만들어집니다. 화면에서는 미리보기만 보여 주고 실제로 발송하지는 않습니다." />
          {D.mail ? <MailPreview mail={D.mail} portal={M.portal} /> : <p className="text-slate-500">다음 수집 후 표시됩니다.</p>}
        </section>

        {/* 위생·방역 */}
        {D.hygiene && (
          <section className="mt-12">
            <SectionHead id="hygiene" no="02" title="위생·방역 관련 이슈" desc="벌레·쥐 같은 해충과 이물, 세균 오염, 위생 취급 불량처럼 업장의 위생 관리와 방역으로 막을 수 있는 건만 따로 모았습니다. 회수 사유와 위반 내용의 단어를 기준으로 골랐습니다." />
            <HygieneSection H={D.hygiene} totalRecall={M.inWindow.recall} totalAction={M.inWindow.action} />
          </section>
        )}

        {/* 추이 */}
        <section className="mt-12">
          <SectionHead id="trend" no="03" title="월별 추이" desc="최근 12개월의 월별 등록 건수입니다. 행정처분이 회수보다 훨씬 많아 그래프를 따로 그렸고, 폐업 업소를 정리하는 폐쇄 처분은 빼고 셌습니다. 이번 달은 집계 중이라 옅게 표시했습니다." />
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
                  <THead><TR className="hover:bg-transparent"><TH>월</TH><TH className="text-right">회수·판매중지</TH><TH className="text-right">행정처분</TH><TH className="text-right">폐업 정리(제외)</TH></TR></THead>
                  <TBody>{D.monthly.map(m => <TR key={m.m}><TD className="tabular-nums">{m.m.replace('-', '.')}</TD><TD className="text-right tabular-nums">{fmt(m.recall)}</TD><TD className="text-right tabular-nums">{fmt(m.action)}</TD><TD className="text-right tabular-nums text-slate-500">{fmt(m.closed)}</TD></TR>)}</TBody>
                </Table>
              </details>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BellRing className="size-4 text-slate-600" aria-hidden />신규 등록 기록</CardTitle>
                <CardDescription>새로 올라온 건이 없는 날은 표시하지 않습니다.</CardDescription>
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
                  <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[14px] text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{dot(M.baselineAt)}에 처음 수집했습니다. 그날 이미 올라와 있던 건은 신규로 세지 않고, 이후에 올라온 건만 기록합니다.</p>
                )}
                {lastChange && <p className="mt-3 text-[13px] text-slate-500">가장 최근 {dot(lastChange.date)}</p>}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 분류 */}
        <section className="mt-12">
          <SectionHead id="class" no="04" title="사유별로 보면" desc="회수 사유와 위반 내용은 문장으로 제공됩니다. 그래서 대장균, 이물, 위생교육 같은 핵심 단어를 기준으로 묶었고, 어느 쪽에도 해당하지 않으면 기타로 분류했습니다. 최근 12개월 기준입니다." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>회수 사유</CardTitle><CardDescription className="tabular-nums">회수·판매중지 {fmt(totalRecall)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.recallReasons} color={RECALL} total={totalRecall} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>처분 종류</CardTitle><CardDescription className="tabular-nums">폐업 정리 제외 {fmt(totalAction)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.actionKinds} color={ACTION} total={totalAction} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>위반 내용</CardTitle><CardDescription className="tabular-nums">행정처분 {fmt(totalAction)}건</CardDescription></CardHeader>
              <CardContent><HBars items={D.violations} color={ACTION} total={totalAction} /></CardContent>
            </Card>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[14.5px] text-slate-700 shadow-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            <p>
              행정처분 원본 {fmt(M.inWindow.actionAll)}건 중 <b className="tabular-nums">{fmt(M.inWindow.closed)}</b>건({Math.round((M.inWindow.closed / Math.max(1, M.inWindow.actionAll)) * 100)}%)은
              &lsquo;영업시설의 전부를 철거함&rsquo;처럼 이미 문을 닫은 업소를 서류상 정리하는 폐쇄 처분입니다.
              위반 때문에 내려진 처분과 성격이 달라서 카드 숫자, 그래프, 목록, 메일에서는 빼고 따로 셌습니다.
            </p>
          </div>
        </section>

        {/* 목록 */}
        <section className="mt-12">
          <SectionHead id="list" no="05" title="최근 목록" desc="최근 등록순입니다. 최근 7일 안에 새로 올라온 건은 신규로 표시합니다. 건마다 일련번호나 인허가번호를 함께 적어, 식품안전나라에서 원문을 찾아볼 수 있습니다." />
          <div className="grid grid-cols-1 gap-4">
            <RecallTable rows={D.recent.recall} isNew={isNew} infoUrl={svc.recall.infoUrl} />
            <ActionTable rows={D.recent.action} isNew={isNew} infoUrl={svc.action.infoUrl} kinds={D.actionKinds} />
          </div>
        </section>

        {/* 자동화 구조 */}
        <section className="mt-12">
          <SectionHead id="how" no="06" title="운영 방식" desc="페이지를 열 때마다 API를 호출하지는 않습니다. 하루 한 번 수집해서 검증을 마친 결과만 보여 줍니다." />
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [CloudDownload, '수집', '매일 오전 9시에 GitHub Actions가 두 API의 전체 데이터를 1,000건씩 나눠 받습니다. 접속에 실패하면 2분 뒤 다시 시도하고, 세 번 모두 실패하면 그날은 건너뜁니다.', `${fmt(M.totals.recall + M.totals.action)}건`],
              [ListChecks, '검증', '받은 건수가 API의 전체 건수와 같은지, 날짜와 업체명이 빠지지 않았는지, 전날보다 건수가 크게 줄지 않았는지 확인합니다.', `${hardChecks.filter(c => c.ok).length} / ${hardChecks.length} 통과`],
              [Tags, '정리·분류', '영문 필드명을 한글 항목으로 바꾸고, 사유 문장을 단어 기준으로 분류합니다. 중복된 행은 하나만 남깁니다.', `${D.recallReasons.length + D.violations.length}개 분류`],
              [GitCommitHorizontal, '신규 표시·배포', '건별로 처음 확인한 날짜를 기록해 전날 목록과 비교합니다. 내용이 바뀐 날에만 커밋하고, 그때 Vercel이 다시 배포합니다.', lastChange ? `최근 ${dot(lastChange.date).slice(5)}` : '첫 수집'],
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
            <CardHeader><CardTitle>이번 수집 검증 결과</CardTitle><CardDescription>하나라도 실패하면 전날 데이터를 그대로 유지합니다. 노란색 항목은 참고용 경고입니다.</CardDescription></CardHeader>
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
          <p>사유 분류는 직접 정한 단어 기준이라 식약처 공식 분류와 다를 수 있습니다. 공개 데이터로 만든 개인 포트폴리오이며, 특정 기업이나 기관과는 관련이 없습니다.</p>
        </div>
      </footer>
    </>
  );
}
