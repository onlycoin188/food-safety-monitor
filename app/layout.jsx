import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata = {
  title: '식품 회수·행정처분 모니터',
  description: '식품안전나라 Open API의 회수·판매중지(I0490)와 행정처분(I0470) 정보를 매일 자동으로 수집하고, 새로 올라온 항목을 표시합니다. 공개 데이터 기반 개인 포트폴리오입니다.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23dc2626'/%3E%3Cpath d='M16 7l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10v-5z' fill='none' stroke='white' stroke-width='2.2' stroke-linejoin='round'/%3E%3Cpath d='M12.5 16l2.4 2.4 4.6-4.8' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8fafc' };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 font-sans text-[16px] leading-relaxed text-slate-900">{children}</body>
    </html>
  );
}
