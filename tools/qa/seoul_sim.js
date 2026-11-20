// QA검증팀: '나의 첫 서울 아파트' 헤드리스 대량 플레이 봇
// 사용: node tools/qa/seoul_sim.js [/tmp/seoul_all.js] [판수=40]
// 결과: JSON 한 줄 (errors 배열이 비어 있어야 통과). 크래시·NaN·엔딩 미도달을 잡는다.
const fs = require('fs');
global.localStorage = { _: {}, getItem(k) { return this._[k] || null }, setItem(k, v) { this._[k] = v } };
global.document = { addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] }, createElement() { return {} } };
global.window = global; global.navigator = {}; global.fetch = () => Promise.reject();
eval(fs.readFileSync(process.argv[2] || '/tmp/seoul_all.js', 'utf8') + `
global.ENDS_=ENDS;global.run=function(strat,mode,diff){
  newGame(mode,diff||'d5','봇',null); const W=strat; let guard=0; const errs=[];
  while(!S.ended && guard++<400){
    const opts=workOptions();
    if(S.biz) S.plan.work = S.hp<40?'bizlite':'bizrun';
    else if(S.hp<35) S.plan.work='rest';
    else S.plan.work = W.work==='mix'? (S.hp>70?'two':'main') : W.work;
    if(W.biz && S.t===6 && !S.biz) S.plan.work='biz';
    if(W.stock && S.cash>0.3 && S.t<30){ buyStock(W.stock, r2(S.cash*0.3)); }
    if(W.stock && S.t%6===5){ for(const k in S.stk) if(S.stk[k]>0) sellStock(k,S.stk[k]); }
    S.plan.ch = W.ch && isHomeless();
    if(W.buy){ const own=S.props.some(p=>p.kind==='buy'); if(!own){ const c=APTS.filter(a=>a.kind==='buy'&&S.avail[a.id]).map(a=>[a,buyQuote(a.id,'live')]).filter(x=>x[1].ok).sort((a,b)=>b[1].p-a[1].p)[0]; if(c) doBuy(c[0].id,'live'); } }
    for(const a of APTS) if(a.kind==='buy' && !(price(a.id)>0)) errs.push('아파트 가격 이상: '+a.id+' t='+S.t);
    const r=nextTurn();
    if(!isFinite(nw())) errs.push('순자산 NaN t='+S.t);
    if(r.end) break;
    if(r.ev){ const E=r.ev.run(); const ch=E.ch.filter(c=>!c.ok||c.ok()); if(!ch.length){errs.push('선택지 없음: '+r.ev.id);break;} const c=ch[Math.floor(Math.random()*ch.length)]; try{c.f();}catch(e){errs.push('이벤트 '+r.ev.id+': '+e.message)} crisis(); }
  }
  if(!S.ended) errs.push('엔딩 미도달(무한루프 의심)');
  return {e:S.ended, nw:nw(), own:S.props.some(p=>p.kind==='buy'), errs};
}`);
const N = +(process.argv[3] || 40);
const strats = { saver: { work: 'main', buy: 1 }, two: { work: 'two', buy: 1 }, mix: { work: 'mix', buy: 1, ch: 1 }, blue: { work: 'main', buy: 1, stock: 'blue' }, coin: { work: 'main', buy: 1, stock: 'coin' }, lev: { work: 'main', stock: 'lev' }, biz: { work: 'main', biz: 1, buy: 1 }, nobuy: { work: 'main' } };
const out = { games: 0, errors: [], runs: [], endings: {} };
for (const mode of ['hist', 'real']) for (const [n, st] of Object.entries(strats)) {
  const cnt = {}; let nwS = 0, own = 0;
  for (let i = 0; i < N; i++) {
    localStorage._ = {}; let r;
    try { r = run(st, mode); } catch (e) { out.errors.push(`${mode}/${n} 크래시: ${e.message}`); continue; }
    out.games++; cnt[r.e] = (cnt[r.e] || 0) + 1; out.endings[r.e] = (out.endings[r.e] || 0) + 1; nwS += r.nw; own += r.own;
    for (const e of r.errs) out.errors.push(`${mode}/${n} ${e}`);
  }
  out.runs.push({ cfg: `${mode}/${n}`, avgNW: +(nwS / N).toFixed(1), ownPct: Math.round(own / N * 100), top: Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4) });
}
out.errors = [...new Set(out.errors)].slice(0, 50);
out.distinctEndings = Object.keys(out.endings).length;
out.totalEndings = Object.keys(ENDS_).length;
out.neverReached = Object.keys(ENDS_).filter(k => !out.endings[k]);
console.log(JSON.stringify(out));
process.exit(out.errors.length ? 1 : 0);
