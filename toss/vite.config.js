// 토스 광고 브리지(toss-bridge.js)만 번들링하고, 정적 게임 파일은 prep.mjs 가 dist 에 그대로 복사합니다.
import { defineConfig } from 'vite';
export default defineConfig({
  publicDir: 'stage',
  build: {
    outDir: 'dist', emptyOutDir: true, copyPublicDir: true,
    lib: { entry: 'src/toss-bridge.js', name: 'TossBridge', formats: ['iife'], fileName: () => 'toss-bridge.js' },
  },
});
