// QA검증팀: '나의 첫 서울 아파트' 헤드리스 대량 플레이 봇
// 사용: node tools/qa/seoul_sim.js [/tmp/seoul_all.js] [판수=40]
// 결과: JSON 한 줄 (errors 배열이 비어 있어야 통과). 크래시·NaN·엔딩 미도달을 잡는다.
const fs = require('fs');
global.localStorage = { _: {}, getItem(k) { return this._[k] || null }, setItem(k, v) { this._[k] = v } };
global.document = { addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] }, createElement() { return {} } };
global.window = global; global.navigator = {}; global.fetch = () => Promise.reject();
eval(fs.readFileSync(process.argv[2] || '/tmp/seoul_all.js', 'utf8') + `
global.ENDS_=ENDS;global.LOST=[];global.WARN=[];global.run=function(strat,mode,diff){
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
    // [화면 정합성] '매수 가능' 버튼이 켜졌는데 [실거주로 매수하고 입주]가 실패하는 경우 (BUG-20261121-1 수정완료 → 11/22 오류로 승격)
    // 화면 동작 그대로: 슬라이더 기본값=최대, 최댓값 근처면 실제 한도(q.lim.max) 사용 → doBuy를 실제로 불러 보고 상태는 되돌린다
    { const snap=JSON.stringify(S); for(const a of APTS){ if(a.kind!=='buy'||!S.avail[a.id]) continue; const q=buyQuote(a.id,'live'); if(!q.ok) continue; const ok=doBuy(a.id,'live',q.lim.max>0?q.lim.max:0); S=JSON.parse(snap); if(!ok){ errs.push('화면: 매수 가능 표시인데 실거주 매수 실패 '+a.id); break; } } }
    const before=S.props.map(p=>({uid:p.uid,name:aptName(p),kind:p.kind,prep:!!p.prepShown})); const wasMarried=S.married>=0, kids0=S.kids.length;
    const r=nextTurn();
    if(!isFinite(nw())) errs.push('순자산 NaN t='+S.t);
    // [스토리 정합성] 가진 집·분양권·입주권이 말없이 사라지면 안 됨 (모든 알림 문구에 이름이 나와야 함)
    const said=JSON.stringify(r.msgs||[])+JSON.stringify(S.log.slice(0,12));
    for(const b of before) if(!S.props.some(p=>p.uid===b.uid) && !said.includes(b.name.replace(/ \(.*\)$/,''))) errs.push('스토리: '+b.kind+' "'+b.name+'"이(가) 안내 없이 사라짐 t='+S.t);
    // [스토리 정합성] 분양권이 잔금 부족으로 해지·급매될 때는 반드시 그 전에 '입주 1년 전 — 잔금 준비'(해지 위기) 안내를 봤어야 함 (BUG-20261120-2, 사장님 지시 11/21)
    for(const b of before) if(b.kind==='bun' && !S.props.some(p=>p.uid===b.uid) && /계약이 해지|입주 직전 급매/.test(JSON.stringify(r.msgs||[])) && !b.prep) errs.push('스토리: 분양권 "'+b.name+'"이(가) 잔금 준비 안내 없이 해지·급매됨');
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
      // [스토리 정합성] 이미 선택을 마친 '한 번뿐인' 사건이 다시 나옴 (BUG-20261122-1 수정완료 → 11/23 오류로 승격)
      if(r.ev.id==='special' && S.flags.qaSpecial) errs.push('스토리: 특별공급 자격 발생이 또 나옴(이미 등록함)');
      if(r.ev.id==='blog' && S.flags.qaBlog) errs.push('스토리: 블로그를 접었는데 또 블로그 수익화 성공');
      if(r.ev.id==='store' && S.flags.qaStore) errs.push('스토리: 스마트스토어를 이미 해 봤는데 같은 창업 제안');
      if(r.ev.id==='bigco' && S.flags.qaBigco) errs.push('스토리: 대기업 경력직 합격이 또 나옴');
      // [사실성] 2015 모드의 실제 역사 구간(HIST)에서 임의 '기준금리 인하' 이벤트로 실제와 다른 금리가 표시됨 (BUG-20261123-3 수정완료 → 11/24 오류로 승격)
      if(r.ev.id==='rateDown' && S.mode==='hist' && S.t<HIST.length) errs.push('사실성: 2015 모드 실제 금리 구간(2015~2025년)에 가상 "기준금리 인하" 이벤트');
      if(r.ev.id==='special') S.flags.qaSpecial=1; if(r.ev.id==='blog') S.flags.qaBlog=1; if(r.ev.id==='bigco') S.flags.qaBigco=1;
      // [스토리 정합성] 이미 집이 있는데 '집부터 마련하고 결혼하자/낳자' 선택지 (BUG-20261124-1, 경고 → 수정완료 후 오류로 승격)
      { const hc=ch.find(c=>/집부터 마련하고/.test(c.l)); if(hc && S.props.some(p=>p.kind==='buy')) WARN.push('스토리: 집이 있는데 "'+hc.l+'" 선택지 ('+E.t+')'); }
      const c=ch[Math.floor(Math.random()*ch.length)]; if(r.ev.id==='store' && /해 본다/.test(c.l)) S.flags.qaStore=1; const cr0=S.credit; try{c.f();}catch(e){errs.push('이벤트 '+r.ev.id+': '+e.message)}
      // [화면 정합성] 잔금 준비 카드 ③ 설명에 적힌 신용대출 금액 = 실제로 늘어난 신용대출 (BUG-20261122-2 수정완료 → 11/23 오류 검사 추가)
      if(r.ev.id==='bunPrep' && /신용대출로 메운다/.test(c.l) && c.s && !c.s.includes('신용대출 '+won(r2(S.credit-cr0)))) errs.push('화면: 잔금 준비 카드 신용대출 표시('+c.s+')와 실제('+won(r2(S.credit-cr0))+')가 다름');
      crisis(); }
    if(wasMarried && S.married<0) errs.push('스토리: 결혼 상태가 사라짐 t='+S.t);
    if(S.kids.length<kids0) errs.push('스토리: 자녀 수가 줄어듦 t='+S.t);
    if(S.married>=0 && S.married>S.t) errs.push('스토리: 결혼 시점이 미래 t='+S.t);
  }
  if(!S.ended) errs.push('엔딩 미도달(무한루프 의심)');
  // [스토리 정합성] 집을 산 적이 있는데 '20년 동안 서울 집을 사지 못한' 엔딩 (BUG-20261121-2 수정완료 → 11/23 오류로 승격)
  if(S.ended==='e29' && S.everOwned) errs.push("스토리: 집을 산 적 있는데 e29 서울 집값에 패배(20년 동안 집을 사지 못함) 엔딩");
  // [스토리 정합성] '집도 경매'(e17)·'집을 넘기던 날'(e25) 엔딩인데 끝날 때 집을 그대로 갖고 있음 (BUG-20261123-1 수정완료 → 11/24 오류로 승격)
  if((S.ended==='e17'||S.ended==='e25') && S.props.some(p=>p.kind==='buy')) errs.push('스토리: 집을 그대로 가진 채 '+S.ended+(S.ended==='e17'?' 사업 실패, 집도 경매':' 영끌의 최후(집을 넘김)')+' 엔딩'+(S.t<MAXT?' (중도 종료)':''));
  // [스토리 정합성] 엔딩 공유 문구의 기간이 실제 플레이 기간과 맞아야 함 — 중도 종료인데 '20년 버텼는데' (BUG-20261124-3, 경고 → 수정완료 후 오류로 승격)
  if(S.ended && typeof shareEnding==='function'){ let sh=''; navigator.share=o=>{sh=o.text;return Promise.resolve();}; try{shareEnding(S.ended);}catch(e){errs.push('공유 문구 오류: '+e.message)} delete navigator.share;
    if(S.t<MAXT-1 && /20년/.test(sh)) WARN.push('공유: '+S.ended+' 중도 종료인데 공유 문구에 "20년"'); }
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
const wc = {}; for (const m of WARN) wc[m] = (wc[m] || 0) + 1; out.warnings = Object.entries(wc).sort((a, b) => b[1] - a[1]); // 경고: 게이트는 통과시키되 매일 보고 (해당 버그 수정완료 후 errors로 승격)
out.totalEndings = Object.keys(ENDS_).length;
out.neverReached = Object.keys(ENDS_).filter(k => !out.endings[k]);
console.log(JSON.stringify(out));
process.exit(out.errors.length ? 1 : 0);
