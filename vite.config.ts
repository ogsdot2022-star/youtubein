import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // --- 빌드 설정 추가 시작 ---
      base: './', // 상대 경로로 빌드하여 파일 경로 에러 방지
      build: {
        sourcemap: false, // eval을 사용할 수 있는 소스맵 비활성화
        minify: 'terser', // 더 깨끗한 코드 압축 (선택 사항)
      },
      // --- 빌드 설정 추가 끝 ---
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
