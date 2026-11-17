// 2단계: 검증 -> 정제·분류 -> 변경 감지 -> 화면용 public/data/dashboard.json 생성.
// 검증에 실패하면 파일을 쓰지 않고 종료 코드 1로 끝나, 자동 갱신 때 이전 데이터가 그대로 남습니다.
import path from 'node:path';
import {
  RAW_DIR, SEEN_FILE, OUT_FILE, MONTHS, SERVICES, PORTAL,
  readJson, writeJson, hash, normDate, clean, addMonths, addDays, todayKst,
} from './lib.mjs';

const raw = Object.fromEntries(SERVICES.map(s => [s.key, readJson(path.join(RAW_DIR, `${s.key}.json`))]));
if (!raw.recall || !raw.action) {
  console.error('data/raw/에 수집 결과가 없습니다. npm run fetch 또는 npm run sample을 먼저 실행하세요.');
  process.exit(1);
}
const sample = raw.recall.source === 'sample';
const fetchedAt = raw.recall.fetchedAt;
const today = todayKst(new Date(fetchedAt));
const endYm = today.slice(0, 7);
const months = Array.from({ length: MONTHS }, (_, i) => addMonths(endYm, i - MONTHS + 1));
const windowStart = `${months[0]}-01`;

// ── 분류 규칙: 원문 문장에서 키워드로 분류합니다. 위에서부터 먼저 걸리는 쪽으로 갑니다.
const classify = (text, rules) => rules.find(([, re]) => re.test(text))?.[0] ?? '기타';
const RECALL_RULES = [
  ['중금속·유해물질', /중금속|납|카드뮴|수은|비소|벤조피렌|독소|아플라톡신|오크라톡신|에틸렌옥사이드|MCPD|산가|과산화물가|히스타민/],
  ['미생물', /세균|대장균|살모넬라|리스테리아|포도상구균|바실루스|세레우스|노로|곰팡이|진균|효모|미생물|클로스트리|비브리오|장출혈/],
  ['잔류농약·동물용의약품', /농약|잔류|동물용\s*의약품|항생/],
  ['이물', /이물|금속|플라스틱|유리|벌레|비닐/],
  ['식품첨가물', /첨가물|보존료|소르빈산|안식향산|사카린|타르색소|이산화황|아질산/],
  ['표시·기한', /표시|알레르기|유통기한|소비기한/],
  ['무신고·무등록', /무등록|미신고|무신고|영업등록|품목제조보고/],
  ['사용 불가 원료', /허용되지\s*않는|사용할\s*수\s*없는|원료로\s*사용/],
  ['기타 기준·규격 부적합', /붕해|프로바이오틱스|함량|용출|메탄올|기준\s*규격|부적합/],
];
const ACTION_RULES = [
  ['영업소 폐쇄', /폐쇄/],
  ['허가·등록 취소', /취소/],
  ['영업정지', /영업정지/],
  ['품목(류) 제조정지', /제조정지/],
  ['과징금', /과징금/],
  ['과태료', /과태료/],
  ['시정명령', /시정/],
  ['경고', /경고/],
];
const VIOLATION_RULES = [
  ['시설 철거·멸실·휴업', /철거|멸실|폐업|휴업|소재지\s*불명|시설.{0,10}없|제27조\s*3항/],
  ['처분 명령 미이행', /미이행/],
  ['유흥접객', /유흥접객/],
  ['자가품질검사', /자가품질/],
  ['위생교육·건강진단', /위생교육|건강진단/],
  ['청소년 주류 제공', /청소년/],
  ['표시·광고', /표시|광고|내용량/],
  ['기한 경과·보관 기준', /유통기한|소비기한|경과|보관\s*기준|보존\s*기준|보관.{0,6}위반/],
  ['이물·위생 취급', /이물|위생적|청결|위생상태|쥐|바퀴/],
  ['기준·규격 부적합', /기준|규격|부적합/],
  ['신고·보고 위반', /신고|등록|보고|변경/],
];
// API가 빈 값 대신 '데이터없음', '-' 같은 글자를 넣는 경우가 있어 비웁니다
const noData = s => { const v = clean(s); return !v || /^(-|없음|데이터\s*없음|해당\s*없음)$/.test(v) ? null : v; };
const gradeOf = s => { const m = String(s ?? '').match(/[123]/); return m ? `${m[0]}등급` : '미분류'; };
const regionOf = addr => {
  const t = clean(addr).split(' ')[0] ?? '';
  const map = { 서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천', 광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종', 경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주' };
  return map[t] ?? (t.slice(0, 2) || '-');
};

// ── 정제: API 필드 이름 -> 화면용 이름
const recallAll = raw.recall.rows.map(r => {
  const product = clean(r.PRDTNM), company = clean(r.BSSHNM), reason = clean(r.RTRVLPRVNS);
  return {
    id: hash([r.RTRVLDSUSE_SEQ, product, r.BRCDNO, r.CRET_DTM].join('|')),
    seq: clean(r.RTRVLDSUSE_SEQ) || null,
    date: normDate(r.CRET_DTM),
    product, company, reason,
    cat: classify(reason, RECALL_RULES),
    grade: gradeOf(r.RTRVL_GRDCD_NM),
    type: clean(r.PRDLST_CD_NM || r.PRDLST_TYPE) || '-',
    expiry: noData(r.DISTBTMLMT),
    made: noData(r.MNFDT),
    barcode: clean(r.BRCDNO) || null,
    reportNo: clean(r.PRDLST_REPORT_NO) || null,
  };
});
const actionAll = raw.action.rows.map(r => {
  const company = clean(r.PRCSCITYPOINT_BSSHNM || r.BSSH_NM), kind = clean(r.DSPS_TYPECD_NM);
  const violation = clean(r.VILTCN).replace(/^\(?\s*\d{4}[.\-]?\d{2}[.\-]?\d{2}\s*\)?\s*/, '');
  const bgn = normDate(r.DSPS_BGNDT), end = normDate(r.DSPS_ENDDT);
  return {
    id: hash([r.LCNS_NO, r.DSPS_DCSNDT, kind, r.VILTCN, company].join('|')),
    date: normDate(r.DSPS_DCSNDT),
    company, industry: clean(r.INDUTY_CD_NM) || '-',
    kind: kind || '-', kindCat: classify(kind, ACTION_RULES),
    violation, vCat: classify(violation, VIOLATION_RULES),
    law: clean(r.LAWORD_CD_NM) || null,
    period: bgn && end ? `${bgn} ~ ${end}` : null,
    region: regionOf(r.ADDR),
    licenseNo: clean(r.LCNS_NO) || null,
  };
});

// ── 검증
const errors = [], warnings = [], checks = [];
const check = (name, ok, detail, hard = true) => { checks.push({ name, ok, detail, hard }); if (!ok) (hard ? errors : warnings).push(`${name}: ${detail}`); };
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const old = readJson(OUT_FILE);
for (const [key, rows, label] of [['recall', recallAll, '회수·판매중지'], ['action', actionAll, '행정처분']]) {
  const total = raw[key].total;
  check(`${label} 수신 건수`, rows.length > 0 && rows.length >= total * 0.99, `${rows.length.toLocaleString()} / 전체 ${total.toLocaleString()}건`);
  const dated = rows.filter(r => r.date).length;
  check(`${label} 날짜 형식`, pct(dated, rows.length) >= 95, `${pct(dated, rows.length)}% 정상`);
  const named = rows.filter(r => r.company && (key === 'action' || r.product)).length;
  check(`${label} 업체·제품명`, pct(named, rows.length) >= 95, `${pct(named, rows.length)}% 채워짐`);
  const prevTotal = old?.meta?.source === raw[key].source ? old?.meta?.totals?.[key] : null;
  if (prevTotal) check(`${label} 전일 대비`, rows.length >= prevTotal * 0.8, `이전 ${prevTotal.toLocaleString()}건 → ${rows.length.toLocaleString()}건`);
  const latest = rows.map(r => r.date).filter(Boolean).sort().at(-1);
  if (!sample) check(`${label} 최신성`, latest && latest >= addDays(today, -45), `최근 등록일 ${latest}`, false);
  const dup = rows.length - new Set(rows.map(r => r.id)).size;
  check(`${label} 중복`, dup === 0, dup ? `같은 행 ${dup}건 (하나만 남김)` : '없음', false);
}
for (const c of checks) console.log(`${c.ok ? '✓' : c.hard ? '✗' : '⚠'} ${c.name} · ${c.detail}`);
if (errors.length) { console.error(`\n검증 실패 ${errors.length}건. dashboard.json을 바꾸지 않습니다.`); process.exit(1); }

// ── 기간 필터 + 중복 제거 + 최신순
const dedupe = rows => [...new Map(rows.map(r => [r.id, r])).values()];
const byDateDesc = (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id);
const recall = dedupe(recallAll).filter(r => r.date && r.date >= windowStart && r.date <= today).sort(byDateDesc);
const action = dedupe(actionAll).filter(r => r.date && r.date >= windowStart && r.date <= today).sort(byDateDesc);

// ── 변경 감지: 처음 본 날짜를 data/state/seen.json에 기록
// 처음 실행(기준선)에는 이미 있던 항목을 '신규'로 세지 않습니다.
let state = readJson(SEEN_FILE);
if (sample || state?.source !== raw.recall.source) state = null;
const baseline = !state;
const seen = { recall: {}, action: {} };
const found = { recall: 0, action: 0 };
for (const [key, rows] of [['recall', recall], ['action', action]]) {
  for (const r of rows) {
    const prev = state?.seen?.[key]?.[r.id];
    if (prev) seen[key][r.id] = prev;
    else if (sample) seen[key][r.id] = r.date;            // 샘플: 등록일에 감지됐다고 가정
    else if (baseline) seen[key][r.id] = 'base';
    else { seen[key][r.id] = today; found[key]++; }
    r.firstSeen = seen[key][r.id] === 'base' ? null : seen[key][r.id];
  }
}
let log = state?.log ?? [];
if (sample) {
  // 샘플: 최근 30일 동안 매일 감지된 것처럼 기록을 만듭니다
  log = Array.from({ length: 30 }, (_, i) => addDays(today, -i)).map(d => ({
    date: d, recall: recall.filter(r => r.date === d).length, action: action.filter(r => r.date === d).length,
  })).filter(x => x.recall + x.action > 0);
} else if (found.recall + found.action > 0) {
  log = [{ date: today, ...found }, ...log.filter(x => x.date !== today)].slice(0, 60);
}
const newState = { source: raw.recall.source, baselineAt: state?.baselineAt ?? today, log, seen };

// ── 집계
const count = (rows, f) => { const m = new Map(); for (const r of rows) m.set(f(r), (m.get(f(r)) ?? 0) + 1); return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n); };
const inRange = (rows, from, to) => rows.filter(r => r.date > from && r.date <= to);
const d30 = addDays(today, -30), d60 = addDays(today, -60), d7 = addDays(today, -7);
const recent7 = rows => rows.filter(r => r.firstSeen && r.firstSeen > d7).length;
// 폐업한 업소를 서류상 정리하는 폐쇄(시설 철거·멸실·장기 휴업)는 위반에 따른 처분과 성격이 달라 따로 셉니다
const CLOSURE = '시설 철거·멸실·휴업';
const isClosure = r => r.vCat === CLOSURE;
const real = action.filter(r => !isClosure(r)), closed = action.filter(isClosure);
const r30 = inRange(recall, d30, today), a30 = inRange(real, d30, today);

// 오늘의 메일: 오늘 처음 확인된 건. 없으면 가장 최근 등록일의 건으로 미리보기를 채웁니다.
const MAIL_MAX = 8;
const pickMail = (rows, basis) => {
  if (basis === 'new') return { date: today, rows: rows.filter(r => r.firstSeen === today) };
  const date = rows[0]?.date ?? null;
  return { date, rows: rows.filter(r => r.date === date) };
};
const newCount = [recall, real].reduce((n, rows) => n + rows.filter(r => r.firstSeen === today).length, 0);
const basis = newCount > 0 ? 'new' : 'latest';
const mR = pickMail(recall, basis), mA = pickMail(real, basis);
const slimR = r => ({ id: r.id, date: r.date, product: r.product, company: r.company, reason: r.reason, grade: r.grade, seq: r.seq });
const slimA = r => ({ id: r.id, date: r.date, company: r.company, industry: r.industry, kind: r.kind, violation: r.violation.length > 90 ? `${r.violation.slice(0, 90)}…` : r.violation, region: r.region, licenseNo: r.licenseNo });
const mail = {
  basis, today,
  recall: { date: mR.date, total: mR.rows.length, rows: [...mR.rows].sort((a, b) => a.grade.localeCompare(b.grade)).slice(0, MAIL_MAX).map(slimR) },
  action: { date: mA.date, total: mA.rows.length, rows: [...mA.rows].sort((a, b) => /정지/.test(b.kindCat) - /정지/.test(a.kindCat)).slice(0, MAIL_MAX).map(slimA) },
  closed: basis === 'new' ? closed.filter(r => r.firstSeen === today).length : closed.filter(r => r.date === mA.date).length,
};

const D = {
  meta: {
    source: raw.recall.source, fetchedAt, asOf: today,
    window: `${months[0].replace('-', '.')} ~ ${months.at(-1).replace('-', '.')}`,
    totals: { recall: raw.recall.total, action: raw.action.total },
    inWindow: { recall: recall.length, action: real.length, closed: closed.length, actionAll: action.length },
    services: SERVICES.map(({ key, svc, label, infoUrl }) => ({ key, svc, label, infoUrl })),
    portal: PORTAL, baselineAt: newState.baselineAt,
    checks, warnings,
  },
  kpis: {
    recall30: r30.length, recall30Prev: inRange(recall, d60, d30).length,
    action30: a30.length, action30Prev: inRange(real, d60, d30).length,
    closed30: inRange(closed, d30, today).length,
    grade1_30: r30.filter(r => r.grade === '1등급').length,
    stop30: a30.filter(r => /정지/.test(r.kindCat)).length,
    new7: { recall: recent7(recall), action: recent7(real) },
  },
  monthly: months.map(m => ({ m, recall: recall.filter(r => r.date.startsWith(m)).length, action: real.filter(r => r.date.startsWith(m)).length, closed: closed.filter(r => r.date.startsWith(m)).length })),
  recallReasons: count(recall, r => r.cat),
  recallGrades: count(recall, r => r.grade),
  actionKinds: count(real, r => r.kindCat),
  violations: count(real, r => r.vCat),
  closedKinds: count(closed, r => r.kindCat),
  mail,
  changes: log.slice(0, 14),
  recent: { recall: recall.slice(0, 60), action: real.slice(0, 120) },
};

// 수집 시각만 다르고 내용이 같으면 파일을 그대로 둡니다 (바뀐 날에만 커밋·재배포)
const strip = x => JSON.stringify({ ...x, meta: { ...x.meta, fetchedAt: null } });
if (!sample) writeJson(SEEN_FILE, newState, 0);
if (old && strip(old) === strip(D)) {
  console.log(`\n변경 없음 (dashboard.json 유지)`);
  process.exit(0);
}
writeJson(OUT_FILE, D);
console.log(`\n저장: ${OUT_FILE}`);
console.log(`기간 ${D.meta.window} · 회수 ${recall.length}건 · 행정처분 ${real.length}건(폐업 정리 ${closed.length}건 별도) · 신규 감지 회수 ${found.recall}건 / 처분 ${found.action}건${baseline && !sample ? ' (기준선 생성)' : ''}${sample ? ' · ⚠ 가상 샘플 데이터' : ''}`);
