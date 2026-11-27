'use strict';
// ===== 도트 그림 도구 =====
function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
function shadow(g, x, y, w) { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y, w, w * .38, 0, 0, 7); g.fill(); }
const HOUSE = {
  baekho: { n: '백호학당', h: '白虎', c: '#e8e8f0', d: '#9aa3b8', ic: '🐯', el: '금' },
  cheongryong: { n: '청룡학당', h: '靑龍', c: '#3fae7a', d: '#1f6b4a', ic: '🐲', el: '목' },
  hyeonmu: { n: '현무학당', h: '玄武', c: '#3a5fb0', d: '#1f3470', ic: '🐢', el: '수' },
  jujak: { n: '주작학당', h: '朱雀', c: '#e0503a', d: '#8f2a1c', ic: '🐦‍🔥', el: '화' },
};

// ===== 바닥 타일 =====
// G 풀, D 흙길, P 돌바닥, W 물, F 숲바닥, S 모래, N 밤 장터 바닥, B 다리
const TILE_SOLID = new Set(['W', 'X']);
function drawGround(map) {
  const c = document.createElement('canvas'); c.width = map.W * T; c.height = map.H * T; const g = c.getContext('2d');
  const pal = map.pal || {};
  for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) {
    const v = map.t[y][x], X = x * T, Y = y * T, r = hash(x + map.seed, y);
    if (v === 'G' || v === 'F') {
      const base = v === 'F' ? (pal.forest || ['#2f5a34', '#2b5530', '#244a2a']) : (pal.grass || ['#5f9e4a', '#5a9846', '#4e8a3e']);
      px(g, X, Y, T, T, r < .5 ? base[0] : base[1]); g.fillStyle = base[2];
      for (let i = 0; i < 3; i++) { const a = hash(x * 3 + i, y * 7 + map.seed), b = hash(x * 5, y * 3 + i); const tx = X + 4 + a * 22, ty = Y + 6 + b * 20; g.fillRect(tx, ty, 2, 4); g.fillRect(tx + 3, ty - 1, 2, 5); }
      if (r > .94 && v === 'G') { g.fillStyle = ['#f6e05e', '#f2a6c0', '#fff'][Math.floor(r * 100) % 3]; g.fillRect(X + 12, Y + 14, 4, 4); }
      if (r > .9 && v === 'F') { g.fillStyle = '#5a4a32'; g.fillRect(X + 8 + r * 10, Y + 18, 6, 3); }
    } else if (v === 'D') {
      px(g, X, Y, T, T, r < .5 ? '#b79a6a' : '#b39565'); g.fillStyle = '#a3865a'; if (r < .4) g.fillRect(X + r * 24, Y + 10, 4, 3); if (r > .7) g.fillRect(X + 6, Y + 22, 3, 3);
    } else if (v === 'P') {
      px(g, X, Y, T, T, '#b8b2a6'); g.fillStyle = '#a49e92'; g.fillRect(X, Y + 15, T, 2); g.fillRect(X + ((y % 2) ? 0 : 15), Y, 2, 15); g.fillRect(X + ((y % 2) ? 15 : 0), Y + 17, 2, 15);
    } else if (v === 'N') {
      px(g, X, Y, T, T, r < .5 ? '#4a3a3a' : '#463636'); g.fillStyle = '#3c2e2e'; g.fillRect(X, Y + 15, T, 1); g.fillRect(X + ((y % 2) ? 0 : 16), Y, 1, 15);
    } else if (v === 'S') {
      px(g, X, Y, T, T, r < .5 ? '#cdb184' : '#c8ab7d'); if (r < .3) { g.fillStyle = '#b8996a'; g.fillRect(X + r * 30, Y + 12, 3, 2); }
    } else if (v === 'W') {
      px(g, X, Y, T, T, pal.water || '#2f6fa8'); g.fillStyle = 'rgba(255,255,255,.18)'; if (r < .5) g.fillRect(X + 4 + r * 16, Y + 10, 10, 2); if (r > .6) g.fillRect(X + 8, Y + 22, 8, 2);
    } else if (v === 'B') {
      px(g, X, Y, T, T, '#8a5a32'); g.fillStyle = '#6e4626'; for (let i = 0; i < T; i += 8) g.fillRect(X + i, Y, 2, T);
    } else if (v === 'X') { px(g, X, Y, T, T, '#0a0a12'); }
    // 물가 테두리
    if (v !== 'W' && v !== 'X') { const up = map.t[y - 1] && map.t[y - 1][x]; if (up === 'W') { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(X, Y, T, 3); } }
  }
  return c;
}

// ===== 건물·사물 (세워 그리기, 발밑 기준) =====
function drawObj(g, o, t) {
  const X = o.x * T, Y = o.y * T, W = o.w * T, Hh = o.h * T;
  switch (o.k) {
    case 'choga': { // 초가집
      shadow(g, X + W / 2, Y + Hh, W * .55);
      px(g, X + 4, Y + Hh - 34, W - 8, 34, '#d9c7a0'); px(g, X + 4, Y + Hh - 6, W - 8, 6, '#8a6a44');
      for (let i = 0; i < (W - 16) / 16; i++) px(g, X + 10 + i * 16, Y + Hh - 30, 3, 24, '#6e5232');
      px(g, X + W / 2 - 8, Y + Hh - 24, 16, 22, '#5a4028'); px(g, X + W / 2 - 6, Y + Hh - 22, 12, 18, '#e8dcc0');
      g.fillStyle = '#c9a85a'; g.beginPath(); g.moveTo(X - 6, Y + Hh - 30); g.quadraticCurveTo(X + W / 2, Y + Hh - 84, X + W + 6, Y + Hh - 30); g.closePath(); g.fill();
      g.fillStyle = '#b8954a'; for (let i = 0; i < 6; i++) { g.fillRect(X + 4 + i * (W / 6), Y + Hh - 36, 3, 4); }
      g.strokeStyle = '#8a6a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(X - 6, Y + Hh - 30); g.quadraticCurveTo(X + W / 2, Y + Hh - 84, X + W + 6, Y + Hh - 30); g.stroke();
      break; }
    case 'hanok': case 'hall': { // 기와집 / 전각
      const big = o.k === 'hall', wall = big ? 52 : 38, roofH = big ? 62 : 44, col = o.col || '#c0392b';
      shadow(g, X + W / 2, Y + Hh, W * .58);
      px(g, X + 6, Y + Hh - 8, W - 12, 8, '#8a7f70'); // 기단
      px(g, X + 10, Y + Hh - 8 - wall, W - 20, wall, '#efe6d2');
      for (let i = 0; i <= (W - 20) / 24; i++) px(g, X + 10 + i * 24, Y + Hh - 8 - wall, 5, wall, big ? col : '#7a4a2a');
      for (let i = 0; i < (W - 30) / 24; i++) { px(g, X + 18 + i * 24, Y + Hh - 8 - wall + 10, 12, wall - 18, '#d8c9a8'); g.fillStyle = '#b8a888'; g.fillRect(X + 23 + i * 24, Y + Hh - wall + 2, 1, wall - 18); }
      // 단청 띠
      px(g, X + 8, Y + Hh - 10 - wall, W - 16, 6, big ? '#2f7a5a' : '#6a4a32'); if (big) for (let i = 0; i < W - 16; i += 10) px(g, X + 8 + i, Y + Hh - 10 - wall + 1, 4, 3, '#e0503a');
      // 기와 지붕 (처마 곡선)
      const ry = Y + Hh - 10 - wall;
      g.fillStyle = big ? '#3a3f4a' : '#454a55'; g.beginPath(); g.moveTo(X - 14, ry + 4); g.quadraticCurveTo(X + 6, ry - 2, X + 16, ry - roofH * .55); g.lineTo(X + W - 16, ry - roofH * .55); g.quadraticCurveTo(X + W - 6, ry - 2, X + W + 14, ry + 4); g.lineTo(X + W + 8, ry + 8); g.lineTo(X - 8, ry + 8); g.closePath(); g.fill();
      g.fillStyle = big ? '#2b2f38' : '#353a44'; for (let i = X; i < X + W; i += 7) g.fillRect(i, ry - roofH * .5 + 6, 2, roofH * .5);
      px(g, X + 10, ry - roofH * .55 - 7, W - 20, 8, '#2a2d35'); px(g, X + 8, ry - roofH * .55 - 9, 8, 6, '#2a2d35'); px(g, X + W - 16, ry - roofH * .55 - 9, 8, 6, '#2a2d35');
      if (o.sign) { g.font = `900 ${big ? 13 : 10}px serif`; const sw = g.measureText(o.sign).width + 12; px(g, X + W / 2 - sw / 2, ry - roofH * .3, sw, big ? 20 : 15, '#1d2b4a'); g.strokeStyle = '#d9b05a'; g.lineWidth = 2; g.strokeRect(X + W / 2 - sw / 2, ry - roofH * .3, sw, big ? 20 : 15); g.fillStyle = '#f5d98a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.sign, X + W / 2, ry - roofH * .3 + (big ? 10 : 8)); }
      break; }
    case 'gate': { // 홍예문/학당 문
      const col = o.col || '#c0392b'; shadow(g, X + W / 2, Y + Hh, W * .5);
      px(g, X + 4, Y + Hh - 64, 10, 64, col); px(g, X + W - 14, Y + Hh - 64, 10, 64, col);
      g.fillStyle = '#3a3f4a'; g.beginPath(); g.moveTo(X - 10, Y + Hh - 58); g.quadraticCurveTo(X + W / 2, Y + Hh - 86, X + W + 10, Y + Hh - 58); g.lineTo(X + W + 4, Y + Hh - 52); g.lineTo(X - 4, Y + Hh - 52); g.closePath(); g.fill();
      px(g, X + 2, Y + Hh - 56, W - 4, 8, '#2f7a5a');
      if (o.sign) { g.font = '900 11px serif'; g.fillStyle = '#f5d98a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.sign, X + W / 2, Y + Hh - 52 + 4); }
      if (o.glow) { g.fillStyle = o.glow; g.globalAlpha = .25 + .15 * Math.sin(t * 3); g.fillRect(X + 14, Y + Hh - 48, W - 28, 48); g.globalAlpha = 1; }
      break; }
    case 'stall': { // 도깨비 장터 노점
      shadow(g, X + W / 2, Y + Hh, W * .55);
      px(g, X + 4, Y + Hh - 22, W - 8, 22, '#6a4a2e'); px(g, X + 4, Y + Hh - 24, W - 8, 4, '#8a6a44');
      for (let i = 0; i < (W - 12) / 10; i++) px(g, X + 8 + i * 10, Y + Hh - 30, 7, 7, ['#f0c040', '#e05a5a', '#5ab0e0', '#9de07a', '#e0a0f0'][(i + o.x) % 5]);
      px(g, X + 6, Y + Hh - 56, 3, 34, '#4a3220'); px(g, X + W - 9, Y + Hh - 56, 3, 34, '#4a3220');
      const cc = o.col || '#b83a3a'; for (let i = 0; i < W; i += 12) px(g, X + i, Y + Hh - 62, 12, 12, (i / 12) % 2 ? cc : '#f2e8d0');
      if (o.sign) { g.font = '800 9px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(o.sign, X + W / 2, Y + Hh - 66); }
      break; }
    case 'lantern': { // 청사초롱
      px(g, X + 14, Y + Hh - 40, 3, 40, '#3a2a1a'); const fl = .8 + .2 * Math.sin(t * 6 + o.x);
      px(g, X + 8, Y + Hh - 46, 16, 8, '#c0392b'); px(g, X + 8, Y + Hh - 38, 16, 8, '#2f5fb0'); g.fillStyle = `rgba(255,210,120,${.5 * fl})`; g.fillRect(X + 10, Y + Hh - 44, 12, 12);
      px(g, X + 14, Y + Hh - 30, 3, 6, '#d9b05a'); break; }
    case 'tree': case 'pine': {
      const cx = X + T / 2, by = Y + Hh, s = o.s || 1; shadow(g, cx, by - 2, 14 * s);
      px(g, cx - 3, by - 16 * s, 6, 16 * s, '#6b4a2b');
      if (o.k === 'pine') { const cs = o.dark ? ['#173a26', '#1f4a30', '#2a5e3c'] : ['#1f5a34', '#2a6e40', '#3a8a52'];
        for (let i = 0; i < 3; i++) { g.fillStyle = cs[i]; g.beginPath(); g.moveTo(cx - (18 - i * 4) * s, by - (12 + i * 12) * s); g.lineTo(cx + (18 - i * 4) * s, by - (12 + i * 12) * s); g.lineTo(cx, by - (30 + i * 12) * s); g.closePath(); g.fill(); } }
      else { const cs = o.dark ? ['#1e3d26', '#2a5232', '#3a6a40'] : ['#2f7a3a', '#3f9a49', '#5bb85f'];
        g.fillStyle = cs[0]; g.beginPath(); g.arc(cx, by - 26 * s, 16 * s, 0, 7); g.fill(); g.fillStyle = cs[1]; g.beginPath(); g.arc(cx - 3, by - 29 * s, 12 * s, 0, 7); g.fill(); g.fillStyle = cs[2]; g.beginPath(); g.arc(cx - 6, by - 33 * s, 5 * s, 0, 7); g.fill(); }
      break; }
    case 'dangsan': { // 당산나무 + 금줄
      const cx = X + W / 2, by = Y + Hh; shadow(g, cx, by - 4, 44);
      px(g, cx - 12, by - 60, 24, 60, '#5a3e24'); px(g, cx - 18, by - 12, 36, 12, '#4a321c'); px(g, cx - 6, by - 50, 4, 40, '#6e4e30');
      g.strokeStyle = '#d9c08a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 14, by - 34); g.quadraticCurveTo(cx, by - 28, cx + 14, by - 34); g.stroke();
      for (let i = 0; i < 5; i++) px(g, cx - 10 + i * 5, by - 32, 3, 8, '#fff');
      for (const [ox, oy, r, c] of [[0, -96, 44, '#1f5a30'], [-26, -84, 30, '#245e34'], [28, -82, 30, '#245e34'], [-6, -108, 30, '#2f7a3e'], [12, -100, 20, '#3a8a48']]) { g.fillStyle = c; g.beginPath(); g.arc(cx + ox, by + oy, r, 0, 7); g.fill(); }
      if (o.glow) { g.fillStyle = `rgba(255,230,140,${.15 + .1 * Math.sin(t * 2)})`; g.beginPath(); g.arc(cx, by - 70, 60, 0, 7); g.fill(); }
      break; }
    case 'wall': { // 돌담
      for (let i = 0; i < o.w; i++) for (let j = 0; j < o.h; j++) { const xx = X + i * T, yy = Y + j * T; px(g, xx, yy + 6, T, T - 6, '#8a8276'); px(g, xx + 2, yy + 8, 12, 9, '#9e968a'); px(g, xx + 16, yy + 8, 14, 9, '#968e82'); px(g, xx + 6, yy + 19, 14, 9, '#a29a8e'); px(g, xx, yy, T, 8, '#5a5f6a'); }
      break; }
    case 'rock': { const cx = X + T / 2, by = Y + Hh; shadow(g, cx, by - 2, 14); g.fillStyle = '#7a7670'; g.beginPath(); g.ellipse(cx, by - 10, 14, 11, 0, 0, 7); g.fill(); g.fillStyle = '#948f88'; g.beginPath(); g.ellipse(cx - 4, by - 14, 7, 5, 0, 0, 7); g.fill(); break; }
    case 'dummy': { // 허수아비 표적
      const cx = X + T / 2, by = Y + Hh; shadow(g, cx, by - 2, 10); px(g, cx - 2, by - 34, 4, 34, '#7a5a32'); px(g, cx - 14, by - 26, 28, 4, '#7a5a32');
      px(g, cx - 9, by - 30, 18, 14, '#d9c08a'); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(cx, by - 42, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, by - 42, 4, 0, 7); g.fill(); break; }
    case 'mirror': { // 신수의 거울
      const cx = X + W / 2, by = Y + Hh; shadow(g, cx, by - 2, 26);
      px(g, cx - 18, by - 12, 36, 12, '#5a4a3a'); px(g, cx - 4, by - 30, 8, 20, '#8a6a3a');
      g.fillStyle = '#b8863a'; g.beginPath(); g.arc(cx, by - 56, 26, 0, 7); g.fill(); g.fillStyle = '#d9b05a'; g.beginPath(); g.arc(cx, by - 56, 22, 0, 7); g.fill();
      const gr = g.createRadialGradient(cx - 6, by - 62, 2, cx, by - 56, 20); gr.addColorStop(0, '#fff'); gr.addColorStop(.4, '#bfe8ff'); gr.addColorStop(1, '#4a7ab0'); g.fillStyle = gr; g.beginPath(); g.arc(cx, by - 56, 19, 0, 7); g.fill();
      const hs = Object.values(HOUSE); hs.forEach((h, i) => { const a = t * .8 + i * Math.PI / 2; g.fillStyle = h.c; g.beginPath(); g.arc(cx + Math.cos(a) * 32, by - 56 + Math.sin(a) * 32, 4, 0, 7); g.fill(); });
      break; }
    case 'jangseung': { const cx = X + T / 2, by = Y + Hh; shadow(g, cx, by - 2, 9); px(g, cx - 6, by - 46, 12, 46, '#9a6e44'); px(g, cx - 8, by - 52, 16, 10, '#1a1a1a'); px(g, cx - 4, by - 38, 3, 3, '#000'); px(g, cx + 2, by - 38, 3, 3, '#000'); px(g, cx - 4, by - 30, 8, 3, '#c0392b'); g.fillStyle = '#2a1a0a'; g.font = '700 7px serif'; g.textAlign = 'center'; g.fillText('天下', cx, by - 16); break; }
    case 'well': { const cx = X + W / 2, by = Y + Hh; shadow(g, cx, by - 2, 18); px(g, cx - 16, by - 18, 32, 18, '#8a8276'); px(g, cx - 13, by - 18, 26, 5, '#1f3a5a'); px(g, cx - 18, by - 44, 4, 30, '#6a4a2a'); px(g, cx + 14, by - 44, 4, 30, '#6a4a2a'); px(g, cx - 20, by - 46, 40, 5, '#454a55'); break; }
    case 'chest': { const cx = X + T / 2, by = Y + Hh; shadow(g, cx, by - 2, 11); if (o.open) { px(g, cx - 11, by - 14, 22, 12, '#7a4a22'); px(g, cx - 11, by - 22, 22, 6, '#5a3416'); } else { px(g, cx - 11, by - 18, 22, 16, '#8a5a2a'); px(g, cx - 11, by - 18, 22, 5, '#a86e34'); px(g, cx - 2, by - 14, 4, 6, '#f0c040'); g.fillStyle = `rgba(255,220,120,${.2 + .2 * Math.sin(t * 4)})`; g.beginPath(); g.arc(cx, by - 12, 16, 0, 7); g.fill(); } break; }
    case 'herb': { const cx = X + T / 2, by = Y + Hh; if (o.got) break; for (let i = -1; i <= 1; i++) { px(g, cx + i * 5, by - 12 - Math.abs(i) * -2, 2, 10, '#3a8a3a'); } px(g, cx - 2, by - 16, 5, 5, '#e0e060'); break; }
    case 'portal': { const cx = X + W / 2, cy = Y + Hh - 30; for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(${o.rgb || '255,220,140'},${.6 - i * .18})`; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, 18 + i * 6 + Math.sin(t * 3 + i) * 2, 28 + i * 6, 0, 0, 7); g.stroke(); } g.fillStyle = `rgba(${o.rgb || '255,220,140'},.25)`; g.beginPath(); g.ellipse(cx, cy, 18, 28, 0, 0, 7); g.fill(); break; }
  }
}

// ===== 캐릭터 =====
function drawHuman(g, x, y, o) {
  // o: dir, f(걸음), skin, hair, top, bottom, belt, hat, gender, scale
  const d = o.dir || 'down', f = o.f || 0, s = o.s || 1;
  g.save(); g.translate(x, y); if (s !== 1) g.scale(s, s);
  shadow(g, 0, 13, 10);
  const X = -8, Y = -14 + (f ? -1 : 0);
  // 바지/치마
  if (o.gender === 'f') { px(g, X + 1, Y + 16, 14, 10, o.bottom || '#c0392b'); px(g, X + 1, Y + 24, 14, 2, '#0002'); }
  else { px(g, X + 3, Y + 20, 4, 6 - (f ? 2 : 0), o.bottom || '#e8e0d0'); px(g, X + 9, Y + 20, 4, 6 - (!f && o.moving ? 2 : 0), o.bottom || '#e8e0d0'); px(g, X + 2, Y + 25, 5, 2, '#3a2a1a'); px(g, X + 9, Y + 25, 5, 2, '#3a2a1a'); }
  // 저고리
  px(g, X + 1, Y + 11, 14, o.gender === 'f' ? 6 : 10, o.top || '#f2ecd8'); px(g, X + 1, Y + 11, 14, 2, '#fff8');
  if (d === 'down') { px(g, X + 6, Y + 11, 4, 5, o.belt || '#c0392b'); px(g, X + 7, Y + 15, 2, 5, o.belt || '#c0392b'); }
  if (d === 'left') px(g, X - 1, Y + 13, 3, 6, o.top || '#f2ecd8'); else if (d === 'right') px(g, X + 14, Y + 13, 3, 6, o.top || '#f2ecd8'); else { px(g, X - 1, Y + 12, 3, 7, o.top || '#f2ecd8'); px(g, X + 14, Y + 12, 3, 7, o.top || '#f2ecd8'); }
  // 얼굴
  px(g, X + 2, Y + 2, 12, 10, o.skin || '#f3c9a0');
  const hair = o.hair || '#1a1410';
  if (d === 'up') px(g, X + 2, Y + 2, 12, 10, hair);
  else if (d === 'down') { px(g, X + 2, Y + 1, 12, 4, hair); if (!o.noFace) { px(g, X + 4, Y + 7, 2, 2, '#1a1a1a'); px(g, X + 10, Y + 7, 2, 2, '#1a1a1a'); if (o.blush) { px(g, X + 3, Y + 9, 2, 1, '#e88'); px(g, X + 11, Y + 9, 2, 1, '#e88'); } } }
  else { px(g, d === 'left' ? X + 6 : X + 2, Y + 1, 8, 7, hair); px(g, d === 'left' ? X + 3 : X + 11, Y + 7, 2, 2, '#1a1a1a'); }
  // 머리 모양
  if (o.gender === 'f') { if (d !== 'down') px(g, X + 6, Y + 10, 4, 10, hair); px(g, X + 6, Y + 18, 4, 2, '#c0392b'); }
  else if (!o.hat) { px(g, X + 6, Y - 3, 4, 4, hair); }
  if (o.hat === 'gat') { px(g, X - 3, Y + 1, 22, 2, '#111'); px(g, X + 3, Y - 6, 10, 7, '#1a1a1a'); }
  if (o.hat === 'white') px(g, X + 2, Y, 12, 3, '#eee');
  if (o.beard) px(g, X + 5, Y + 11, 6, 5, o.beard);
  g.restore();
}
function drawDokkaebi(g, x, y, o) { // 도깨비 (상인·적·왕)
  const s = o.s || 1, f = o.f || 0, skin = o.skin || '#d9533a', d = o.dir || 'down';
  g.save(); g.translate(x, y); g.scale(s, s);
  shadow(g, 0, 13, 11);
  const X = -9, Y = -16 + (f ? -1 : 0);
  px(g, X + 3, Y + 22, 5, 6, skin); px(g, X + 11, Y + 22, 5, 6 - (f ? 2 : 0), skin);
  px(g, X + 1, Y + 13, 16, 11, o.cloth || '#e8c040'); for (let i = 0; i < 16; i += 4) px(g, X + 1 + i, Y + 13, 2, 11, '#1a1a1a');
  px(g, X + 2, Y + 2, 14, 12, skin); px(g, X + 2, Y + 1, 14, 3, o.hair || '#2a1a10');
  px(g, X + 3, Y - 4, 3, 5, '#f0e0b0'); px(g, X + 12, Y - 4, 3, 5, '#f0e0b0'); if (o.king) { px(g, X + 7, Y - 7, 4, 7, '#f0e0b0'); }
  if (d !== 'up') { px(g, X + 4, Y + 6, 3, 3, '#fff'); px(g, X + 11, Y + 6, 3, 3, '#fff'); px(g, X + 5, Y + 7, 2, 2, o.eye || '#000'); px(g, X + 12, Y + 7, 2, 2, o.eye || '#000'); px(g, X + 5, Y + 11, 8, 2, '#5a1a10'); px(g, X + 6, Y + 11, 2, 2, '#fff'); px(g, X + 10, Y + 11, 2, 2, '#fff'); }
  if (o.club !== false) { const sw = o.swing || 0; g.save(); g.translate(X + 17, Y + 16); g.rotate(-.6 + sw); px(g, -2, -18, 5, 20, '#6a4a2a'); px(g, -4, -24, 9, 9, '#7a5a32'); for (const [a, b] of [[-5, -22], [4, -22], [-1, -27]]) px(g, a, b, 2, 2, '#ccc'); g.restore(); }
  g.restore();
}
function drawMagpie(g, x, y, t, s) { // 까치
  s = s || 1; const flap = Math.sin(t * 14) > 0;
  g.save(); g.translate(x, y); g.scale(s, s);
  px(g, -6, -3, 12, 6, '#111'); px(g, -2, 0, 8, 4, '#f2f2f2'); px(g, 6, -3, 4, 4, '#111'); px(g, 10, -2, 3, 2, '#333'); px(g, -12, -2, 7, 3, '#1a2a4a');
  if (flap) { px(g, -4, -9, 8, 6, '#1a1a2a'); px(g, -2, -9, 4, 3, '#f2f2f2'); } else { px(g, -4, 2, 8, 5, '#1a1a2a'); }
  px(g, 8, -2, 1, 1, '#fff');
  g.restore();
}
function drawBeast(g, x, y, house, t, s, ride) { // 신수 (아기·탑승)
  s = s || 1; const h = HOUSE[house] || HOUSE.cheongryong; g.save(); g.translate(x, y); g.scale(s, s);
  const bob = Math.sin(t * 4) * 2;
  if (house === 'cheongryong') { for (let i = 0; i < 6; i++) { const a = t * 3 + i * .6; px(g, -16 + i * 6, -4 + Math.sin(a) * 4 + bob, 8, 8, i % 2 ? h.c : '#56c890'); } px(g, 18, -10 + bob, 12, 10, h.c); px(g, 26, -8 + bob, 3, 2, '#ff0'); px(g, 20, -16 + bob, 2, 6, '#f0e0b0'); px(g, 24, -16 + bob, 2, 6, '#f0e0b0'); }
  else if (house === 'baekho') { px(g, -14, -6 + bob, 26, 12, '#f2f2f6'); for (let i = 0; i < 4; i++) px(g, -10 + i * 6, -6 + bob, 2, 10, '#333'); px(g, 10, -14 + bob, 12, 12, '#f2f2f6'); px(g, 12, -16 + bob, 3, 3, '#f2f2f6'); px(g, 18, -16 + bob, 3, 3, '#f2f2f6'); px(g, 18, -10 + bob, 2, 2, '#3ab0ff'); px(g, -12, 6 + bob, 4, 6, '#ddd'); px(g, 6, 6 + bob, 4, 6, '#ddd'); px(g, -20, -10 + bob, 8, 3, '#f2f2f6'); }
  else if (house === 'hyeonmu') { g.fillStyle = '#2f5a3a'; g.beginPath(); g.ellipse(0, bob, 18, 11, 0, 0, 7); g.fill(); g.fillStyle = '#3a6e48'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 9, bob - 2, 5, 0, 7); g.fill(); } px(g, 16, -6 + bob, 9, 8, '#5a8a5a'); px(g, 22, -4 + bob, 2, 2, '#000'); g.strokeStyle = '#3a5fb0'; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, bob); g.quadraticCurveTo(-28, bob - 10, -20, bob - 18); g.stroke(); }
  else { const w = Math.sin(t * 10) * 6; g.fillStyle = '#e0503a'; g.beginPath(); g.moveTo(-4, bob); g.lineTo(-24, bob - 12 - w); g.lineTo(-14, bob + 2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(4, bob); g.lineTo(24, bob - 12 - w); g.lineTo(14, bob + 2); g.closePath(); g.fill(); px(g, -6, -6 + bob, 12, 10, '#f07a40'); px(g, 4, -12 + bob, 8, 8, '#f07a40'); px(g, 10, -10 + bob, 4, 2, '#ffd040'); for (let i = 0; i < 3; i++) px(g, -10 - i * 4, 2 + bob + i * 2, 4, 3, ['#ffd040', '#f07a40', '#e0503a'][i]); }
  g.restore();
}
function drawWisp(g, x, y, t, col) { // 도깨비불
  const fl = Math.sin(t * 9 + x) * 2; g.fillStyle = col || 'rgba(110,190,255,.35)'; g.beginPath(); g.arc(x, y - 8, 13, 0, 7); g.fill();
  g.fillStyle = '#8fd0ff'; g.beginPath(); g.moveTo(x - 8, y - 4); g.quadraticCurveTo(x - 6, y - 20 - fl, x, y - 26 + fl); g.quadraticCurveTo(x + 6, y - 20 + fl, x + 8, y - 4); g.quadraticCurveTo(x, y + 2, x - 8, y - 4); g.fill();
  g.fillStyle = '#e8f6ff'; g.beginPath(); g.arc(x, y - 7, 4, 0, 7); g.fill(); px(g, x - 3, y - 10, 2, 2, '#124'); px(g, x + 1, y - 10, 2, 2, '#124');
}
function drawEgg(g, x, y, t, f) { // 달걀귀신
  shadow(g, x, y + 13, 9); const b = Math.sin(t * 3 + x) * 2;
  px(g, x - 9, y - 4 + b, 18, 18, '#f0f0f4'); px(g, x - 9, y + 12 + b, 18, 3, '#ddd');
  g.fillStyle = '#fbf8ef'; g.beginPath(); g.ellipse(x, y - 14 + b, 9, 12, 0, 0, 7); g.fill();
  px(g, x - 11, y - 22 + b, 4, 30, '#141414'); px(g, x + 7, y - 22 + b, 4, 30, '#141414'); px(g, x - 9, y - 26 + b, 18, 6, '#141414');
}
function drawTigerSpirit(g, x, y, t, f, dir) { // 장산범
  shadow(g, x, y + 12, 16); const sx = dir === 'left' ? -1 : 1; g.save(); g.translate(x, y); g.scale(sx, 1);
  px(g, -16, -8, 28, 14, '#f4f2ea'); for (let i = 0; i < 4; i++) px(g, -12 + i * 6, -8, 2, 12, '#3a3a3a');
  px(g, 10, -16, 14, 14, '#f4f2ea'); px(g, 12, -19, 3, 4, '#f4f2ea'); px(g, 20, -19, 3, 4, '#f4f2ea'); px(g, 18, -11, 3, 2, '#e02020'); px(g, 22, -6, 4, 2, '#600');
  px(g, -14, 6, 4, 6 - (f ? 2 : 0), '#e4e2da'); px(g, 6, 6, 4, 6 - (f ? 0 : 2), '#e4e2da'); for (let i = 0; i < 5; i++) px(g, -24 + i * 2, -10 + Math.sin(t * 6 + i) * 3, 3, 3, '#f4f2ea');
  g.restore();
}
