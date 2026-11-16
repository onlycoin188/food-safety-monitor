// 공통 설정과 도구 함수 (Node 내장 기능만 사용)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RAW_DIR = path.join(ROOT, 'data/raw');          // 원본 응답 (git 제외)
export const SEEN_FILE = path.join(ROOT, 'data/state/seen.json'); // 처음 본 날짜 기록 (변경 감지용, 커밋함)
export const OUT_FILE = path.join(ROOT, 'public/data/dashboard.json');

// 화면에 보여줄 기간 (개월)
export const MONTHS = 12;

// 식품안전나라 Open API: http://openapi.foodsafetykorea.go.kr/api/{인증키}/{서비스ID}/json/{시작}/{끝}
// 한 번에 최대 1,000건까지 받을 수 있습니다.
export const API_BASE = 'http://openapi.foodsafetykorea.go.kr/api';
export const PAGE = 1000;
const info = svc => `https://www.foodsafetykorea.go.kr/api/openApiInfo.do?menu_grp=MENU_GRP31&menu_no=661&show_cnt=10&start_idx=1&svc_no=${svc}&svc_type_cd=API_TYPE06`;
export const SERVICES = [
  { key: 'recall', svc: 'I0490', label: '회수·판매중지', infoUrl: info('I0490') },
  { key: 'action', svc: 'I0470', label: '행정처분', infoUrl: info('I0470') },
];
export const PORTAL = 'https://www.foodsafetykorea.go.kr/';

export function loadEnv() {
  const p = path.join(ROOT, '.env');
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return process.env;
}

export function readJson(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
export function writeJson(p, data, pretty = 1) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, pretty) + '\n');
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

// '2026-11-03 10:20:11', '20261103', '2026.11.03' -> '2026-11-03' (못 읽으면 null)
export function normDate(s) {
  const d = String(s ?? '').replace(/\D/g, '').slice(0, 8);
  if (d.length !== 8) return null;
  const out = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return Number.isNaN(Date.parse(out)) ? null : out;
}
export const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
export const addMonths = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
export const addDays = (ymd, n) => new Date(Date.parse(ymd) + n * 864e5).toISOString().slice(0, 10);
// 한국 시간 기준 오늘
export const todayKst = (d = new Date()) => new Date(d.getTime() + 9 * 36e5).toISOString().slice(0, 10);

export async function getJson(url, label, tries = 3) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
      console.warn(`${label} 요청 실패 (${i}/${tries}): ${e.message}`);
      if (i < tries) await sleep(3000 * i);
    }
  }
  throw last;
}

// 키가 경로에 들어가므로 로그에는 가린 주소만 남깁니다
export const mask = (url, key) => url.split(key).join('***');
