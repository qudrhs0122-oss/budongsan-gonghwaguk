import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'johapjang', // 앱인토스 콘솔에 등록한 앱 이름(영문 ID)과 같아야 합니다
  brand: { primaryColor: '#D9A43A' },
  webView: {},
  permissions: [],
  webBundleDir: 'dist',
});
