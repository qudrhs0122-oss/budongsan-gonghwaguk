// 부동산 공화국 — 온라인 대전 서버 (외부 패키지 없이 Node.js 기본 모듈만 사용)
// - 정적 파일 제공 (public/)
// - 자동 매칭: 접속한 순서대로 4명씩 방 생성 (2명 이상이면 30초 뒤 자동 시작)
// - 실시간 중계: Server-Sent Events(받기) + POST(보내기)
// - 전체 주간 랭킹: ranking.json 에 닉네임별 누적 순자산 저장
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
// 재건축 조합장 키우기: GitHub Pages(johapjang-game 저장소)를 실시간으로 가져와 /johapjang/ 에서 보여줌
const JH_ORIGIN = process.env.JOHAPJANG_ORIGIN || 'https://qudrhs0122-oss.github.io/johapjang-game';
const JH_OG = '<meta property="og:type" content="website"><meta property="og:site_name" content="aptgame.kr"><meta property="og:title" content="재건축 조합장 키우기 | 부동산공화국"><meta property="og:description" content="10년 뒤 입주할 수 있을까, 아니면 먼저 해임당할까? 선택형 재건축 경영 시뮬레이션"><meta property="og:url" content="https://aptgame.kr/johapjang/"><meta property="og:image" content="https://aptgame.kr/assets/og2.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="https://aptgame.kr/johapjang/"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2150655592231599" crossorigin="anonymous"></script>';
function proxyJohapjang(rest, res, fallback) {
  // 깃허브 페이지 CDN 캐시(최대 10분)를 피하려고 30초 단위 버전 쿼리를 붙임 → 수정 후 30초 안에 반영
  const url = JH_ORIGIN + '/' + rest + '?v=' + Math.floor(Date.now() / 30000);
  const lib = url.startsWith('https:') ? https : http;
  let done = false;
  const fail = () => { if (!done) { done = true; fallback(); } };
  const rq = lib.get(url, { headers: { 'User-Agent': 'aptgame-proxy' }, timeout: 8000 }, up => {
    if (up.statusCode !== 200) { up.resume(); return fail(); }
    done = true;
    const ct = up.headers['content-type'] || 'application/octet-stream';
    const isHtml = rest === '' || rest.endsWith('.html');
    if (!isHtml) {
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=300' });
      return up.pipe(res);
    }
    let b = ''; up.setEncoding('utf8');
    up.on('data', d => { b += d; });
    up.on('end', () => {
      b = b.replace(/<meta (property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*">\s*/g, '');
      b = b.replace('</title>', '</title>' + JH_OG);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(b);
    });
  });
  rq.on('timeout', () => { rq.destroy(); fail(); });
  rq.on('error', fail);
}

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const RANK_FILE = path.join(__dirname, 'ranking.json');
const ROOM_SIZE = 4;
const DEFAULT_PUB = 'ca-pub-2150655592231599'; // 애드센스 게시자 ID
const DEFAULT_BANNER_SLOT = '4104692035';      // 애드센스 '게임 배너' 광고 단위
const AUTO_START_MS = 30000;      // 2명 이상 모이면 30초 뒤 시작
const RECONNECT_MS = 60000;       // 게임 중 연결 끊김 허용 시간
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp' };

/* ---------------- 연결 / 방 ---------------- */
const clients = new Map();   // cid -> { cid, res, nick, char, room, online, lastSeen, dropTimer }
const rooms = new Map();     // id -> { id, players:[cid], state:'waiting'|'playing', host, timer, startAt }
let roomSeq = 0;

function send(cid, ev, data) {
  const c = clients.get(cid);
  if (!c || !c.res) return;
  try { c.res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) {}
}
function toRoom(room, ev, data, except) { room.players.forEach(cid => { if (cid !== except) send(cid, ev, data); }); }
const clean = s => String(s || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 8);
const CHAR_OK = ['', 'young', 'cash', 'rebuild', 'gangnam'];

function roster(room) {
  return {
    room: room.id, state: room.state, startIn: room.startAt ? Math.max(0, room.startAt - Date.now()) : null, host: room.host,
    players: room.players.map((cid, seat) => { const c = clients.get(cid) || {}; return { cid, seat, nick: c.nick, char: c.char, online: !!c.online }; }),
  };
}
function emitRoster(room) { toRoom(room, 'roster', roster(room)); }

function findRoom() {
  for (const r of rooms.values()) if (r.state === 'waiting' && r.players.length < ROOM_SIZE) return r;
  const r = { id: ++roomSeq, players: [], state: 'waiting', host: null, timer: null, startAt: null };
  rooms.set(r.id, r);
  return r;
}
function startRoom(r) {
  if (r.state !== 'waiting' || r.players.length < 2) return;
  clearTimeout(r.timer); r.timer = null;
  r.state = 'playing';
  r.host = r.players[0];
  const info = roster(r);
  toRoom(r, 'start', info);
  console.log(`[room ${r.id}] start with ${r.players.length} players`);
}
function scheduleStart(r) {
  if (r.state !== 'waiting') return;
  if (r.players.length >= ROOM_SIZE) return startRoom(r);
  if (r.players.length >= 2 && !r.timer) {
    r.startAt = Date.now() + AUTO_START_MS;
    r.timer = setTimeout(() => startRoom(r), AUTO_START_MS);
  }
  if (r.players.length < 2 && r.timer) { clearTimeout(r.timer); r.timer = null; r.startAt = null; }
}
function leaveRoom(cid, reason) {
  const c = clients.get(cid); if (!c || !c.room) return;
  const r = rooms.get(c.room); c.room = null;
  if (!r) return;
  if (r.state === 'waiting') {
    r.players = r.players.filter(x => x !== cid);
    if (r.host === cid) r.host = r.players[0] || null;
    if (!r.players.length) { clearTimeout(r.timer); rooms.delete(r.id); return; }
    scheduleStart(r); emitRoster(r);
  } else {
    if (r.host === cid) {
      toRoom(r, 'hostLeft', { reason }, cid);
      r.players.forEach(x => { const o = clients.get(x); if (o && o.room === r.id) o.room = null; });
      rooms.delete(r.id);
      console.log(`[room ${r.id}] closed (host left)`);
    } else {
      r.players = r.players.filter(x => x !== cid);
      send(r.host, 'left', { cid, reason });
      if (r.players.length <= 0) rooms.delete(r.id);
    }
  }
}

/* ---------------- 광고 통계 (일별 노출·제안·시청 횟수) ---------------- */
const STAT_FILE = path.join(__dirname, 'stats.json');
let stats = {}; try { stats = JSON.parse(fs.readFileSync(STAT_FILE, 'utf8')) || {}; } catch (e) {}
let statT = null;
function dayKey() { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
function addStat(g, ev, k) {
  if (!/^[a-z]{2,20}$/.test(g) || !/^[a-z_]{2,30}$/.test(ev)) return false;
  const d = dayKey(), key = k && /^[a-z0-9_]{1,30}$/.test(k) ? ev + ':' + k : ev;
  const day = (stats[d] = stats[d] || {}); const gg = (day[g] = day[g] || {});
  if (Object.keys(gg).length > 300) return false;
  gg[key] = (gg[key] || 0) + 1;
  const keys = Object.keys(stats).sort(); while (keys.length > 120) delete stats[keys.shift()];
  clearTimeout(statT); statT = setTimeout(() => fs.writeFile(STAT_FILE, JSON.stringify(stats), () => {}), 2000);
  return true;
}

/* ---------------- 랭킹 ---------------- */
function weekKey(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000); // 한국 시간 기준
  const day = (k.getUTCDay() + 6) % 7; k.setUTCDate(k.getUTCDate() - day);
  return `${k.getUTCFullYear()}-${k.getUTCMonth() + 1}-${k.getUTCDate()}`;
}
let ranking = { w: weekKey(), p: {} };
try { const r = JSON.parse(fs.readFileSync(RANK_FILE, 'utf8')); if (r && r.w) ranking = r; } catch (e) {}
function rankNow() { if (ranking.w !== weekKey()) ranking = { w: weekKey(), p: {} }; return ranking; }
let saveT = null;
function saveRanking() { clearTimeout(saveT); saveT = setTimeout(() => fs.writeFile(RANK_FILE, JSON.stringify(ranking), () => {}), 500); }
const lastPost = new Map();
function addResults(list, ip) {
  const now = Date.now();
  if (now - (lastPost.get(ip) || 0) < 10000) return false; // 10초에 1번
  lastPost.set(ip, now);
  const r = rankNow();
  (Array.isArray(list) ? list : []).slice(0, 4).forEach(x => {
    const nick = clean(x.nick); if (!nick) return;
    const nw = Math.max(0, Math.min(3000, Number(x.nw) || 0));
    const e = r.p[nick] || { total: 0, games: 0, best: 0, wins: 0, ch: '' };
    e.total = Math.round((e.total + nw) * 10) / 10; e.games++; e.best = Math.max(e.best, nw);
    if (x.win) e.wins++; e.ch = CHAR_OK.includes(x.ch) || x.ch === 'gony' ? x.ch : '';
    r.p[nick] = e;
  });
  saveRanking();
  return true;
}

/* ---------------- HTTP ---------------- */
function body(req) {
  return new Promise(res => {
    let b = ''; req.on('data', d => { b += d; if (b.length > 2e5) req.destroy(); });
    req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch (e) { res({}); } });
  });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }

function handleMsg(c, m) {
  const t = m && m.t, d = (m && m.d) || {};
  if (t === 'join') {
    if (c.room) leaveRoom(c.cid, 'rejoin');
    c.nick = clean(d.nick) || '익명'; c.char = CHAR_OK.includes(d.char) ? d.char : '';
    const r = findRoom(); r.players.push(c.cid); c.room = r.id;
    if (!r.host) r.host = c.cid;
    scheduleStart(r); emitRoster(r);
    console.log(`[room ${r.id}] ${c.nick} joined (${r.players.length}/${ROOM_SIZE})`);
  } else if (t === 'start') {
    const r = rooms.get(c.room); if (r && r.host === c.cid) startRoom(r);
  } else if (t === 'leave') {
    leaveRoom(c.cid, 'leave');
  } else if (t === 'relay') {
    const r = rooms.get(c.room); if (!r || r.state !== 'playing') return;
    if (c.cid === r.host) {
      if (d.to === 'all') toRoom(r, d.ev, d.data, c.cid);
      else if (r.players.includes(d.to)) send(d.to, d.ev, d.data);
    } else {
      send(r.host, d.ev, Object.assign({}, d.data, { from: c.cid }));
    }
  }
}

function serveStatic(p, res) {
  let rel; try { rel = decodeURIComponent(p === '/' ? '/index.html' : p); } catch (e) { res.writeHead(400); return res.end(); }
  let fp = path.normalize(path.join(PUBLIC, rel));
  if (!fp.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    fs.createReadStream(fp).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url.replace(/^\/+/, '/'), 'http://x'); } catch (e) { res.writeHead(400); return res.end(); }
  let p = url.pathname;

  // 실시간 받기 (SSE)
  if (p === '/events') {
    const cid = (url.searchParams.get('cid') || '').replace(/[^a-z0-9]/gi, '').slice(0, 32) || crypto.randomBytes(8).toString('hex');
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`retry: 2000\nevent: hello\ndata: ${JSON.stringify({ cid })}\n\n`);
    let c = clients.get(cid);
    if (!c) { c = { cid, nick: '', char: '', room: null }; clients.set(cid, c); }
    if (c.res && c.res !== res) { try { c.res.end(); } catch (e) {} }
    c.res = res; c.online = true; clearTimeout(c.dropTimer);
    const r = c.room && rooms.get(c.room);
    if (r) { if (r.state === 'waiting') emitRoster(r); else if (r.host !== cid) send(r.host, 'back', { cid }); else toRoom(r, 'hostBack', {}, cid); }
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 20000);
    req.on('close', () => {
      clearInterval(ping);
      if (c.res !== res) return;
      c.res = null; c.online = false;
      const rr = c.room && rooms.get(c.room);
      const wait = rr && rr.state === 'playing' ? RECONNECT_MS : 8000;
      if (rr && rr.state === 'playing' && rr.host !== cid) send(rr.host, 'away', { cid });
      c.dropTimer = setTimeout(() => { leaveRoom(cid, 'disconnect'); clients.delete(cid); }, wait);
    });
    return;
  }

  // 보내기 (여러 메시지를 한 번에)
  if (p === '/api/send' && req.method === 'POST') {
    const b = await body(req);
    const c = clients.get(String(b.cid || ''));
    if (!c) return json(res, 404, { ok: false, error: 'no-session' });
    (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 200).forEach(m => handleMsg(c, m));
    return json(res, 200, { ok: true });
  }
  // 광고 설정 (Render 환경변수로 관리 — 코드 수정 없이 켜고 끌 수 있음)
  if (p === '/api/config') {
    const client = (process.env.ADSENSE_CLIENT || DEFAULT_PUB).trim();
    return json(res, 200, { ads: { client: /^ca-pub-\d{10,20}$/.test(client) ? client : '', test: process.env.ADSENSE_TEST === 'on', h5: process.env.ADSENSE_H5 === 'on', bannerSlot: (process.env.ADSENSE_BANNER_SLOT || DEFAULT_BANNER_SLOT).replace(/\D/g, '') } });
  }
  if (p === '/api/stat' && req.method === 'POST') {
    const b = await body(req);
    return json(res, 200, { ok: addStat(String(b.g || ''), String(b.ev || ''), String(b.k || '')) });
  }
  if (p === '/api/stats') return json(res, 200, stats);
  if (p === '/ads.txt') {
    const pub = (process.env.ADSENSE_CLIENT || DEFAULT_PUB).replace(/^ca-/, '').trim();
    res.writeHead(pub ? 200 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : 'not configured');
  }
  if (p === '/api/ping') return json(res, 200, { ok: true, online: [...clients.values()].filter(c => c.online).length, rooms: rooms.size });
  if (p === '/api/ranking') {
    const r = rankNow();
    const list = Object.entries(r.p).sort((a, b) => b[1].total - a[1].total).slice(0, 30).map(([nick, e]) => Object.assign({ nick }, e));
    return json(res, 200, { week: r.w, list });
  }
  if (p === '/api/result' && req.method === 'POST') {
    const b = await body(req);
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
    return json(res, 200, { ok: addResults(b.list, ip) });
  }

  // 게임 주소
  if (p === '/bluemarble' || p === '/bluemarble/') {
    if (p.endsWith('/')) { res.writeHead(301, { Location: '/bluemarble' }); return res.end(); }
    p = '/game.html';
  }
  if (p === '/johapjang') { res.writeHead(301, { Location: '/johapjang/' }); return res.end(); }
  if (p.startsWith('/johapjang/') && !p.includes('..')) {
    const rest = p.slice('/johapjang/'.length).replace(/^index\.html$/, '');
    const local = p.endsWith('/') ? p + 'index.html' : p;
    return proxyJohapjang(rest, res, () => serveStatic(local, res));
  }
  if (p.endsWith('/') && p !== '/') p += 'index.html';
  // 정적 파일
  serveStatic(p, res);
});

process.on('uncaughtException', e => console.error('uncaught', e));
server.listen(PORT, () => console.log(`부동산 공화국 서버 실행 중: http://localhost:${PORT}`));
