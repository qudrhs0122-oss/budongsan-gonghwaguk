// 토스 미니앱 번들: '재건축 조합장 키우기' 단독 (부동산 공화국/부루마블은 웹보드 게임으로 분류되므로 넣지 않음)
// public/johapjang 을 stage/ 루트에 복사합니다. 첫 화면 = 조합장 키우기.
import fs from 'node:fs'; import path from 'node:path';
const src = path.resolve('../public/johapjang'), out = path.resolve('stage');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(src, 'img'), path.join(out, 'img'), { recursive: true });
let h = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
// 원스토어 H5 SDK 제거 (토스에서는 불필요)
h = h.replace(/<script type="module">(?:(?!<\/script>)[\s\S])*?onestore-h5-sdk[\s\S]*?<\/script>\s*/, '');
// 애드센스 설정 조회 제거 (토스에서는 토스 광고 브리지 사용)
h = h.replace('fetch("/api/config",{cache:"no-store"})', 'Promise.resolve(null)');
// 통계는 aptgame.kr 서버로
h = h.replace('sendBeacon("/api/stat"', 'sendBeacon("https://aptgame.kr/api/stat"');
// PWA 서비스워커·매니페스트 제거 (토스 웹뷰에서는 불필요)
h = h.replace(/<script>if\("serviceWorker"[\s\S]*?<\/script>\s*/, '').replace(/<link rel="manifest"[^>]*>\s*/, '');
// 사이트 링크(부동산 공화국 등) 제거 → 미니앱 밖으로 나가지 않도록
h = h.replace(/href="\/(bluemarble)?"/g, 'href="#"').replace(/href="https:\/\/aptgame\.kr\/?(bluemarble)?"/g, 'href="#"');
h = h.replace('</body>', '<script src="toss-bridge.js"></script>\n</body>');
fs.writeFileSync(path.join(out, 'index.html'), h);
if (/bluemarble|부동산 공화국/.test(h)) console.warn('주의: 부동산 공화국 관련 문자열이 남아 있습니다');
console.log('prep done: 조합장 키우기 단독', (h.length / 1024).toFixed(0) + 'KB');
