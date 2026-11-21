// 부서 출근 때 실행: 상황판에서 사장님이 누른 행동(결재·할 일·지시)을 이 저장소 company/ 파일에 반영한다.
// 사용: node tools/hq_sync.js /home/claude/aptgame-data   (aptgame-data 비공개 저장소의 hq/actions.json 을 읽음)
// 반영한 행동 id는 company/board/.hq_applied 에 기록해서 다시 적용하지 않는다. 바뀐 파일 목록을 출력한다.
const fs = require('fs'), path = require('path');
const { apply } = require('../company/hqapply');
const root = path.resolve(__dirname, '..');
const dataDir = process.argv[2] || '/home/claude/aptgame-data';
let acts = []; try { acts = JSON.parse(fs.readFileSync(path.join(dataDir, 'hq', 'actions.json'), 'utf8')); } catch (e) { console.log('행동 기록 없음(아직 상황판 사용 전이거나 경로 확인 필요):', e.message); process.exit(0); }
const appliedF = path.join(root, 'company', 'board', '.hq_applied');
const applied = new Set((fs.existsSync(appliedF) ? fs.readFileSync(appliedF, 'utf8') : '').split('\n').filter(Boolean));
const changed = new Set(); let n = 0;
for (const a of acts.sort((x, y) => x.t - y.t)) { if (!a.id || applied.has(a.id)) continue; for (const f of apply(root, a)) changed.add(f); applied.add(a.id); n++; console.log('반영:', a.type, a.no || a.dept || '', a.status || a.action || '', (a.text || '').slice(0, 40)); }
fs.writeFileSync(appliedF, [...applied].join('\n') + '\n');
console.log(`새로 반영 ${n}건, 바뀐 파일: ${[...changed].join(', ') || '없음'}`);
