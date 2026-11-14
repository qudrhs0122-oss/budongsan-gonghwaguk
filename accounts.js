// aptgame.kr 계정(카카오 로그인) · 게임별 랭킹
// 환경변수
//   KAKAO_REST_KEY       카카오 디벨로퍼스 REST API 키 (없으면 로그인 비활성)
//   KAKAO_CLIENT_SECRET  (선택) 클라이언트 시크릿을 켰다면 입력
//   SESSION_SECRET       세션 쿠키 서명용 임의 문자열 (없으면 서버 재시작 때마다 로그아웃됨)
//   SITE_ORIGIN          기본 https://aptgame.kr
//   GH_TOKEN, GH_REPO    (선택) 랭킹 데이터를 GitHub 저장소 data 브랜치에 영구 보관 (예: qudrhs0122-oss/aptgame-data)
// 저장하는 정보: 카카오 회원번호를 서명키로 해시한 값(원본 번호 저장 안 함), 랭킹 닉네임, 게임별 최고 점수
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const SITE = (process.env.SITE_ORIGIN || 'https://aptgame.kr').replace(/\/$/, '');
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_FILE = path.join(__dirname, 'accounts.json');
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_REPO = process.env.GH_REPO || '';
const GH_PATH = 'accounts.json', GH_BRANCH = process.env.GH_BRANCH || 'main';
const SESSION_DAYS = 60;

const GAMES = {
  bluemarble: { n: '대한민국 부동산 부루마블', unit: '억', min: 0, max: 100000 },
  johapjang: { n: '재건축 조합장 키우기', unit: '점', min: -100, max: 200 },
  seoul: { n: '나의 첫 번째 서울 아파트 구하기', unit: '억', min: -1000, max: 5000 },
};

let DB = { users: {}, scores: {} };
let ghSha = null;

function weekKey(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600e3); // 한국 시간 기준
  const m = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
  return m.toISOString().slice(0, 10);
}

/* ---------- 저장소 ---------- */
function gh(method, p, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const rq = https.request({ host: 'api.github.com', path: p, method, headers: { 'User-Agent': 'aptgame', Authorization: 'Bearer ' + GH_TOKEN, Accept: 'application/vnd.github+json', ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) }, timeout: 15000 }, r => {
      let b = ''; r.on('data', d => b += d); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} resolve({ status: r.statusCode, j }); });
    });
    rq.on('error', () => resolve({ status: 0 })); rq.on('timeout', () => { rq.destroy(); resolve({ status: 0 }); });
    if (data) rq.write(data); rq.end();
  });
}
async function load() {
  try { DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) {}
  if (GH_TOKEN && GH_REPO) {
    const r = await gh('GET', `/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`);
    if (r.status === 200 && r.j && r.j.content) {
      ghSha = r.j.sha;
      try { DB = JSON.parse(Buffer.from(r.j.content, 'base64').toString('utf8')); } catch (e) {}
    }
  }
  DB.users = DB.users || {}; DB.scores = DB.scores || {};
}
let saveT = null, dirtyGH = false, ghT = null;
function save() {
  clearTimeout(saveT); saveT = setTimeout(() => fs.writeFile(DATA_FILE, JSON.stringify(DB), () => {}), 500);
  if (GH_TOKEN && GH_REPO) { dirtyGH = true; if (!ghT) ghT = setTimeout(pushGH, 20000); }
}
async function pushGH() {
  ghT = null; if (!dirtyGH) return; dirtyGH = false;
  const content = Buffer.from(JSON.stringify(DB)).toString('base64');
  let r = await gh('PUT', `/repos/${GH_REPO}/contents/${GH_PATH}`, { message: 'ranking update', content, branch: GH_BRANCH, ...(ghSha ? { sha: ghSha } : {}) });
  if (r.status === 409 || r.status === 422) { // sha 불일치 → 최신 sha로 재시도
    const g = await gh('GET', `/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`);
    ghSha = g.j && g.j.sha || null;
    r = await gh('PUT', `/repos/${GH_REPO}/contents/${GH_PATH}`, { message: 'ranking update', content, branch: GH_BRANCH, ...(ghSha ? { sha: ghSha } : {}) });
  }
  if (r.status === 200 || r.status === 201) ghSha = r.j.content.sha; else { dirtyGH = true; ghT = setTimeout(pushGH, 60000); }
}

/* ---------- 세션 ---------- */
const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function makeSession(uid) { const exp = Date.now() + SESSION_DAYS * 864e5; const v = `${uid}.${exp}`; return `${v}.${sign(v)}`; }
function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return o; }
function userOf(req) {
  const s = cookies(req).apt_s; if (!s) return null;
  const [uid, exp, sig] = s.split('.'); if (!uid || !sig) return null;
  const v = `${uid}.${exp}`;
  if (sig.length !== sign(v).length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(v)))) return null;
  if (+exp < Date.now() || !DB.users[uid]) return null;
  return Object.assign({ uid }, DB.users[uid]);
}
const cookieAttr = 'Path=/; HttpOnly; Secure; SameSite=Lax';
const setCookie = (res, v, maxAge) => res.setHeader('Set-Cookie', `apt_s=${v}; Max-Age=${maxAge}; ${cookieAttr}`);

/* ---------- 카카오 ---------- */
function form(host, p, params, headers = {}) {
  return new Promise(resolve => {
    const data = new URLSearchParams(params).toString();
    const rq = https.request({ host, path: p, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Content-Length': Buffer.byteLength(data), ...headers }, timeout: 10000 }, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { resolve({}); } }); });
    rq.on('error', () => resolve({})); rq.on('timeout', () => { rq.destroy(); resolve({}); });
    rq.write(data); rq.end();
  });
}
function getJSON(host, p, headers) {
  return new Promise(resolve => {
    const rq = https.request({ host, path: p, method: 'GET', headers, timeout: 10000 }, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { resolve({}); } }); });
    rq.on('error', () => resolve({})); rq.on('timeout', () => { rq.destroy(); resolve({}); }); rq.end();
  });
}
const REDIRECT = () => SITE + '/auth/kakao/callback';
const safeNext = n => (typeof n === 'string' && /^\/(?!\/)[\w\-./?=&%#]*$/.test(n) ? n : '/');
const cleanNick = s => String(s || '').replace(/[<>"'&\\\n\r\t]/g, '').trim().slice(0, 12);

/* ---------- 랭킹 ---------- */
function addScore(uid, g, score, label) {
  const G = GAMES[g]; if (!G || typeof score !== 'number' || !isFinite(score)) return null;
  score = Math.round(Math.min(G.max, Math.max(G.min, score)) * 10) / 10;
  label = String(label || '').replace(/[<>]/g, '').slice(0, 40);
  const t = DB.scores[g] = DB.scores[g] || {};
  const e = t[uid] = t[uid] || { best: null, plays: 0 };
  const now = Date.now(), wk = weekKey();
  e.plays++; e.last = now;
  let newBest = false;
  if (e.best === null || score > e.best) { e.best = score; e.label = label; e.at = now; newBest = true; }
  if (!e.wk || e.wk.w !== wk) e.wk = { w: wk, best: score, label, plays: 0 };
  else if (score > e.wk.best) { e.wk.best = score; e.wk.label = label; }
  e.wk.plays++;
  save();
  return { newBest, best: e.best, week: e.wk.best };
}
function board(g, period, uid) {
  const t = DB.scores[g] || {}, wk = weekKey();
  const rows = Object.entries(t).map(([u, e]) => period === 'week' ? (e.wk && e.wk.w === wk ? { u, s: e.wk.best, label: e.wk.label, plays: e.wk.plays } : null) : { u, s: e.best, label: e.label, plays: e.plays })
    .filter(r => r && r.s !== null && DB.users[r.u]).sort((a, b) => b.s - a.s);
  const list = rows.slice(0, 50).map((r, i) => ({ rank: i + 1, nick: DB.users[r.u].nick, s: r.s, label: r.label, plays: r.plays, me: r.u === uid }));
  const mi = uid ? rows.findIndex(r => r.u === uid) : -1;
  return { game: g, name: GAMES[g].n, unit: GAMES[g].unit, period, week: wk, total: rows.length, list, me: mi >= 0 ? { rank: mi + 1, s: rows[mi].s, label: rows[mi].label } : null };
}

/* ---------- 라우터 ---------- */
const lastScore = new Map();
async function handle(req, res, p, url, json, body) {
  if (p === '/auth/kakao') {
    if (!process.env.KAKAO_REST_KEY) { res.writeHead(302, { Location: '/ranking.html?err=notready' }); res.end(); return true; }
    const state = crypto.randomBytes(12).toString('base64url');
    const next = safeNext(url.searchParams.get('next'));
    res.setHeader('Set-Cookie', `apt_st=${state}|${encodeURIComponent(next)}; Max-Age=600; ${cookieAttr}`);
    const q = new URLSearchParams({ client_id: process.env.KAKAO_REST_KEY, redirect_uri: REDIRECT(), response_type: 'code', state });
    res.writeHead(302, { Location: 'https://kauth.kakao.com/oauth/authorize?' + q }); res.end(); return true;
  }
  if (p === '/auth/kakao/callback') {
    const ck = (cookies(req).apt_st || '').split('|'); const next = safeNext(decodeURIComponent(ck[1] || '/'));
    const fail = why => { res.writeHead(302, { Location: '/ranking.html?err=' + why }); res.end(); return true; };
    if (url.searchParams.get('error')) return fail('cancel');
    if (!ck[0] || ck[0] !== url.searchParams.get('state')) return fail('state');
    const tok = await form('kauth.kakao.com', '/oauth/token', { grant_type: 'authorization_code', client_id: process.env.KAKAO_REST_KEY, redirect_uri: REDIRECT(), code: url.searchParams.get('code') || '', ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}) });
    if (!tok.access_token) return fail('token');
    const me = await getJSON('kapi.kakao.com', '/v2/user/me', { Authorization: 'Bearer ' + tok.access_token });
    if (!me.id) return fail('profile');
    // 카카오 액세스 토큰은 회원번호·닉네임 확인에만 쓰고 바로 만료 처리(저장하지 않음)
    form('kapi.kakao.com', '/v1/user/logout', {}, { Authorization: 'Bearer ' + tok.access_token }).catch(() => {});
    const uid = 'k' + crypto.createHmac('sha256', SECRET + ':uid').update(String(me.id)).digest('hex').slice(0, 20);
    const kn = cleanNick(me.properties && me.properties.nickname || me.kakao_account && me.kakao_account.profile && me.kakao_account.profile.nickname);
    if (!DB.users[uid]) DB.users[uid] = { nick: kn || ('플레이어' + Math.floor(Math.random() * 9000 + 1000)), created: Date.now() };
    DB.users[uid].lastLogin = Date.now(); save();
    res.setHeader('Set-Cookie', [`apt_s=${makeSession(uid)}; Max-Age=${SESSION_DAYS * 86400}; ${cookieAttr}`, `apt_st=; Max-Age=0; ${cookieAttr}`]);
    res.writeHead(302, { Location: next + (next.includes('?') ? '&' : '?') + 'login=1' }); res.end(); return true;
  }
  if (p === '/auth/logout') { setCookie(res, '', 0); res.writeHead(302, { Location: safeNext(url.searchParams.get('next')) }); res.end(); return true; }

  if (p === '/api/me' && req.method === 'GET') {
    const u = userOf(req);
    json(res, 200, { ready: !!process.env.KAKAO_REST_KEY, user: u ? { nick: u.nick, created: u.created, best: Object.fromEntries(Object.keys(GAMES).map(g => [g, (DB.scores[g] || {})[u.uid] ? DB.scores[g][u.uid].best : null])) } : null });
    return true;
  }
  if (p === '/api/me' && req.method === 'POST') {
    const u = userOf(req); if (!u) { json(res, 401, { ok: false }); return true; }
    const b = await body(req); const n = cleanNick(b.nick);
    if (n.length < 2) { json(res, 400, { ok: false, error: '닉네임은 2~12자로 정해 주세요.' }); return true; }
    if (Object.entries(DB.users).some(([k, v]) => k !== u.uid && v.nick === n)) { json(res, 409, { ok: false, error: '이미 쓰고 있는 닉네임이에요.' }); return true; }
    DB.users[u.uid].nick = n; save(); json(res, 200, { ok: true, nick: n }); return true;
  }
  if (p === '/api/me/delete' && req.method === 'POST') {
    const u = userOf(req); if (!u) { json(res, 401, { ok: false }); return true; }
    delete DB.users[u.uid]; Object.values(DB.scores).forEach(t => delete t[u.uid]); save();
    setCookie(res, '', 0); json(res, 200, { ok: true }); return true;
  }
  if (p === '/api/score' && req.method === 'POST') {
    const u = userOf(req); if (!u) { json(res, 401, { ok: false, error: 'login' }); return true; }
    const now = Date.now(); if (now - (lastScore.get(u.uid) || 0) < 5000) { json(res, 429, { ok: false }); return true; }
    lastScore.set(u.uid, now);
    const b = await body(req); const r = addScore(u.uid, String(b.g || ''), Number(b.s), b.label);
    if (!r) { json(res, 400, { ok: false }); return true; }
    const bd = board(String(b.g), 'week', u.uid);
    json(res, 200, { ok: true, ...r, weekRank: bd.me && bd.me.rank, weekTotal: bd.total }); return true;
  }
  if (p === '/api/board') {
    const g = String(url.searchParams.get('g') || 'seoul'); if (!GAMES[g]) { json(res, 400, { ok: false }); return true; }
    const u = userOf(req);
    json(res, 200, board(g, url.searchParams.get('p') === 'all' ? 'all' : 'week', u && u.uid)); return true;
  }
  return false;
}

module.exports = { load, handle, GAMES };
