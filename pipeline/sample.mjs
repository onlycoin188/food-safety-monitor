// 화면 확인용 가상 샘플 데이터. 실제 API 응답과 같은 필드 이름으로 data/raw/에 씁니다.
// 업체명은 모두 "샘플" 표기의 가상 이름입니다. 배포하지 마세요 (화면에 노란 배너가 뜹니다).
import path from 'node:path';
import { RAW_DIR, writeJson, addDays, todayKst } from './lib.mjs';

let seed = 20261116;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)];
const weighted = pairs => { let x = rnd() * pairs.reduce((s, [, w]) => s + w, 0); for (const [v, w] of pairs) if ((x -= w) < 0) return v; return pairs[0][0]; };
const ymd = d => d.replace(/-/g, '');
const fetchedAt = new Date().toISOString();
const today = todayKst();
const DAYS = 430;

const PRODUCTS = [['냉동만두', '만두류'], ['고춧가루', '고춧가루'], ['참기름', '참기름'], ['떡볶이떡', '떡류'], ['어묵', '어육가공품'], ['김치', '배추김치'], ['두부', '두부'], ['과채주스', '과·채주스'], ['그래놀라', '시리얼류'], ['훈제오리', '식육가공품'], ['건고사리', '건조 채소'], ['수제쿠키', '과자'], ['젓갈', '젓갈'], ['곤약젤리', '젤리'], ['냉면육수', '소스']];
const REASONS = [
  ['대장균군 기준 규격 부적합', 8], ['세균수 기준 규격 부적합', 7], ['금속성 이물 검출', 5], ['잔류농약(클로르피리포스) 기준 초과', 5],
  ['알레르기 유발물질(땅콩) 표시 누락', 4], ['소비기한 표시 오기', 3], ['곰팡이 기준 부적합', 3], ['타르색소 사용기준 위반', 2],
  ['납 기준 초과', 2], ['무등록 영업자 제조 제품', 2], ['산가 기준 부적합', 2], ['리스테리아 모노사이토제네스 검출', 1],
];
const recallRows = [];
for (let i = 0; i < DAYS; i++) {
  const d = addDays(today, -i);
  const dow = new Date(d).getUTCDay();
  const n = dow === 0 || dow === 6 ? 0 : weighted([[0, 3], [1, 4], [2, 2], [3, 1]]) + (i % 97 < 6 ? 2 : 0);
  for (let k = 0; k < n; k++) {
    const [p, t] = pick(PRODUCTS);
    recallRows.push({
      RTRVLDSUSE_SEQ: String(2026000000 - i * 10 - k), PRDTNM: `${p} (샘플)`, BSSHNM: `샘플식품 ${String(1 + Math.floor(rnd() * 60)).padStart(2, '0')}`,
      RTRVLPRVNS: weighted(REASONS), RTRVL_GRDCD_NM: weighted([['1등급', 15], ['2등급', 45], ['3등급', 40]]),
      PRDLST_CD_NM: t, PRDLST_TYPE: t, CRET_DTM: `${d} ${String(9 + k).padStart(2, '0')}:30:00`,
      DISTBTMLMT: `${ymd(addDays(d, 120))}`, MNFDT: ymd(addDays(d, -20)), BRCDNO: `880000${String(Math.floor(rnd() * 1e7)).padStart(7, '0')}`,
      PRDLST_REPORT_NO: `2026000${Math.floor(rnd() * 1e6)}`,
    });
  }
}

const KINDS = [['영업정지', 22], ['품목제조정지', 8], ['과태료부과', 34], ['시정명령', 20], ['과징금부과', 8], ['경고', 6], ['영업소폐쇄', 2]];
const INDUSTRIES = [['일반음식점', 40], ['휴게음식점', 18], ['식품제조가공업', 16], ['즉석판매제조가공업', 12], ['식품소분업', 5], ['유흥주점영업', 5], ['집단급식소', 4]];
const VIOL = [
  ['위생교육 미이수', '식품위생법 제41조', 20], ['건강진단 미실시', '식품위생법 제40조', 10], ['청소년 주류 제공', '식품위생법 제44조', 9],
  ['소비기한 경과 제품 조리 목적 보관', '식품위생법 제44조', 14], ['자가품질검사 미실시', '식품위생법 제31조', 8], ['제품 표시사항 위반', '식품 등의 표시·광고에 관한 법률 제4조', 7],
  ['기준 및 규격 위반(세균수)', '식품위생법 제7조', 7], ['품목제조보고 미이행', '식품위생법 제37조', 5], ['냉동 보관기준 위반', '식품위생법 제7조', 6],
  ['조리장 위생적 취급기준 위반', '식품위생법 제3조', 9], ['영업장 면적 변경신고 미이행', '식품위생법 제37조', 5],
];
const SIDO = ['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시', '경상남도', '충청남도', '전라북도', '강원특별자치도'];
const actionRows = [];
for (let i = 0; i < DAYS; i++) {
  const d = addDays(today, -i);
  const dow = new Date(d).getUTCDay();
  const n = dow === 0 || dow === 6 ? 0 : Math.floor(rnd() * 9) + (i % 60 < 8 ? 3 : 0);
  for (let k = 0; k < n; k++) {
    // 실제 데이터처럼 절반 이상은 폐업 업소를 정리하는 폐쇄 처분으로 둡니다
    const shut = rnd() < 0.6;
    const kind = shut ? '영업소폐쇄' : weighted(KINDS);
    const [v, law] = shut ? ['영업시설의 전부를 철거함', '식품위생법 제37조'] : weighted(VIOL.map(([a, b, w]) => [[a, b], w]));
    const vdate = addDays(d, -20 - Math.floor(rnd() * 40));
    const stop = /정지/.test(kind);
    actionRows.push({
      PRCSCITYPOINT_BSSHNM: `샘플업소 ${String(1 + Math.floor(rnd() * 300)).padStart(3, '0')}`, INDUTY_CD_NM: weighted(INDUSTRIES),
      LCNS_NO: `2026${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}`, DSPS_DCSNDT: ymd(d), DSPS_TYPECD_NM: kind,
      DSPS_BGNDT: stop ? ymd(addDays(d, 7)) : '', DSPS_ENDDT: stop ? ymd(addDays(d, 13)) : '',
      VILTCN: `(${ymd(vdate)}) ${v}`, LAWORD_CD_NM: law, ADDR: `${pick(SIDO)} 샘플구 샘플로 ${1 + Math.floor(rnd() * 200)}`,
    });
  }
}

writeJson(path.join(RAW_DIR, 'recall.json'), { source: 'sample', svc: 'I0490', fetchedAt, total: recallRows.length, rows: recallRows }, 0);
writeJson(path.join(RAW_DIR, 'action.json'), { source: 'sample', svc: 'I0470', fetchedAt, total: actionRows.length, rows: actionRows }, 0);
console.log(`샘플 생성: 회수 ${recallRows.length}건 · 행정처분 ${actionRows.length}건 (가상 데이터)`);
