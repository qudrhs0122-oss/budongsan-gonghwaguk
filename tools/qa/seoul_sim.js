// QA검증팀: '나의 첫 서울 아파트' 헤드리스 대량 플레이 봇
// 사용: node tools/qa/seoul_sim.js [/tmp/seoul_all.js] [판수=40]
// 결과: JSON 한 줄 (errors 배열이 비어 있어야 통과). 크래시·NaN·엔딩 미도달을 잡는다.
const fs = require('fs');
global.localStorage = { _: {}, getItem(k) { return this._[k] || null }, setItem(k, v) { this._[k] = v } };
global.document = { addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] }, createElement() { return {} } };
global.window = global; global.navigator = {}; global.fetch = () => Promise.reject();
eval(fs.readFileSync(process.argv[2] || '/tmp/seoul_all.js', 'utf8') + `
global.ENDS_=ENDS;global.LOST=[];global.run=function(strat,mode,diff){
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
    const before=S.props.map(p=>({uid:p.uid,name:aptName(p),kind:p.kind})); const wasMarried=S.married>=0, kids0=S.kids.length;
    const r=nextTurn();
    if(!isFinite(nw())) errs.push('순자산 NaN t='+S.t);
    // [스토리 정합성] 가진 집·분양권·입주권이 말없이 사라지면 안 됨 (모든 알림 문구에 이름이 나와야 함)
    const said=JSON.stringify(r.msgs||[])+JSON.stringify(S.log.slice(0,12));
    for(const b of before) if(!S.props.some(p=>p.uid===b.uid) && !said.includes(b.name.replace(/ \(.*\)$/,''))) errs.push('스토리: '+b.kind+' "'+b.name+'"이(가) 안내 없이 사라짐 t='+S.t);
    for(const m of (r.msgs||[])) if(/계약이 해지|급매로 넘겼|현금청산/.test(m)) LOST.push(/계약이 해지/.test(m)?'분양권 잔금 부족 → 계약 해지(계약금 몰수)':/입주 직전 급매/.test(m)?'분양권 잔금 부족 → 입주 직전 급매':/분담금/.test(m)?'입주권 분담금 부족 → 급매':'입주권 현금청산');
    if(r.end) break;
    if(r.ev){ const E=r.ev.run();
      // [스토리 정합성] 이미 결혼했는데 청혼/결혼 제안, 미혼인데 배우자·육아 이야기
      const txt=E.t+' '+E.d;
      if(S.married>=0 && /결혼할까|결혼 이야기|청혼/.test(txt)) errs.push('스토리: 기혼인데 결혼 제안 이벤트 "'+E.t+'" t='+S.t);
      if(S.married<0 && /배우자|우리 아이|신혼/.test(txt) && !/신혼부부·다자녀|결혼/.test(txt)) errs.push('스토리: 미혼인데 배우자/아이 전제 이벤트 "'+E.t+'" t='+S.t);
      if(/분양권|입주권/.test(E.cat||'') && !S.props.some(p=>p.kind==='bun'||p.kind==='ipj')) errs.push('스토리: 분양권·입주권이 없는데 관련 이벤트 "'+E.t+'"');
      const ch=E.ch.filter(c=>!c.ok||c.ok()); if(!ch.length){errs.push('선택지 없음: '+r.ev.id);break;}
      for(const c of ch){ if(S.married>=0 && /결혼한다/.test(c.l)) errs.push('스토리: 기혼인데 "결혼한다" 선택지 ('+E.t+')'); if(/이미 .*했다면|\(.*라면\)/.test(c.l)) errs.push('스토리: 조건부 선택지 문구 노출 "'+c.l+'"'); }
      const c=ch[Math.floor(Math.random()*ch.length)]; try{c.f();}catch(e){errs.push('이벤트 '+r.ev.id+': '+e.message)} crisis(); }
    if(wasMarried && S.married<0) errs.push('스토리: 결혼 상태가 사라짐 t='+S.t);
    if(S.kids.length<kids0) errs.push('스토리: 자녀 수가 줄어듦 t='+S.t);
    if(S.married>=0 && S.married>S.t) errs.push('스토리: 결혼 시점이 미래 t='+S.t);
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
out.errors = [...new Set(out.errors.map(e => e.replace(/ t=\d+/, '')))].slice(0, 50);
out.distinctEndings = Object.keys(out.endings).length;
const lc = {}; for (const m of LOST) lc[m] = (lc[m] || 0) + 1; out.assetLost = Object.entries(lc).sort((a, b) => b[1] - a[1]).slice(0, 8); // 집·분양권을 잃은 사건 (스토리상 납득 가능한지 QA가 검토)
out.totalEndings = Object.keys(ENDS_).length;
out.neverReached = Object.keys(ENDS_).filter(k => !out.endings[k]);
console.log(JSON.stringify(out));
process.exit(out.errors.length ? 1 : 0);
