// aptgame.kr 전체(첫 화면 + 부동산 공화국 + 재건축 조합장 키우기 + 안내 페이지)를 토스 미니앱용으로 stage/ 에 복사합니다.
import fs from 'node:fs'; import path from 'node:path';
const pub = path.resolve('../public'), out = path.resolve('stage'), API = 'https://aptgame.kr/';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(pub, 'assets'), path.join(out, 'assets'), { recursive: true });
fs.cpSync(path.join(pub, 'johapjang', 'img'), path.join(out, 'johapjang', 'img'), { recursive: true });
fs.copyFileSync(path.join(pub, 'page.css'), path.join(out, 'page.css'));
const PAGES = { 'index.html': 'index.html', 'game.html': 'bluemarble.html', 'johapjang/index.html': 'johapjang/index.html',
  'guide.html': 'guide.html', 'apartments.html': 'apartments.html', 'glossary.html': 'glossary.html', 'about.html': 'about.html', 'privacy.html': 'privacy.html' };
for (const [src, dst] of Object.entries(PAGES)) {
  let h = fs.readFileSync(path.join(pub, src), 'utf8');
  const up = dst.includes('/') ? '../' : '';
  // 애드센스 제거 (토스에서는 토스 광고 사용)
  h = h.replace(/<script[^>]*googlesyndication[^>]*><\/script>/g, '')
       .replace(/<div class="adbox">[\s\S]*?<\/div>/g, '')
       .replace(/<ins class="adsbygoogle"[\s\S]*?<\/ins>\s*(<script>\s*\(adsbygoogle[\s\S]*?<\/script>)?/g, '');
  // 사이트 내부 절대경로 → 번들 안 상대경로
  h = h.replace(/(href|src)="\/bluemarble"/g, `$1="${up}bluemarble.html"`)
       .replace(/(href|src)="\/johapjang\/?"/g, `$1="${up}johapjang/index.html"`)
       .replace(/(href)="\/"/g, `$1="${up}index.html"`)
       .replace(/(href|src)="\/(?!\/)/g, `$1="${up}`)
       .replace(/url\(\/assets/g, `url(${up}assets`)
       .replace(/https:\/\/aptgame\.kr\/(bluemarble)?"/g, `${up}index.html"`);
  if (src === 'game.html') {
    // 온라인 대전·랭킹 API는 aptgame.kr 서버로
    h = h.replace(/fetch\('api\//g, `fetch('${API}api/`).replace(/new EventSource\('events/g, `new EventSource('${API}events`)
         .replace('.then(c => initAds(c.ads))', '.then(c => void c)');
  }
  h = h.replace('</body>', `<script src="${up}toss-bridge.js"></script>\n</body>`);
  fs.mkdirSync(path.dirname(path.join(out, dst)), { recursive: true });
  fs.writeFileSync(path.join(out, dst), h);
}
console.log('prep done:', Object.values(PAGES).join(', '));
