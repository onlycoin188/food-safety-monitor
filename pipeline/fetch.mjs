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
  if (!body || (code && code !== 'INFO-000')) {
    throw new Error(`${s.label} 응답 오류: ${body?.RESULT?.CODE ?? ''} ${body?.RESULT?.MSG ?? JSON.stringify(first).slice(0, 200)}`);
  }
  const total = Number(body.total_count);
  const rows = [];
  for (let a = 1; a <= total; a += PAGE) {
    const b = Math.min(a + PAGE - 1, total);
    const j = await getJson(url(a, b), `${s.label} ${a}~${b}`);
    rows.push(...(j?.[s.svc]?.row ?? []));
    await sleep(300); // 서버 부담을 줄이려고 잠깐 쉬어 갑니다
  }
  writeJson(path.join(RAW_DIR, `${s.key}.json`), { source: 'api', svc: s.svc, fetchedAt, total, rows }, 0);
  console.log(`${s.label} (${s.svc}): 전체 ${total}건 중 ${rows.length}건 수신 · ${mask(url(1, 1), KEY)}`);
}
