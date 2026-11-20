// 스레드(Threads) 자동 게시 — 마케팅팀이 쓴 company/board/marketing/M-*.md 중
// '상태: 게시대기' + '예약: YYYY-MM-DD HH:MM'(한국 시간)이 지난 글을 사장님 스레드 계정에 올린다.
//
// 환경변수 (Render에 사장님이 직접 입력)
//   THREADS_APP_ID       Meta 개발자 앱의 Threads 앱 ID
//   THREADS_APP_SECRET   Threads 앱 시크릿 (토큰 암호화 키로도 사용)
//   THREADS_AUTO         off 로 두면 자동 게시 일시정지 (기본 on)
//   THREADS_DAILY        하루 최대 게시 수 (기본 3)
//   GH_TOKEN, GH_REPO    (accounts.js와 공용) 연결 정보를 암호화해 저장소에 영구 보관
//
// 공개된 '게시' 주소는 없다. 서버 안의 예약 작업만 게시하고, 연결 주소(/threads/connect)는
// 이미 연결된 계정과 다른 계정으로는 바꿀 수 없다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const APP_ID = process.env.THREADS_APP_ID || '';
const APP_SECRET = process.env.THREADS_APP_SECRET || '';
const SITE = (process.env.SITE_ORIGIN || 'https://aptgame.kr').replace(/\/$/, '');
const REDIRECT = SITE + '/threads/callback';
const SCOPES = 'threads_basic,threads_content_publish,threads_manage_insights';
const GH_TOKEN = process.env.GH_TOKEN || '', GH_REPO = process.env.GH_REPO || '', GH_BRANCH = process.env.GH_BRANCH || 'main';
const STORE_PATH = 'threads.json';
const LOCAL = path.join(__dirname, 'threads.json');
const MKT = path.join(__dirname, 'company', 'board', 'marketing');

let S = { conn: null, posted: {} }; // conn: { enc, uid, username, refreshedAt }
let ghSha = null, states = new Map();

/* ---------- 암호화 (토큰은 평문으로 어디에도 저장하지 않음) ---------- */
const KEY = crypto.createHash('sha256').update('threads|' + APP_SECRET).digest();
function enc(t) { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', KEY, iv); const d = Buffer.concat([c.update(t, 'utf8'), c.final()]); return [iv, c.getAuthTag(), d].map(b => b.toString('base64')).join('.'); }
function dec(s) { try { const [iv, tag, d] = s.split('.').map(x => Buffer.from(x, 'base64')); const c = crypto.createDecipheriv('aes-256-gcm', KEY, iv); c.setAuthTag(tag); return Buffer.concat([c.update(d), c.final()]).toString('utf8'); } catch (e) { return ''; } }

/* ---------- HTTP ---------- */
function req(method, host, p, body, headers = {}) {
  return new Promise(resolve => {
    const data = body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    const rq = https.request({ host, path: p, method, timeout: 20000, headers: { 'User-Agent': 'aptgame', ...headers, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } }, r => {
      let b = ''; r.on('data', d => b += d); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} resolve({ status: r.statusCode, j }); });
    });
    rq.on('error', () => resolve({ status: 0 })); rq.on('timeout', () => { rq.destroy(); resolve({ status: 0 }); });
    if (data) rq.write(data); rq.end();
  });
}
const form = o => new URLSearchParams(o).toString();
const TH = 'graph.threads.net';
const thGet = (p, q) => req('GET', TH, p + '?' + form(q));
const thPost = (p, q) => req('POST', TH, p, form(q), { 'Content-Type': 'application/x-www-form-urlencoded' });

/* ---------- 저장 ---------- */
const gh = (m, p, b) => req(m, 'api.github.com', p, b, { Authorization: 'Bearer ' + GH_TOKEN, Accept: 'application/vnd.github+json', ...(b ? { 'Content-Type': 'application/json' } : {}) });
async function load() {
  try { S = JSON.parse(fs.readFileSync(LOCAL, 'utf8')); } catch (e) {}
  if (GH_TOKEN && GH_REPO) {
    const r = await gh('GET', `/repos/${GH_REPO}/contents/${STORE_PATH}?ref=${GH_BRANCH}`);
    if (r.status === 200 && r.j && r.j.content) { ghSha = r.j.sha; try { S = JSON.parse(Buffer.from(r.j.content, 'base64').toString('utf8')); } catch (e) {} }
  }
  S.posted = S.posted || {};
}
async function save() {
  const txt = JSON.stringify(S, null, 1);
  try { fs.writeFileSync(LOCAL, txt); } catch (e) {}
  if (GH_TOKEN && GH_REPO) {
    const r = await gh('PUT', `/repos/${GH_REPO}/contents/${STORE_PATH}`, { message: 'threads state', content: Buffer.from(txt).toString('base64'), branch: GH_BRANCH, ...(ghSha ? { sha: ghSha } : {}) });
    if (r.j && r.j.content) ghSha = r.j.content.sha;
    else if (r.status === 409 || r.status === 422) { const g = await gh('GET', `/repos/${GH_REPO}/contents/${STORE_PATH}?ref=${GH_BRANCH}`); if (g.j) ghSha = g.j.sha; }
  }
}
const token = () => (S.conn && S.conn.enc ? dec(S.conn.enc) : '');

/* ---------- 마케팅 초안 읽기 ---------- */
const field = (t, k) => { const m = t.match(new RegExp('^\\s*' + k + '\\s*[:：]\\s*(.+)$', 'm')); return m ? m[1].trim() : ''; };
function drafts() {
  let fl = []; try { fl = fs.readdirSync(MKT).filter(f => /^M-\d+\.md$/.test(f)).sort(); } catch (e) {}
  return fl.map(f => {
    const t = fs.readFileSync(path.join(MKT, f), 'utf8');
    const post = ((t.match(/```threads\n([\s\S]*?)```/) || [])[1] || '').trim();
    const at = field(t, '예약').match(/(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
    const img = (field(t, '이미지').match(/public\/([\w\/.\-]+\.(?:jpg|jpeg|png))/i) || [])[1];
    return { id: f.slice(0, -3), status: field(t, '상태').split(/[\s(]/)[0], post, when: at ? Date.parse(`${at[1]}T${at[2].padStart(2, '0')}:${at[3]}:00+09:00`) : null, img: img ? `${SITE}/${img}` : '' };
  });
}
const kstDay = (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);

/* ---------- 게시 ---------- */
let busy = false;
async function publish(d) {
  const tk = token(), uid = S.conn.uid;
  const text = [...d.post].slice(0, 500).join('');
  let c = await thPost(`/v1.0/${uid}/threads`, d.img ? { media_type: 'IMAGE', image_url: d.img, text, access_token: tk } : { media_type: 'TEXT', text, access_token: tk });
  if (!(c.j && c.j.id) && d.img) c = await thPost(`/v1.0/${uid}/threads`, { media_type: 'TEXT', text, access_token: tk });
  if (!(c.j && c.j.id)) return { err: (c.j && c.j.error && c.j.error.message) || 'container ' + c.status };
  await new Promise(r => setTimeout(r, 30000)); // 컨테이너 처리 대기 (공식 권장 약 30초)
  const p = await thPost(`/v1.0/${uid}/threads_publish`, { creation_id: c.j.id, access_token: tk });
  if (!(p.j && p.j.id)) return { err: (p.j && p.j.error && p.j.error.message) || 'publish ' + p.status };
  const pl = await thGet(`/v1.0/${p.j.id}`, { fields: 'permalink', access_token: tk });
  return { media: p.j.id, url: (pl.j && pl.j.permalink) || '' };
}
async function tick() {
  if (busy || !S.conn || !token()) return; busy = true;
  try {
    const now = Date.now();
    // 토큰 갱신 (60일 만료 → 30일마다)
    if (now - (S.conn.refreshedAt || 0) > 30 * 864e5) {
      const r = await thGet('/refresh_access_token', { grant_type: 'th_refresh_token', access_token: token() });
      if (r.j && r.j.access_token) { S.conn.enc = enc(r.j.access_token); S.conn.refreshedAt = now; await save(); }
    }
    if ((process.env.THREADS_AUTO || 'on') !== 'off') {
      const h = new Date(now + 9 * 3600e3).getUTCHours();
      const today = Object.values(S.posted).filter(p => p.at && kstDay(p.at) === kstDay(now) && p.media).length;
      const due = drafts().filter(d => d.status === '게시대기' && d.post && d.when && d.when <= now && now - d.when < 2 * 864e5 && (!S.posted[d.id] || (S.posted[d.id].err && (S.posted[d.id].tries || 0) < 3 && now - S.posted[d.id].at > 30 * 60e3))).sort((a, b) => a.when - b.when)[0];
      if (due && h >= 7 && h < 24 && today < +(process.env.THREADS_DAILY || 3)) {
        const tries = (S.posted[due.id] || {}).tries || 0;
        S.posted[due.id] = { at: now, pending: true, tries }; await save();
        const r = await publish(due);
        S.posted[due.id] = r.media ? { at: now, media: r.media, url: r.url } : { at: now, err: String(r.err).slice(0, 200), tries: tries + 1 };
        await save();
      }
    }
    // 반응 수집 (최근 14일, 하루 1번)
    for (const [id, p] of Object.entries(S.posted)) {
      if (!p.media || now - p.at > 14 * 864e5 || now - (p.statAt || 0) < 864e5) continue;
      const r = await thGet(`/v1.0/${p.media}/insights`, { metric: 'views,likes,replies,reposts,quotes', access_token: token() });
      if (r.j && r.j.data) { p.stat = Object.fromEntries(r.j.data.map(m => [m.name, (m.values && m.values[0] && m.values[0].value) || (m.total_value && m.total_value.value) || 0])); p.statAt = now; }
    }
    await save();
  } catch (e) { console.error('threads tick', e.message); }
  busy = false;
}

/* ---------- 연결 (OAuth) ---------- */
async function handle(req, res, url) {
  const p = url.pathname;
  if (p === '/threads/uninstall' || p === '/threads/delete') { // Meta 앱 필수 콜백: 연결 해제·데이터 삭제 요청
    if (p === '/threads/delete' || p === '/threads/uninstall') { S.conn = null; await save(); }
    const code = crypto.randomBytes(6).toString('hex');
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ url: SITE + '/privacy.html', confirmation_code: code })); return true;
  }
  if (p === '/threads/connect') {
    if (!APP_ID || !APP_SECRET) { res.writeHead(302, { Location: '/hq/?threads=notready' }); return res.end(), true; }
    const st = crypto.randomBytes(12).toString('hex'); states.set(st, Date.now());
    const q = form({ client_id: APP_ID, redirect_uri: REDIRECT, scope: SCOPES, response_type: 'code', state: st });
    res.writeHead(302, { Location: 'https://threads.net/oauth/authorize?' + q }); res.end(); return true;
  }
  if (p === '/threads/callback') {
    const st = url.searchParams.get('state'), code = (url.searchParams.get('code') || '').replace(/#_$/, '');
    const go = m => { res.writeHead(302, { Location: '/hq/?threads=' + m }); res.end(); return true; };
    if (!st || !states.has(st) || Date.now() - states.get(st) > 600e3 || !code) return go('fail');
    states.delete(st);
    const a = await thPost('/oauth/access_token', { client_id: APP_ID, client_secret: APP_SECRET, grant_type: 'authorization_code', redirect_uri: REDIRECT, code });
    if (!(a.j && a.j.access_token)) return go('fail');
    const l = await thGet('/access_token', { grant_type: 'th_exchange_token', client_secret: APP_SECRET, access_token: a.j.access_token });
    const tk = (l.j && l.j.access_token) || a.j.access_token;
    const me = await thGet('/v1.0/me', { fields: 'id,username', access_token: tk });
    const uid = String((me.j && me.j.id) || a.j.user_id || '');
    if (!uid) return go('fail');
    if (S.conn && S.conn.uid && S.conn.uid !== uid) return go('locked'); // 다른 계정으로 바꿔치기 방지
    S.conn = { enc: enc(tk), uid, username: (me.j && me.j.username) || '', refreshedAt: Date.now(), connectedAt: Date.now() };
    await save();
    return go('ok');
  }
  return false;
}

function status() {
  const posted = {};
  for (const [k, v] of Object.entries(S.posted)) posted[k] = { at: v.at || null, url: v.url || '', err: v.err || '', stat: v.stat || null, pending: !!v.pending };
  return { ready: !!(APP_ID && APP_SECRET), connected: !!(S.conn && S.conn.uid), username: S.conn ? S.conn.username : '', auto: (process.env.THREADS_AUTO || 'on') !== 'off', daily: +(process.env.THREADS_DAILY || 3), posted };
}

async function start() {
  await load();
  // 재시작 때 '게시 중'으로 남은 표시는 실패로 간주해 재시도 (중복 게시 방지 위해 media 있는 건 그대로)
  for (const v of Object.values(S.posted)) if (v.pending && !v.media) { v.pending = false; v.err = '서버 재시작으로 확인 불가 — 중복 방지를 위해 다시 올리지 않음'; v.tries = 9; }
  setInterval(tick, 10 * 60e3); setTimeout(tick, 60e3);
}

module.exports = { start, handle, status };
