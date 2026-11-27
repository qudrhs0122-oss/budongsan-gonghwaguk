'use strict';
// ===== 지도 =====
// 지도 = { W,H,t(타일 문자열 배열), objs(건물·나무…), npcs, foes, exits, start, night, music }
function blank(W, H, ch) { return Array.from({ length: H }, () => ch.repeat(W).split('')); }
function fill(t, x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (t[y] && t[y][x] !== undefined) t[y][x] = ch; }
function srand(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

const MAPS = {
  // ---------- 1. 조선 마을 (정월대보름 밤) ----------
  village() {
    const W = 34, H = 28, t = blank(W, H, 'G'), objs = [];
    fill(t, 16, 4, 17, H - 1, 'D'); fill(t, 4, 18, 30, 19, 'D'); fill(t, 12, 4, 21, 6, 'D');
    fill(t, 0, 24, 6, H - 1, 'W'); fill(t, 27, 0, W - 1, 5, 'W');
    objs.push({ k: 'dangsan', x: 15, y: 1, w: 4, h: 3, solid: [15, 2, 4, 2], glow: 1 });
    objs.push({ k: 'choga', x: 6, y: 12, w: 5, h: 3, solid: [6, 12, 5, 3] }, { k: 'choga', x: 21, y: 11, w: 5, h: 3, solid: [21, 11, 5, 3] }, { k: 'choga', x: 9, y: 20, w: 5, h: 3, solid: [9, 20, 5, 3], home: 1 }, { k: 'hanok', x: 21, y: 20, w: 6, h: 3, solid: [21, 20, 6, 3], sign: '서당' });
    objs.push({ k: 'well', x: 18, y: 14, w: 2, h: 2, solid: [18, 14, 2, 2] }, { k: 'jangseung', x: 15, y: 8, w: 1, h: 1, solid: [15, 8, 1, 1] }, { k: 'jangseung', x: 18, y: 8, w: 1, h: 1, solid: [18, 8, 1, 1] });
    for (const [x, y] of [[2, 3], [5, 6], [8, 2], [11, 8], [24, 7], [29, 9], [31, 14], [2, 15], [28, 24], [30, 26], [13, 25], [24, 26], [3, 9]]) objs.push({ k: 'pine', x, y, w: 1, h: 1, solid: [x, y, 1, 1], s: 1.1 });
    for (const [x, y] of [[12, 15], [27, 16], [7, 25]]) objs.push({ k: 'lantern', x, y, w: 1, h: 1, solid: [x, y, 1, 1], light: 1 });
    return { id: 'village', name: '달골 마을', W, H, t, objs, seed: 3, night: .62, music: 'calm', start: { x: 11.5, y: 23.8 },
      npcs: [{ id: 'mom', k: 'human', x: 13.5, y: 23.5, look: { top: '#e8dcc0', bottom: '#7a5a8a', gender: 'f', hair: '#2a2018' }, name: '어머니' },
        { id: 'kid', k: 'human', x: 24, y: 17, look: { top: '#f0d070', bottom: '#5a7aa0', s: .85 }, name: '동네 꼬마', wander: 1 },
        { id: 'halmi', k: 'human', x: 17, y: 5.6, look: { top: '#f4f2ea', bottom: '#f4f2ea', gender: 'f', hair: '#e8e8e8' }, name: '당산할미', glow: 1, hidden: 1 }],
      exits: [{ x: 16, y: 3, w: 2, h: 1, to: 'market', need: 'gateOpen', msg: '당산나무가 아직 잠들어 있다. 할미를 만나야 한다.' }] };
  },
  // ---------- 2. 도깨비 장터 ----------
  market() {
    const W = 30, H = 24, t = blank(W, H, 'X'), objs = [];
    fill(t, 2, 2, W - 3, H - 2, 'N'); fill(t, 12, 0, 17, 2, 'N');
    const stalls = [[3, 5, '법구'], [3, 11, '영약'], [3, 17, '부적'], [21, 5, '한복'], [21, 11, '신수의 알'], [21, 17, '술법서']];
    for (const [x, y, s] of stalls) objs.push({ k: 'stall', x, y, w: 5, h: 2, solid: [x, y, 5, 2], sign: s, col: pick(['#b83a3a', '#3a6ab8', '#7a3ab8', '#3a9a6a']) });
    for (let y = 4; y < H - 2; y += 4) { objs.push({ k: 'lantern', x: 10, y, w: 1, h: 1, solid: [10, y, 1, 1], light: 1 }, { k: 'lantern', x: 19, y, w: 1, h: 1, solid: [19, y, 1, 1], light: 1 }); }
    objs.push({ k: 'portal', x: 13, y: 1, w: 4, h: 2, rgb: '255,210,120', light: 1 });
    for (let x = 2; x < W - 2; x++) { objs.push({ k: 'wall', x, y: 1, w: 1, h: 1, solid: [x, 1, 1, 1] }); }
    objs.splice(objs.findIndex(o => o.k === 'wall' && o.x === 13), 4);
    return { id: 'market', name: '도깨비 장터', W, H, t, objs, seed: 7, night: .5, music: 'night', start: { x: 15, y: 21.5 },
      npcs: [{ id: 'ttuk', k: 'dok', x: 8.5, y: 7.8, look: { skin: '#3a7ad9', cloth: '#e8c040' }, name: '뚝딱이' },
        { id: 'yak', k: 'dok', x: 8.5, y: 13.8, look: { skin: '#d9533a', cloth: '#5ab0e0' }, name: '약장수 도깨비' },
        { id: 'ssir', k: 'dok', x: 15, y: 12, look: { skin: '#5aa04a', cloth: '#e05a5a' }, name: '씨름꾼 도깨비', wander: 1 },
        { id: 'egg', k: 'dok', x: 20, y: 13.8, look: { skin: '#9a5ad9', cloth: '#f0f0f0' }, name: '알 파는 도깨비' }],
      exits: [{ x: 13, y: 1, w: 4, h: 2, to: 'palace', need: 'weapon', msg: '법구도 없이 사신궁에 갈 순 없다. 뚝딱이의 노점에 가보자.' }] };
  },
  // ---------- 3. 사신궁 ----------
  palace() {
    const W = 34, H = 30, t = blank(W, H, 'G'), objs = [];
    fill(t, 4, 4, 29, 25, 'P'); fill(t, 15, 25, 18, H - 1, 'P'); fill(t, 24, 12, 31, 22, 'S');
    objs.push({ k: 'hall', x: 10, y: 2, w: 14, h: 3, solid: [10, 2, 14, 3], sign: '四神宮', col: '#c0392b' });
    const gates = [['baekho', 4, 8], ['cheongryong', 4, 18], ['hyeonmu', 27, 6], ['jujak', 27, 24]];
    for (const [hs, x, y] of gates) objs.push({ k: 'gate', x, y, w: 3, h: 1, solid: [x, y, 1, 1], sol2: [x + 2, y, 1, 1], sign: HOUSE[hs].h, col: HOUSE[hs].d, glow: HOUSE[hs].c, house: hs });
    objs.push({ k: 'mirror', x: 16, y: 13, w: 2, h: 1, solid: [16, 13, 2, 1], light: 1 });
    for (const [x, y] of [[1, 2], [2, 12], [1, 22], [32, 3], [32, 15], [31, 27], [6, 27], [26, 28], [9, 26]]) objs.push({ k: 'pine', x, y, w: 1, h: 1, solid: [x, y, 1, 1], s: 1.2 });
    for (const [x, y] of [[8, 6], [25, 6], [8, 22], [13, 24], [20, 24]]) objs.push({ k: 'lantern', x, y, w: 1, h: 1, solid: [x, y, 1, 1], light: 1 });
    for (let i = 0; i < 4; i++) objs.push({ k: 'dummy', x: 26 + (i % 2) * 3, y: 14 + Math.floor(i / 2) * 4, w: 1, h: 1, solid: null, dummy: 1 });
    objs.push({ k: 'portal', x: 15, y: 27, w: 4, h: 2, rgb: '120,255,160', light: 1, hidden: 1, forest: 1 });
    return { id: 'palace', name: '사신궁', W, H, t, objs, seed: 11, night: .15, music: 'calm', start: { x: 17, y: 24 },
      npcs: [{ id: 'hun', k: 'human', x: 17, y: 9, look: { top: '#3a4a6a', bottom: '#3a4a6a', hat: 'gat', beard: '#ddd', hair: '#888' }, name: '청송 훈장' },
        { id: 'sun', k: 'human', x: 21, y: 18, look: { top: '#e0503a', bottom: '#f2ecd8', gender: 'f' }, name: '주작학당 선배', wander: 1 },
        { id: 'mate', k: 'human', x: 11, y: 16, look: { top: '#3a5fb0', bottom: '#f2ecd8' }, name: '같은 신입생 해솔' }],
      exits: [{ x: 15, y: 27, w: 4, h: 2, to: 'forest', need: 'trained', msg: '아직 수업이 끝나지 않았다. 훈장님께 가보자.' }] };
  },
  // ---------- 4. 금단의 숲 ----------
  forest() {
    const W = 58, H = 48, t = blank(W, H, 'F'), objs = [], R = srand(1234), blocked = new Set();
    // 길: 아래 입구 → 굽이굽이 → 위 보스 문
    const path = [[29, 46], [29, 38], [14, 34], [12, 24], [24, 18], [40, 22], [46, 12], [30, 6], [29, 2]];
    const carve = (x, y, r) => { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (xx > 0 && yy > 0 && xx < W - 1 && yy < H - 1) blocked.add(xx + ',' + yy); };
    for (let i = 0; i < path.length - 1; i++) { const [ax, ay] = path[i], [bx, by] = path[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let k = 0; k <= n; k++) carve(Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n), 2); }
    const clear = [[29, 40, 5], [13, 29, 5], [24, 18, 4], [42, 18, 5], [46, 10, 4], [30, 5, 4], [8, 40, 3], [50, 32, 4]];
    for (const [x, y, r] of clear) carve(x, y, r);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (blocked.has(x + ',' + y)) { t[y][x] = hash(x, y) < .1 ? 'F' : 'D'; continue; } if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || R() < .58) objs.push({ k: R() < .55 ? 'pine' : 'tree', x, y, w: 1, h: 1, solid: [x, y, 1, 1], s: .9 + R() * .4, dark: 1 }); }
    fill(t, 34, 30, 40, 35, 'W'); for (const o of objs.slice()) if (o.x >= 34 && o.x <= 40 && o.y >= 30 && o.y <= 35) objs.splice(objs.indexOf(o), 1);
    for (const [x, y] of [[9, 40], [51, 32], [44, 9]]) objs.push({ k: 'chest', x, y, w: 1, h: 1, solid: [x, y, 1, 1], chest: 1 });
    for (const [x, y] of [[27, 41], [15, 31], [22, 17], [41, 20], [31, 7], [48, 33]]) objs.push({ k: 'herb', x, y, w: 1, h: 1, herb: 1 });
    objs.push({ k: 'portal', x: 28, y: 1, w: 3, h: 2, rgb: '255,90,90', light: 1 });
    const foes = [];
    const put = (k, x, y, n) => { for (let i = 0; i < (n || 1); i++) foes.push({ k, x: x + rnd(-1.5, 1.5), y: y + rnd(-1.5, 1.5) }); };
    put('wisp', 29, 36, 2); put('imp', 14, 30, 2); put('wisp', 12, 25, 1); put('egg', 24, 18, 2); put('imp', 42, 19, 3); put('wisp', 44, 21, 1); put('egg', 47, 11, 1); put('tiger', 31, 6, 1); put('imp', 8, 39, 1); put('wisp', 50, 31, 2);
    return { id: 'forest', name: '금단의 숲', W, H, t, objs, seed: 21, night: .55, music: 'battle', start: { x: 29.5, y: 45 }, foes, npcs: [],
      exits: [{ x: 28, y: 1, w: 3, h: 2, to: 'boss', need: 'tigerDown', msg: '붉은 문 앞을 하얀 짐승이 지키고 있다…' }] };
  },
  // ---------- 5. 도깨비왕의 터 ----------
  boss() {
    const W = 26, H = 22, t = blank(W, H, 'X'), objs = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 12.5) / 11, (y - 11) / 9.5); if (d < 1) t[y][x] = d < .8 ? 'S' : 'F'; else if (d < 1.12) objs.push({ k: 'rock', x, y, w: 1, h: 1, solid: [x, y, 1, 1] }); }
    for (const [x, y] of [[5, 5], [20, 5], [4, 16], [21, 16]]) objs.push({ k: 'lantern', x, y, w: 1, h: 1, solid: [x, y, 1, 1], light: 1 });
    return { id: 'boss', name: '도깨비왕의 터', W, H, t, objs, seed: 31, night: .45, music: 'battle', start: { x: 12.5, y: 18 }, npcs: [], foes: [{ k: 'king', x: 12.5, y: 7 }], exits: [] };
  },
};
