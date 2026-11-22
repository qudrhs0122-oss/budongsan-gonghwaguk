// 회사 상황판(/hq) 데이터: company/ 폴더(보고서·버그·기획안·결재함)를 읽어 한 번에 돌려준다.
// 부서들이 보고서를 push하면 Render가 재배포 → 상황판이 자동으로 최신이 된다.
const fs = require('fs');
const path = require('path');
const C = __dirname;

const DEPTS = [
  { id: 'qa', name: 'QA검증팀', unit: 'UNIT QA', icon: '🧪', color: '#5b8cff', when: { h: 3, m: 40 }, desks: [['bot-player', '봇 대량 플레이'], ['page-inspector', '페이지·화면 점검'], ['bug-reporter', '버그 접수']], tags: ['seoul_sim', 'smoke', 'run.sh'] },
  { id: 'dev', name: '개발팀', unit: 'UNIT DEV', icon: '🔧', color: '#ff5d8f', when: { h: 4, m: 37 }, desks: [['bug-fixer', '버그 수정'], ['gate-keeper', 'QA 게이트 확인'], ['deployer', '배포(Render)']], tags: ['src/seoul', 'johapjang', 'hotfix'] },
  { id: 'ops', name: '라이브운영·데이터팀', unit: 'UNIT OPS', icon: '📊', color: '#ff9f43', when: { h: 7, m: 10 }, desks: [['uptime-watch', '가동 확인'], ['data-analyst', '플레이 통계'], ['cs-desk', '이용자 신고']], tags: ['api/stats', 'ranking', 'metrics'] },
  { id: 'briefing', name: '경영지원실', unit: 'UNIT EXEC', icon: '📋', color: '#2ee6a6', when: { h: 8, m: 20 }, desks: [['chief-of-staff', '아침 브리핑'], ['approval-clerk', '결재함 정리'], ['weekly-writer', '주간 보고(월)']], tags: ['briefing', '결재함', 'push'] },
  { id: 'marketing', name: '마케팅팀', unit: 'UNIT MAR', icon: '📣', color: '#a3e635', when: { h: 10, m: 40 }, desks: [['threads-writer', '스레드 글 (매일)'], ['trend-scout', '부동산 화제 찾기'], ['store-copy', '스토어·공유 문구']], tags: ['threads', 'hook', 'cta'] },
  { id: 'release', name: '출시·플랫폼팀', unit: 'UNIT REL', icon: '🚀', color: '#38bdf8', when: { h: 15, m: 40, days: [1, 4] }, desks: [['store-scout', '새 마켓 조사·입점 준비'], ['build-packer', '앱 번들·스토어 자료'], ['review-tracker', '심사 상태·업데이트']], tags: ['toss', 'onestore', 'ms-store'] },
  { id: 'finance', name: '재무팀', unit: 'UNIT FIN', icon: '💵', color: '#facc15', when: { h: 20, m: 40, days: [1, 4] }, desks: [['ledger-keeper', '매출 장부'], ['report-reader', '애드센스·토스·쿠팡 리포트'], ['cost-watch', '비용·순이익']], tags: ['ledger', 'monthly', 'profit'] },
  { id: 'revenue', name: '수익화팀', unit: 'UNIT REV', icon: '💰', color: '#ffd166', when: { h: 15, m: 10, days: [2, 5] }, desks: [['ad-optimizer', '광고 배치·빈도'], ['funnel-analyst', '이탈·전환 분석'], ['biz-dev', '제휴·후원 수익원']], tags: ['adsense', 'rewarded', 'toss-ads'] },
  { id: 'planning', name: '기획(콘텐츠)팀', unit: 'UNIT PLN', icon: '🎨', color: '#c084fc', when: { h: 14, m: 20, days: [3] }, desks: [['news-scout', '부동산 뉴스'], ['event-designer', '이벤트 기획'], ['balance-tuner', '밸런스 조정']], tags: ['events.js', 'endings', 'policy'] },
];

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };
const ls = d => { try { return fs.readdirSync(d); } catch (e) { return []; } };
const field = (t, k) => { const m = t.match(new RegExp('^\\s*' + k + '\\s*[:：]\\s*(.+)$', 'm')); return m ? m[1].trim() : ''; };
const title = (t, fb) => { const m = t.match(/^#+\s*(.+)$/m); return (m ? m[1] : fb).trim().slice(0, 80); };
// 보고서 한 줄 결론: 제목 다음 첫 내용 줄
const gist = t => (t.split('\n').map(s => s.replace(/^[-*>\s#]+/, '').trim()).filter(s => s && !/^(한 ?줄( ?(요약|결론))?|결론|요약|오늘의 요약)\s*:?$/.test(s))[1] || '').slice(0, 90);

function items(dir, prefix) {
  return ls(path.join(C, dir)).filter(f => f.endsWith('.md')).sort().reverse().map(f => {
    const t = read(path.join(C, dir, f));
    const post = (t.match(/```threads\n([\s\S]*?)```/) || [])[1];
    return { id: f.replace(/\.md$/, ''), post: post ? post.trim() : '', channel: field(t, '채널'), when: field(t, '예약'), title: title(t, f), status: (field(t, '상태').split(/[\s(]/)[0] || '접수'), sev: field(t, '심각도').split(/[\s(/]/)[0], game: field(t, '게임'), text: t.slice(0, 4000) };
  });
}

function build() {
  const days = ls(path.join(C, 'reports')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  const reports = {};
  const feed = [];
  for (const d of days.slice(0, 30)) for (const f of ls(path.join(C, 'reports', d))) {
    const id = f.replace(/\.md$/, ''); const t = read(path.join(C, 'reports', d, f));
    (reports[id] = reports[id] || []).push({ date: d, gist: gist(t), text: t.slice(0, 6000) });
    if (feed.length < 40) feed.push({ date: d, dept: id, gist: gist(t) });
  }
  const depts = DEPTS.map(x => ({ ...x, reports: (reports[x.id] || []).slice(0, 7).map((r, i) => i ? { date: r.date, gist: r.gist } : r) }));
  const box = read(path.join(C, 'board', '결재함.md'));
  const pend = (box.split('## 처리 완료')[0].split('\n').filter(l => /^\|\s*[A-Z]+-?\d/.test(l))).map(l => { const c = l.split('|').map(s => s.trim()); return { no: c[1], dept: c[2], what: c[3], date: c[4], status: c[5] }; });
  const metrics = read(path.join(C, 'reports', 'metrics.csv')).trim().split('\n').slice(1).filter(Boolean).slice(-30).map(l => { const c = l.split(','); return { date: c[0], seoul: +c[1] || 0, jh: +c[2] || 0, memo: c.slice(3).join(',') }; });
  const orders = read(path.join(C, 'board', '지시사항.md')).split('\n').filter(l => /^- \[[ x]\] \(/.test(l)).map(l => { const m = l.match(/^- \[([ x])\] \(([a-z]+)\) (.*)$/); return m ? { done: m[1] === 'x', dept: m[2], text: m[3], raw: l.slice(6).trim() } : null; }).filter(Boolean);
  const csv = f => read(path.join(C, 'finance', f)).trim().split('\n').slice(1).filter(Boolean).map(l => l.split(','));
  const ledger = csv('ledger.csv').map(c => ({ date: c[0], src: c[1], period: c[2], krw: +c[3] || 0, status: c[4], memo: c.slice(5).join(',') }));
  const costs = csv('costs.csv').map(c => ({ date: c[0], item: c[1], krw: +c[2] || 0, status: c[3], memo: c.slice(4).join(',') }));
  const todo = read(path.join(C, 'board', '사장님할일.md')).split('\n').filter(l => /^- \[[ x]\]/.test(l)).map(l => {
    const text = l.slice(6).trim(); const link = (text.match(/🔗\s*(https?:\/\/\S+)/) || [])[1] || ''; const docP = (text.match(/📄\s*(company\/board\/[\w\/.\-가-힣]+\.md)/) || [])[1] || '';
    const doc = docP ? read(path.join(C, '..', docP)).slice(0, 8000) : '';
    return { done: l[3] === 'x', text, label: text.replace(/\s*🔗\s*\S+/, '').replace(/\s*📄\s*\S+/, '').trim(), link, doc };
  });
  return { now: Date.now(), ledger, costs, todo, orders, depts, bugs: items('board/bugs'), proposals: items('board/proposals'), marketing: items('board/marketing'), approvals: pend, metrics, feed, weekly: days.length };
}

module.exports = { build };
