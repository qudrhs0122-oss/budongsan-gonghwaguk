// 토스 미니앱 번들: '나의 첫 번째 서울 아파트 구하기' 단독
// public/seoul 을 stage/ 루트에 복사하고, 웹 전용 기능(카카오 로그인·애드센스·외부 링크)을 뺍니다.
import fs from 'node:fs'; import path from 'node:path';
const src = path.resolve('../public/seoul'), out = path.resolve('stage');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(src, 'img'), path.join(out, 'img'), { recursive: true });
fs.copyFileSync(path.join(src, 'ends.json'), path.join(out, 'ends.json'));
// 스토어용 스크린샷·PWA 아이콘·실제 단지 사진 자리 등 토스에 필요 없는 파일 제외
for (const f of fs.readdirSync(path.join(out, 'img'))) if (/^(shot\d|icon-|setup_top\.webp$)/.test(f)) fs.rmSync(path.join(out, 'img', f), { force: true });
let h = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const rep = (a, b) => { if (!h.includes(a)) console.warn('찾지 못함:', a); h = h.split(a).join(b); };
rep('<script src="/auth.js?v=3" defer></script>', '');                       // 카카오 로그인 없음 → 게스트(기기 저장)로만 동작
rep("fetch('/api/config', { cache: 'no-store' })", 'Promise.resolve(null)');   // 애드센스 대신 토스 광고 브리지
rep("sendBeacon('/api/stat'", "sendBeacon('https://aptgame.kr/api/stat'");     // 통계는 aptgame.kr 서버로
rep('href="/"', 'href="#"');
h = h.replace(/<link rel="manifest"[^>]*>/, '').replace(/<script>if\("serviceWorker"[\s\S]*?<\/script>\s*/, ''); // PWA 요소는 토스에서 불필요                                                   // 미니앱 밖으로 나가는 링크 제거
rep("navigator.share({ title: '나의 첫 번째 서울 아파트 구하기', text, url })", "navigator.share({ title: '나의 첫 번째 서울 아파트 구하기', text: text + ' 토스에서 \\'첫 번째 서울 아파트\\' 검색!' })"); // 토스 안에서는 외부 사이트 링크 없이 공유
rep("const all = text + '\\n' + url;", "const all = text;");
h = h.replace(/<a class="other"[^>]*>[^<]*<\/a>/g, '');
h = h.replace(/<script async src="https:\/\/pagead2[^>]*><\/script>/g, '');
h = h.replace('</body>', '<script src="toss-bridge.js"></script>\n</body>');
fs.writeFileSync(path.join(out, 'index.html'), h);
const left = (h.match(/pagead2|\/auth\/kakao|aptgame\.kr\/(?!api\/stat|seoul\/e\/|assets\/)/g) || []);
console.log('prep done: 첫 아파트 단독', (h.length / 1024).toFixed(0) + 'KB', left.length ? '남은 외부 참조: ' + [...new Set(left)].join(',') : '');
