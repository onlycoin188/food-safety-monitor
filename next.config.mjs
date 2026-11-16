import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 정적 export: 빌드 시 dashboard.json을 읽어 HTML로 굽고, 방문 시 API 호출 없음
export default {
  output: 'export',
  images: { unoptimized: true },
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};
