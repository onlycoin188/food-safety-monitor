// 1단계: 식품안전나라 Open API에서 회수·판매중지(I0490), 행정처분(I0470) 전체를 받아 data/raw/에 저장합니다.
import path from 'node:path';
import { loadEnv, SERVICES, API_BASE, PAGE, RAW_DIR, writeJson, getJson, mask, sleep } from './lib.mjs';

const env = loadEnv();
const KEY = env.FOODSAFETY_API_KEY?.trim();
if (!KEY) {
  console.error('FOODSAFETY_API_KEY가 없습니다. .env 또는 GitHub Secrets를 확인하세요 (README 참고).');
  process.exit(1);
}

const fetchedAt = new Date().toISOString();
for (const s of SERVICES) {
  const url = (a, b) => `${API_BASE}/${KEY}/${s.svc}/json/${a}/${b}`;
  const first = await getJson(url(1, 1), `${s.label} 건수 확인`);
  const body = first?.[s.svc];
  const code = body?.RESULT?.CODE;
  // INFO-100(인증키 오류), INFO-110(활용신청 없음) 같은 키 문제는 다시 시도해도 같으므로 바로 끝냅니다 (종료 코드 2)
  if (/^INFO-1\d\d$/.test(code ?? '')) {
    console.error(`${s.label}(${s.svc}) 인증 오류: ${code} ${body?.RESULT?.MSG ?? ''}`);
    console.error(`식품안전나라 Open API에서 ${s.svc} 서비스 활용신청 여부를 확인하세요.`);
    process.exit(2);
  }
  if (!body || (code && code !== 'INFO-000')) {
    throw new Error(`${s.label} 응답 오류: ${body?.RESULT?.CODE ?? ''} ${body?.RESULT?.MSG ?? JSON.stringify(first).slice(0, 200)}`);
  }
  const total = Number(body.total_count);
  // 페이지를 나눠 받는 사이에 서버 쪽 정렬이 바뀌면 같은 행이 두 번 오고 다른 행이 빠질 수 있습니다.
  // 그래서 중복이 보이면 처음부터 다시 받아 합칩니다 (최대 3회).
  const all = new Map();
  for (let pass = 1; pass <= 3; pass++) {
    const rows = [];
    for (let a = 1; a <= total; a += PAGE) {
      const b = Math.min(a + PAGE - 1, total);
      const j = await getJson(url(a, b), `${s.label} ${a}~${b}`);
      rows.push(...(j?.[s.svc]?.row ?? []));
      await sleep(300); // 서버 부담을 줄이려고 잠깐 쉬어 갑니다
    }
    const before = all.size;
    for (const r of rows) all.set(JSON.stringify(r), r);
    const dup = rows.length - new Set(rows.map(r => JSON.stringify(r))).size;
    console.log(`${s.label} ${pass}회차: ${rows.length}건 수신, 같은 행 ${dup}건, 새로 합쳐진 행 ${all.size - before}건`);
    if (dup === 0 || (pass > 1 && all.size === before)) break;
  }
  const rows = [...all.values()];
  writeJson(path.join(RAW_DIR, `${s.key}.json`), { source: 'api', svc: s.svc, fetchedAt, total, rows }, 0);
  console.log(`${s.label} (${s.svc}): 전체 ${total}건 / 합친 결과 ${rows.length}건 · ${mask(url(1, 1), KEY)}`);
}
