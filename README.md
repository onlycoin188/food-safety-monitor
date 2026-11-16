# 식품 회수·행정처분 모니터 (포트폴리오)

식품안전나라 Open API의 회수·판매중지(I0490)와 행정처분(I0470) 정보를 매일 자동으로 받아,
검증을 거친 뒤 새로 올라온 항목을 표시해 보여주는 Next.js 정적 페이지입니다.
화면은 빌드 시점의 `public/data/dashboard.json`만 쓰기 때문에 방문자가 열 때 API를 호출하지 않습니다.

```
pipeline/fetch.mjs      1. 두 API 전체 수집 -> data/raw/ (git 제외)
pipeline/aggregate.mjs  2. 검증 -> 정제·분류 -> 변경 감지 -> public/data/dashboard.json
                           (검증 실패 시 파일을 바꾸지 않음, 처음 본 날짜는 data/state/seen.json에 기록)
pipeline/sample.mjs     화면 확인용 가상 데이터
.github/workflows/      매일 09:00(KST) 자동 실행, 내용이 바뀐 날에만 커밋 -> Vercel 자동 배포
app/, components/       Next.js (output: 'export') + Tailwind CSS, shadcn/ui 방식 컴포넌트, Lucide 아이콘
```

## 0. 준비물
- Node.js 20 이상
- 식품안전나라 Open API 인증키: https://www.foodsafetykorea.go.kr/api/ 회원가입 → 인증키 신청
  (회수·판매중지 I0490, 행정처분 I0470 두 서비스 모두 같은 키로 호출)

## 1. GitHub Actions로 자동 갱신 (권장)
1. 저장소 Settings → Secrets and variables → Actions에 `FOODSAFETY_API_KEY` 등록
2. Actions → "데이터 자동 갱신" → Run workflow
3. 첫 실행은 기준선을 만듭니다. 이미 올라와 있던 항목은 신규로 세지 않고, 다음 실행부터 새 항목만 신규로 표시합니다.

## 2. 로컬에서 실행
```bash
cp .env.example .env        # 윈도우: copy
npm install
npm run data                # 수집 -> 검증 -> 집계
npm run dev                 # http://localhost:3000
npm run sample              # 화면 확인용 가상 데이터 (노란 배너 표시)
```

## 3. Vercel 배포
vercel.com → Add New → Project → 이 저장소 선택 → Framework: **Next.js** (자동 인식) → Deploy.
API 키는 Vercel에 넣을 필요가 없습니다.

## 참고
- 인증키가 요청 주소 경로에 들어가므로 로그에는 키를 가린 주소만 남깁니다.
- 회수 사유·위반 내용 분류는 `pipeline/aggregate.mjs`의 키워드 규칙에 따른 참고용이며 공식 분류가 아닙니다.
- 공개 데이터 기반 개인 포트폴리오이며, 특정 기업이나 기관의 공식 자료가 아닙니다.
