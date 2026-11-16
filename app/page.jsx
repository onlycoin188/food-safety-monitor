import D from '@/public/data/dashboard.json';
import Dashboard from '@/components/Dashboard';

// 빌드 시점에 dashboard.json을 읽어 정적 HTML로 굽습니다 (방문 시 API 호출 없음)
export default function Page() {
  return <Dashboard D={D} />;
}
