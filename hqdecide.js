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

const overlay = {}; // 번호 → { status, at } (재배포 전까지 상황판에 즉시 반영)
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
async function putFile(p, text, sha, msg) { const r = await req('PUT', `/repos/${MAIN_REPO}/contents/${enc(p)}`, { message: msg, content: Buffer.from(text, 'utf8').toString('base64'), sha, branch: BRANCH }); return r.status === 200 || r.status === 201; }

// 저장소 파일을 고치고 서버 로컬 사본도 같이 고쳐서 상황판에 즉시 반영
async function edit(rel, fn, msg) {
  const local = path.join(__dirname, rel);
  if (canWrite) {
    for (let i = 0; i < 3; i++) {
      const f = await getFile(rel); const cur = f ? f.text : '';
      const next = fn(cur); if (next == null || next === cur) return { ok: true, same: true };
      if (await putFile(rel, next, f && f.sha, msg + ' [skip render]')) { try { fs.mkdirSync(path.dirname(local), { recursive: true }); fs.writeFileSync(local, next); } catch (e) {} return { ok: true, saved: true }; }
    }
    return { ok: false, error: '저장소 기록 실패' };
  }
  let cur = ''; try { cur = fs.readFileSync(local, 'utf8'); } catch (e) {}
  const next = fn(cur); if (next != null) try { fs.writeFileSync(local, next); } catch (e) {}
  return { ok: true, saved: false };
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

/* ---------- 결재 기록 ---------- */
const LABEL = { approve: '승인', reject: '반려' };
async function decide(no, decision, option) {
  const st = (LABEL[decision] || '승인') + (option ? `(${option})` : '');
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  overlay[no] = { status: st, at: Date.now() };
  const r = await edit(BOX, text => {
    const lines = text.split('\n');
    const i = lines.findIndex(l => new RegExp('^\\|\\s*' + no.replace(/-/g, '\\-') + '\\s*\\|').test(l));
    if (i < 0) return null;
    const c = lines[i].split('|').map(x => x.trim());
    const row = `| ${c[1]} | ${c[2]} | ${c[3]} | ${c[4]} | ${st} (사장님 ${today}) |`;
    lines.splice(i, 1);
    const done = lines.findIndex(l => /^## 처리 완료/.test(l));
    if (done >= 0) { let k = done + 1; while (k < lines.length && !/^\|/.test(lines[k])) k++; while (k < lines.length && /^\|\s*(번호|---)/.test(lines[k])) k++; lines.splice(k, 0, row); } else lines.push(row);
    return lines.join('\n');
  }, `[사장님 결재] ${no} ${st}`);
  for (const dir of ['company/board/proposals', 'company/board/marketing', 'company/board/bugs']) {
    if (!fs.existsSync(path.join(__dirname, dir, no + '.md'))) continue;
    await edit(`${dir}/${no}.md`, t => /^\s*상태\s*[:：].*$/m.test(t) ? t.replace(/^(\s*상태\s*[:：]).*$/m, `$1 ${st} (사장님 결재 ${today})`) : `상태: ${st} (사장님 결재 ${today})\n` + t, `[사장님 결재] ${no} ${st}`);
    break;
  }
  return { ok: r.ok, saved: !!r.saved, status: st };
}

const TODO = 'company/board/사장님할일.md', ORD = 'company/board/지시사항.md';
const DEPTS = ['qa', 'dev', 'ops', 'briefing', 'marketing', 'revenue', 'planning', 'release'];
const ORD_HEAD = '# 📮 대표 지시사항\n\n사장님이 상황판에서 부서를 골라 지시를 남기면 여기에 쌓인다. 각 부서는 출근하자마자 자기 부서 줄을 먼저 처리하고, `[ ]`를 `[x]`로 바꾼 뒤 줄 끝에 `→ 결과: …`를 붙인다.\n\n';
async function todo(action, text) {
  return edit(TODO, t => {
    const lines = t.split('\n'); const i = lines.findIndex(l => /^- \[[ x]\] /.test(l) && l.slice(6).trim() === text.trim());
    if (i < 0) return null;
    if (action === 'delete') lines.splice(i, 1); else lines[i] = '- [x] ' + lines[i].slice(6) + (action === 'done' ? '' : '');
    return lines.join('\n');
  }, `[사장님] 할 일 ${action === 'delete' ? '삭제' : '완료'}`);
}
async function order(dept, text) {
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  const clean = String(text).replace(/[\r\n]+/g, ' ').replace(/\|/g, '/').trim().slice(0, 500);
  if (!clean) return { ok: false, error: '내용이 비었어요' };
  return edit(ORD, t => (t || ORD_HEAD) + `- [ ] (${dept}) ${clean} — 지시 ${today}\n`, `[사장님 지시] ${dept}`);
}
async function orderDel(text) {
  return edit(ORD, t => { const lines = t.split('\n'); const i = lines.findIndex(l => l.slice(6).trim() === text.trim()); if (i < 0) return null; lines.splice(i, 1); return lines.join('\n'); }, '[사장님 지시] 취소');
}

function readBody(rq) { return new Promise(r => { let b = ''; rq.on('data', d => { b += d; if (b.length > 4000) rq.destroy(); }); rq.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); }); }
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };

async function handle(rq, res, url) {
  const p = url.pathname;
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
function status(rq) { return { owner: isOwner(rq), canWrite, overlay }; }
function start() { check().catch(() => { canWrite = false; }); }
module.exports = { handle, status, start };
