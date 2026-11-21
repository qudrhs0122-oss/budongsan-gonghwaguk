// 상황판(/hq) 결재 버튼 — 사장님이 누르면 결재함·안건 파일 상태를 GitHub 저장소에 바로 기록한다.
// 기록이 끝나면 다음 출근하는 개발팀이 '승인'된 안건을 구현한다.
//
// 사장님 확인: 처음 한 번 '사장님 코드'를 입력하면 이 브라우저에 1년짜리 서명 쿠키가 생긴다.
//   코드 원문은 어디에도 저장하지 않고, sha256 해시만 company/hq-owner.json 에 둔다.
// 저장: GH_TOKEN 으로 이 게임 저장소(MAIN_REPO)의 파일을 고쳐 커밋 ("[skip render]" — 재배포 없이 기록만).
//   커밋 권한이 없으면 서버 메모리에만 남기고(재시작 때 사라짐) 상황판에 경고를 띄운다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const MAIN_REPO = process.env.MAIN_REPO || 'qudrhs0122-oss/budongsan-gonghwaguk';
const BRANCH = process.env.MAIN_BRANCH || 'main';
const GH_TOKEN = process.env.GH_TOKEN || '';
const SECRET = process.env.SESSION_SECRET || process.env.THREADS_APP_SECRET || crypto.randomBytes(32).toString('hex');
const OWNER_FILE = path.join(__dirname, 'company', 'hq-owner.json');
const BOX = 'company/board/결재함.md';

const overlay = {}; // 번호 → { status, at } (상황판 즉시 표시용)
const DATA_REPO = process.env.GH_REPO || '';
const DATA_BRANCH = process.env.GH_BRANCH || 'main';
const ACT_PATH = 'hq/actions.json';
const { apply } = require('./company/hqapply');
let actions = [], actSha = null, mirrorOk = null;
let canWrite = null; // 저장소 커밋 가능 여부 (시작 때 확인)
const tries = new Map(); // IP별 코드 시도 횟수 (무차별 대입 방지)

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({ host: 'api.github.com', path: p, method, timeout: 20000, headers: { 'User-Agent': 'aptgame-hq', Authorization: 'Bearer ' + GH_TOKEN, Accept: 'application/vnd.github+json', ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } }, res => {
      let b = ''; res.on('data', d => b += d); res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} resolve({ status: res.statusCode, j }); });
    });
    r.on('error', () => resolve({ status: 0 })); r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
    if (data) r.write(data); r.end();
  });
}
const enc = p => p.split('/').map(encodeURIComponent).join('/');
async function getFile(p) { const r = await req('GET', `/repos/${MAIN_REPO}/contents/${enc(p)}?ref=${BRANCH}`); return r.status === 200 && r.j ? { sha: r.j.sha, text: Buffer.from(r.j.content, 'base64').toString('utf8') } : null; }
let lastErr = '';
async function putFile(p, text, sha, msg) { const r = await req('PUT', `/repos/${MAIN_REPO}/contents/${enc(p)}`, { message: msg, content: Buffer.from(text, 'utf8').toString('base64'), ...(sha ? { sha } : {}), branch: BRANCH }); const ok = r.status === 200 || r.status === 201; if (!ok) { lastErr = `GitHub ${r.status} ${(r.j && r.j.message) || ''}`.trim(); console.error('hq putFile', p, lastErr); } return ok; }

// 저장소 파일을 고치고 서버 로컬 사본도 같이 고쳐서 상황판에 즉시 반영
async function edit(rel, fn, msg) {
  const local = path.join(__dirname, rel);
  if (canWrite) {
    for (let i = 0; i < 3; i++) {
      const f = await getFile(rel); const cur = f ? f.text : '';
      const next = fn(cur); if (next == null || next === cur) return { ok: true, same: true };
      if (await putFile(rel, next, f && f.sha, msg + ' [skip render]')) { try { fs.mkdirSync(path.dirname(local), { recursive: true }); fs.writeFileSync(local, next); } catch (e) {} return { ok: true, saved: true }; }
    }
    return { ok: false, error: '저장소 기록 실패: ' + lastErr };
  }
  let cur = ''; try { cur = fs.readFileSync(local, 'utf8'); } catch (e) {}
  const next = fn(cur); if (next != null) try { fs.writeFileSync(local, next); } catch (e) {}
  return { ok: true, saved: false };
}

async function loadActions() {
  if (!GH_TOKEN || !DATA_REPO) return;
  const r = await req('GET', `/repos/${DATA_REPO}/contents/${ACT_PATH}?ref=${DATA_BRANCH}`);
  if (r.status === 200 && r.j) { actSha = r.j.sha; try { actions = JSON.parse(Buffer.from(r.j.content, 'base64').toString('utf8')); } catch (e) { actions = []; } }
  for (const a of actions) { try { apply(__dirname, a); if (a.type === 'decide') overlay[a.no] = { status: a.status, at: a.t }; } catch (e) {} } // 재배포 뒤에도 상황판에 반영
}
async function saveAction(a) {
  actions.push(a); if (actions.length > 500) actions = actions.slice(-500);
  if (!GH_TOKEN || !DATA_REPO) return { saved: false, err: 'GH_REPO 없음' };
  for (let i = 0; i < 3; i++) {
    const body = { message: `[HQ] ${a.type} ${a.no || a.dept || ''}`.trim(), content: Buffer.from(JSON.stringify(actions, null, 1)).toString('base64'), branch: DATA_BRANCH, ...(actSha ? { sha: actSha } : {}) };
    const r = await req('PUT', `/repos/${DATA_REPO}/contents/${ACT_PATH}`, body);
    if (r.status === 200 || r.status === 201) { actSha = r.j.content.sha; return { saved: true }; }
    if (r.status === 409 || r.status === 422) { const g = await req('GET', `/repos/${DATA_REPO}/contents/${ACT_PATH}?ref=${DATA_BRANCH}`); if (g.j) { actSha = g.j.sha; try { const remote = JSON.parse(Buffer.from(g.j.content, 'base64').toString('utf8')); const ids = new Set(actions.map(x => x.id)); actions = [...remote.filter(x => !ids.has(x.id)), ...actions]; } catch (e) {} } continue; }
    return { saved: false, err: `GitHub ${r.status} ${(r.j && r.j.message) || ''}` };
  }
  return { saved: false, err: '충돌 재시도 실패' };
}
async function mirror(files, msg) { // 게임 저장소에도 바로 기록 (GH_TOKEN에 게임 저장소 쓰기 권한이 있을 때만 성공)
  let ok = true;
  for (const rel of files) {
    let text = ''; try { text = fs.readFileSync(path.join(__dirname, rel), 'utf8'); } catch (e) { continue; }
    const f = await getFile(rel); if (f && f.text === text) continue;
    if (!(await putFile(rel, text, f && f.sha, msg + ' [skip render]'))) { ok = false; break; }
  }
  return ok;
}
async function act(a) { // 행동 기록(영구) + 서버 로컬 파일에 즉시 반영
  a.id = a.t.toString(36) + Math.random().toString(36).slice(2, 6);
  const changed = apply(__dirname, a);
  mirrorOk = await mirror([...changed, 'company/board/.hq_applied'].filter(f => { if (f !== 'company/board/.hq_applied') return true; try { fs.appendFileSync(path.join(__dirname, f), a.id + '\n'); } catch (e) {} return true; }), `[사장님 ${a.type === 'decide' ? '결재' : a.type === 'order' ? '지시' : '할 일'}] ${a.no || a.dept || ''}`.trim());
  const r = await saveAction(a);
  return r.saved ? { ok: true, saved: true } : { ok: false, error: '기록 실패: ' + r.err };
}

async function check() {
  if (!GH_TOKEN) { canWrite = false; return; }
  const r = await req('GET', `/repos/${MAIN_REPO}`);
  canWrite = !!(r.j && r.j.permissions && r.j.permissions.push);
}

/* ---------- 사장님 확인 ---------- */
const sign = v => crypto.createHmac('sha256', SECRET).update('hqowner|' + v).digest('hex').slice(0, 32);
function cookies(rq) { const o = {}; (rq.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return o; }
function isOwner(rq) { const v = cookies(rq).apt_ceo || ''; const [t, s] = v.split('.'); return !!(t && s && sign(t) === s); }
function ownerHash() { try { return JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8')).sha256 || ''; } catch (e) { return ''; } }

/* ---------- 상황판 로그인 (ID·비밀번호) ----------
   HQ_LOGIN 환경변수: "아이디:솔트(hex):scrypt해시(hex)" — 비밀번호 원문은 어디에도 저장하지 않는다. */
function checkLogin(id, pw) {
  const v = process.env.HQ_LOGIN || ''; const [uid, salt, hash] = v.split(':');
  if (!uid || !salt || !hash || String(id).trim() !== uid) return false;
  const h = crypto.scryptSync(String(pw), Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(h, Buffer.from(hash, 'hex'));
}
function setOwner(res) { const t = Date.now().toString(36); res.setHeader('Set-Cookie', `apt_ceo=${t}.${sign(t)}; Max-Age=${30 * 86400}; Path=/; HttpOnly; Secure; SameSite=Lax`); }
const LOGIN_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>AGENT HQ · 로그인</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070b14;color:#e6ecff;font:15px system-ui,'Noto Sans KR',sans-serif}form{box-sizing:border-box;width:min(340px,90vw);background:#0d1424;border:1px solid #1e2a44;border-radius:16px;padding:26px}h1{font:800 18px ui-monospace,monospace;letter-spacing:2px;margin:0 0 4px}p{color:#7d8bab;font-size:12px;margin:0 0 18px}input{width:100%;box-sizing:border-box;margin:6px 0;padding:12px;border-radius:10px;border:1px solid #1e2a44;background:#0a1120;color:#e6ecff;font-size:15px}button{width:100%;margin-top:10px;padding:12px;border:0;border-radius:10px;background:#2ee6a6;color:#04140e;font-weight:800;font-size:15px;cursor:pointer}#e{color:#ff5d6c;font-size:12px;min-height:16px;margin-top:8px}</style></head>
<body><form id="f"><h1>🏢 AGENT HQ</h1><p>부동산공화국 게임즈 · 대표 전용</p><input id="i" placeholder="아이디" autocomplete="username"><input id="w" type="password" placeholder="비밀번호" autocomplete="current-password"><button>로그인</button><div id="e"></div></form>
<script>document.getElementById('f').onsubmit=async e=>{e.preventDefault();const r=await fetch('/api/hq/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:document.getElementById('i').value,pw:document.getElementById('w').value})});if(r.ok)location.href='/hq/';else{const j=await r.json().catch(()=>({}));document.getElementById('e').textContent=j.error||'로그인 실패';}};</script></body></html>`;
function gate(rq, res, p) { // /hq/ 페이지와 /api/hq 데이터는 로그인한 사람만
  if (isOwner(rq)) return false;
  if (p === '/api/hq') { json(res, 401, { error: 'login' }); return true; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }); res.end(LOGIN_HTML); return true;
}

/* ---------- 결재 기록 ---------- */
const LABEL = { approve: '승인', reject: '반려' };
async function decide(no, decision, option) {
  const st = (LABEL[decision] || '승인') + (option ? `(${option})` : '');
  overlay[no] = { status: st, at: Date.now() };
  const r = await act({ t: Date.now(), type: 'decide', no, status: st });
  return { ...r, status: st };
}
const DEPTS = ['qa', 'dev', 'ops', 'briefing', 'marketing', 'revenue', 'planning', 'release', 'finance'];
const todo = (action, text) => act({ t: Date.now(), type: 'todo', action, text });
function order(dept, text) {
  const clean = String(text).replace(/[\r\n]+/g, ' ').replace(/\|/g, '/').trim().slice(0, 500);
  if (!clean) return { ok: false, error: '내용이 비었어요' };
  return act({ t: Date.now(), type: 'order', dept, text: clean });
}
const orderDel = text => act({ t: Date.now(), type: 'orderDel', text });

function readBody(rq) { return new Promise(r => { let b = ''; rq.on('data', d => { b += d; if (b.length > 4000) rq.destroy(); }); rq.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); }); }
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };

async function handle(rq, res, url) {
  const p = url.pathname;
  if (p === '/api/hq/login' && rq.method === 'POST') {
    const ip = (rq.headers['x-forwarded-for'] || '').split(',')[0] || rq.socket.remoteAddress;
    const n = (tries.get(ip) || 0) + 1; tries.set(ip, n); setTimeout(() => tries.delete(ip), 15 * 60e3).unref();
    if (n > 8) return json(res, 429, { error: '여러 번 틀려서 15분 뒤에 다시 시도해 주세요' }), true;
    const b = await readBody(rq);
    if (!process.env.HQ_LOGIN) return json(res, 503, { error: '로그인 설정 준비 중' }), true;
    if (!checkLogin(b.id || '', b.pw || '')) return json(res, 403, { error: '아이디 또는 비밀번호가 맞지 않아요' }), true;
    tries.delete(ip); setOwner(res); return json(res, 200, { ok: true }), true;
  }
  if (p === '/api/hq/logout') { res.setHeader('Set-Cookie', 'apt_ceo=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'); res.writeHead(302, { Location: '/hq/' }); res.end(); return true; }
  if (p === '/api/hq/owner' && rq.method === 'POST') { // 사장님 코드 확인 → 쿠키
    const ip = (rq.headers['x-forwarded-for'] || '').split(',')[0] || rq.socket.remoteAddress;
    const n = (tries.get(ip) || 0) + 1; tries.set(ip, n); if (n > 8) return json(res, 429, { error: '잠시 후 다시 시도해 주세요' }), true;
    const b = await readBody(rq); const h = ownerHash();
    if (!h || crypto.createHash('sha256').update(String(b.code || '').trim()).digest('hex') !== h) return json(res, 403, { error: '코드가 맞지 않아요' }), true;
    tries.delete(ip);
    const t = Date.now().toString(36);
    res.setHeader('Set-Cookie', `apt_ceo=${t}.${sign(t)}; Max-Age=${365 * 86400}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    return json(res, 200, { ok: true }), true;
  }
  if (p === '/api/hq/decide' && rq.method === 'POST') {
    if (!isOwner(rq)) return json(res, 401, { error: 'owner' }), true;
    const b = await readBody(rq);
    const no = String(b.no || ''); if (!/^[A-Z]{1,3}-\d{1,4}$/.test(no)) return json(res, 400, { error: '번호 형식' }), true;
    const opt = b.option ? String(b.option).slice(0, 4) : '';
    return json(res, 200, await decide(no, b.decision === 'reject' ? 'reject' : 'approve', opt)), true;
  }
  if ((p === '/api/hq/todo' || p === '/api/hq/order' || p === '/api/hq/order-del') && rq.method === 'POST') {
    if (!isOwner(rq)) return json(res, 401, { error: 'owner' }), true;
    const b = await readBody(rq);
    if (p === '/api/hq/todo') return json(res, 200, await todo(b.action === 'delete' ? 'delete' : 'done', String(b.text || ''))), true;
    if (p === '/api/hq/order-del') return json(res, 200, await orderDel(String(b.text || ''))), true;
    if (!DEPTS.includes(b.dept)) return json(res, 400, { error: '부서' }), true;
    return json(res, 200, await order(b.dept, b.text || '')), true;
  }
  return false;
}
function status(rq) { return { owner: isOwner(rq), canWrite: !!(GH_TOKEN && DATA_REPO), mirrorOk, overlay }; }
function start() { check().catch(() => { canWrite = false; }); loadActions().catch(e => console.error('hq actions', e.message)); }
module.exports = { handle, status, start, gate };
