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

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const RANK_FILE = path.join(__dirname, 'ranking.json');
const ROOM_SIZE = 4;
const DEFAULT_PUB = 'ca-pub-2150655592231599'; // 애드센스 게시자 ID
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

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url.replace(/^\/+/, '/'), 'http://x'); } catch (e) { res.writeHead(400); return res.end(); }
  const p = url.pathname;

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
    return json(res, 200, { ads: { client: /^ca-pub-\d{10,20}$/.test(client) ? client : '', test: process.env.ADSENSE_TEST === 'on', h5: process.env.ADSENSE_H5 === 'on', bannerSlot: (process.env.ADSENSE_BANNER_SLOT || '').replace(/\D/g, '') } });
  }
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

  // 정적 파일
  let rel; try { rel = decodeURIComponent(p === '/' ? '/index.html' : p); } catch (e) { res.writeHead(400); return res.end(); }
  let fp = path.normalize(path.join(PUBLIC, rel));
  if (!fp.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    fs.createReadStream(fp).pipe(res);
  });
});

process.on('uncaughtException', e => console.error('uncaught', e));
server.listen(PORT, () => console.log(`부동산 공화국 서버 실행 중: http://localhost:${PORT}`));
