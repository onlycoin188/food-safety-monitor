'use client';
import { useState } from 'react';
import { Mail, Copy, Check, Paperclip } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, fmt, dot } from '@/lib/utils';

const md = d => (d ? `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일` : '-');
const gradeVariant = g => (g === '1등급' ? 'danger' : g === '2등급' ? 'warn' : 'secondary');

// 담당자가 매일 아침 받아 볼 메일을 화면에서 미리 보여 줍니다 (실제 발송은 하지 않음)
export default function MailPreview({ mail, portal }) {
  const [copied, setCopied] = useState(false);
  const { recall: R, action: A, basis } = mail;
  const isNew = basis === 'new';
  const subject = isNew
    ? `[식품안전 알림] ${md(mail.today)} 신규 회수 ${R.total}건 · 행정처분 ${A.total}건`
    : `[식품안전 알림] ${md(mail.today)} 신규 등록 없음 (최근 등록 건 안내)`;

  const text = [
    `제목: ${subject}`, '',
    '안녕하세요.',
    isNew ? `${md(mail.today)} 식품안전나라에 새로 올라온 회수·행정처분을 정리해 보내 드립니다.`
      : `${md(mail.today)}에는 새로 올라온 건이 없어, 가장 최근 등록된 건을 정리해 보내 드립니다.`, '',
    `■ 회수·판매중지 ${R.total}건${isNew ? '' : ` (등록일 ${dot(R.date)})`}`,
    ...R.rows.map(r => `- [${r.grade}] ${r.product} / ${r.company} / ${r.reason}`),
    ...(R.total > R.rows.length ? [`- 외 ${R.total - R.rows.length}건`] : []), '',
    `■ 행정처분 ${A.total}건${isNew ? '' : ` (확정일 ${dot(A.date)})`}`,
    ...A.rows.map(r => `- [${r.kind}] ${r.company}(${r.industry}) / ${r.violation}`),
    ...(A.total > A.rows.length ? [`- 외 ${A.total - A.rows.length}건`] : []),
    ...(mail.closed ? [`※ 폐업 업소 정리성 폐쇄 ${mail.closed}건은 목록에서 뺐습니다.`] : []), '',
    `원문: ${portal}`,
  ].join('\n');

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <Card className="overflow-hidden">
      {/* 메일 머리 */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[16px] font-semibold text-slate-900"><Mail className="size-4 shrink-0 text-red-600" aria-hidden /><span className="min-w-0">{subject}</span></div>
            <dl className="mt-2 grid gap-0.5 text-[13.5px] text-slate-600">
              <div className="flex gap-2"><dt className="w-14 shrink-0 text-slate-500">보낸 사람</dt><dd>식품안전 모니터 봇</dd></div>
              <div className="flex gap-2"><dt className="w-14 shrink-0 text-slate-500">받는 사람</dt><dd>품질·식품안전 담당자</dd></div>
              <div className="flex gap-2"><dt className="w-14 shrink-0 text-slate-500">보낸 시각</dt><dd className="tabular-nums">{dot(mail.today)} 09:00</dd></div>
            </dl>
          </div>
          <button type="button" onClick={copy} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-xs hover:bg-slate-50">
            {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}{copied ? '복사됨' : '본문 복사'}
          </button>
        </div>
      </div>

      {/* 메일 본문 */}
      <div className="space-y-5 px-5 py-5 text-[15px] text-slate-800">
        <p>
          안녕하세요.<br />
          {isNew
            ? <>{md(mail.today)} 식품안전나라에 새로 올라온 회수·행정처분을 정리해 보내 드립니다.</>
            : <>{md(mail.today)}에는 새로 올라온 건이 없어, 가장 최근 등록된 건을 정리해 보내 드립니다.</>}
        </p>

        <MailBlock title="회수·판매중지" total={R.total} date={isNew ? null : `등록일 ${dot(R.date)}`} dot="bg-recall" more={R.total - R.rows.length}>
          {R.rows.map(r => (
            <li key={r.id} className="flex gap-2.5 py-2">
              <Badge variant={gradeVariant(r.grade)} className="mt-0.5 shrink-0 self-start">{r.grade}</Badge>
              <div className="min-w-0"><b className="font-semibold">{r.product}</b><span className="text-slate-500"> · {r.company}</span><div className="text-[14px] text-slate-600">{r.reason}</div></div>
            </li>
          ))}
        </MailBlock>

        <MailBlock title="행정처분" total={A.total} date={isNew ? null : `확정일 ${dot(A.date)}`} dot="bg-action" more={A.total - A.rows.length}>
          {A.rows.map(r => (
            <li key={r.id} className="flex gap-2.5 py-2">
              <Badge variant={/정지|취소/.test(r.kind) ? 'danger' : 'secondary'} className="mt-0.5 shrink-0 self-start">{r.kind}</Badge>
              <div className="min-w-0"><b className="font-semibold">{r.company}</b><span className="text-slate-500"> · {r.industry} · {r.region}</span><div className="text-[14px] text-slate-600">{r.violation}</div></div>
            </li>
          ))}
        </MailBlock>

        {mail.closed > 0 && <p className="rounded-lg bg-slate-50 px-3 py-2 text-[13.5px] text-slate-600">폐업 업소를 정리하는 폐쇄 처분 <b className="tabular-nums">{fmt(mail.closed)}</b>건은 확인할 필요가 적어 목록에서 뺐습니다.</p>}

        <p className="flex items-center gap-1.5 border-t border-slate-100 pt-4 text-[13.5px] text-slate-500">
          <Paperclip className="size-3.5" aria-hidden />원문은 <a href={portal} target="_blank" rel="noreferrer" className="text-slate-700 underline underline-offset-2">식품안전나라</a>에서 등록일과 일련번호로 찾아볼 수 있습니다.
        </p>
      </div>
    </Card>
  );
}

function MailBlock({ title, total, date, dot, more, children }) {
  return (
    <section>
      <h4 className="flex items-center gap-2 border-b border-slate-200 pb-1.5 text-[15px] font-semibold">
        <span className={cn('size-2.5 rounded-sm', dot)} />{title} <span className="tabular-nums text-slate-500">{fmt(total)}건</span>
        {date && <span className="ml-auto text-[13px] font-normal tabular-nums text-slate-500">{date}</span>}
      </h4>
      {total ? <ul className="divide-y divide-slate-100">{children}</ul> : <p className="py-2 text-[14px] text-slate-500">해당하는 건이 없습니다.</p>}
      {more > 0 && <p className="pt-1 text-[13.5px] tabular-nums text-slate-500">외 {fmt(more)}건은 아래 목록에서 볼 수 있습니다.</p>}
    </section>
  );
}
