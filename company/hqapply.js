// 상황판에서 사장님이 누른 행동(결재·할 일·지시)을 company/ 파일에 반영하는 공용 로직.
// 서버(hqdecide.js)와 부서 출근 때 돌리는 tools/hq_sync.js 가 같이 쓴다. 같은 행동을 두 번 적용해도 결과가 같도록(멱등) 만든다.
const fs = require('fs');
const path = require('path');

const BOX = 'company/board/결재함.md', TODO = 'company/board/사장님할일.md', ORD = 'company/board/지시사항.md';
const ORD_HEAD = '# 📮 대표 지시사항\n\n사장님이 상황판에서 부서를 골라 지시를 남기면 여기에 쌓인다. 각 부서는 출근하자마자 자기 부서 줄을 먼저 처리하고, `[ ]`를 `[x]`로 바꾼 뒤 줄 끝에 `→ 결과: …`를 붙인다.\n\n';
const kst = t => new Date(t + 9 * 3600e3).toISOString();

function mutate(root, rel, fn) {
  const f = path.join(root, rel); let cur = ''; try { cur = fs.readFileSync(f, 'utf8'); } catch (e) {}
  const next = fn(cur); if (next == null || next === cur) return false;
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, next); return true;
}

// a: { id, t, type, ... }
function apply(root, a) {
  const day = kst(a.t).slice(0, 10), stamp = kst(a.t).slice(0, 16).replace('T', ' ');
  const changed = [];
  if (a.type === 'decide') {
    const st = a.status;
    if (mutate(root, BOX, text => {
      const lines = text.split('\n');
      const i = lines.findIndex(l => new RegExp('^\\|\\s*' + a.no.replace(/-/g, '\\-') + '\\s*\\|').test(l));
      if (i < 0) return null;
      const c = lines[i].split('|').map(x => x.trim());
      if (c[5] && c[5].startsWith(st)) return null; // 이미 반영됨
      const row = `| ${c[1]} | ${c[2]} | ${c[3]} | ${c[4]} | ${st} (사장님 ${day}) |`;
      lines.splice(i, 1);
      const done = lines.findIndex(l => /^## 처리 완료/.test(l));
      if (done >= 0) { let k = done + 1; while (k < lines.length && !/^\|/.test(lines[k])) k++; while (k < lines.length && /^\|\s*(번호|---)/.test(lines[k])) k++; lines.splice(k, 0, row); } else lines.push(row);
      return lines.join('\n');
    })) changed.push(BOX);
    for (const dir of ['company/board/proposals', 'company/board/marketing', 'company/board/bugs']) {
      const rel = `${dir}/${a.no}.md`; if (!fs.existsSync(path.join(root, rel))) continue;
      if (mutate(root, rel, t => { const line = `상태: ${st} (사장님 결재 ${day})`; if (t.includes(line)) return null; return /^\s*상태\s*[:：].*$/m.test(t) ? t.replace(/^(\s*상태\s*[:：]).*$/m, `$1 ${st} (사장님 결재 ${day})`) : line + '\n' + t; })) changed.push(rel);
      break;
    }
  } else if (a.type === 'todo') {
    if (mutate(root, TODO, t => {
      const lines = t.split('\n'); const i = lines.findIndex(l => /^- \[[ x]\] /.test(l) && l.slice(6).trim() === a.text.trim());
      if (i < 0) return null;
      if (a.action === 'delete') lines.splice(i, 1); else if (lines[i][3] === 'x') return null; else lines[i] = '- [x] ' + lines[i].slice(6);
      return lines.join('\n');
    })) changed.push(TODO);
  } else if (a.type === 'order') {
    const line = `- [ ] (${a.dept}) ${a.text} — 지시 ${stamp}`;
    if (mutate(root, ORD, t => (t.includes(`(${a.dept}) ${a.text} — 지시 ${stamp}`) ? null : (t || ORD_HEAD) + line + '\n'))) changed.push(ORD);
  } else if (a.type === 'orderDel') {
    if (mutate(root, ORD, t => { const lines = t.split('\n'); const i = lines.findIndex(l => l.slice(6).trim() === a.text.trim()); if (i < 0) return null; lines.splice(i, 1); return lines.join('\n'); })) changed.push(ORD);
  }
  return changed;
}

module.exports = { apply };
