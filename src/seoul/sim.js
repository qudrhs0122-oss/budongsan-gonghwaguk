const fs=require('fs');
global.localStorage={_:{},getItem(k){return this._[k]??null},setItem(k,v){this._[k]=v}};
global.document={querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{},setAttribute(){},appendChild(){}}),head:{appendChild(){}},body:{appendChild(){}}};
global.fetch=()=>Promise.reject();global.navigator={};
eval(fs.readFileSync('all.js','utf8')+';global.API={newGame,nextTurn,EVENTS,drawEvent,buyQuote,doBuy,sellProp,buyBun,buyIpj,nw,debtTotal,rules,price,APTS,AP,get S(){return S},set S(v){S=v},isHomeless,changeRes:null,liveHome,reNW,propValue,crisis}');
const A=global.API;
function play(mode,diff,strat){
  A.newGame(mode,diff,'t','old'); const S=()=>A.S; let errs=[];
  for(let i=0;i<60 && !S().ended;i++){
    // 전략
    if(strat!=='none'){
      if(strat==='buy'||strat==='ch'){
        if(!S().props.length && (strat==='buy'||S().t>16)){ const c=A.APTS.filter(a=>a.kind==='buy'&&S().avail[a.id]).map(a=>[a,A.buyQuote(a.id,'live')]).filter(x=>x[1].ok).sort((a,b)=>b[1].p-a[1].p)[0]; if(c) A.doBuy(c[0].id,'live'); }
        // 갈아타기: 순자산 여유
        const h=A.liveHome(); if(strat==='buy'&&h&&S().t-h.buyT>=5&&Math.random()<.3){ const v=A.propValue(h); const tgt=A.APTS.filter(a=>a.kind==='buy'&&A.price(a.id)>v*1.3); if(tgt.length){ const snap=JSON.stringify(S()); A.sellProp(h); const c=tgt.map(a=>[a,A.buyQuote(a.id,'live')]).filter(x=>x[1].ok).sort((a,b)=>b[1].p-a[1].p)[0]; if(c) A.doBuy(c[0].id,'live'); else A.S=JSON.parse(snap); } }
        // 대출 상환
        for(const p of S().props) if(p.loan>0&&S().cash>1){const a=Math.min(p.loan,S().cash-1);p.loan-=a;S().cash-=a;}
        if(S().credit>0&&S().cash>0){const a=Math.min(S().credit,S().cash);S().credit-=a;S().cash-=a;}
      }
      if(strat==='gap'&&A.rules().gap&&S().cash>1){ const c=A.APTS.filter(a=>a.kind==='buy').map(a=>[a,A.buyQuote(a.id,'gap')]).filter(x=>x[1].ok&&x[1].cashNeed<S().cash*.95).sort((a,b)=>b[1].p-a[1].p)[0]; if(c&&S().props.length<4) A.doBuy(c[0].id,'gap'); }
      if(strat==='gap') for(const p of [...S().props]) if(p.tenant&&S().t-p.buyT>=6&&A.propValue(p)>p.buyP*1.3) A.sellProp(p);
      if(strat==='ipj'&&!S().props.length){ for(const id of ['nrj3','hn3']) if(S().avail[id]&&S().cash>A.price(id)*.72+.05){A.buyIpj(id,'paid');break;} if(!S().props.length&&S().t>20){const c=A.APTS.filter(a=>a.kind==='buy').map(a=>[a,A.buyQuote(a.id,'live')]).filter(x=>x[1].ok)[0]; if(c)A.doBuy(c[0].id,'live');}}
    }
    const r=A.nextTurn();
    if(r.ev){ const E=r.ev.run(); const ch=E.ch.filter(c=>!c.ok||c.ok()); const c=strat==='ch'&&E.cat==='청약'?ch[0]:ch[Math.floor(Math.random()*ch.length)]; try{c.f();}catch(e){errs.push(r.ev.id+':'+e.message)} A.crisis(); }
    const n=A.nw(); if(!isFinite(n)) errs.push('NaN nw t='+S().t);
    if(r.end) break;
  }
  return {end:S().ended,nw:A.nw(),errs,props:S().props.length,happy:S().happy,cash:S().cash};
}
const cfg=[['real','d5','none'],['real','d5','buy'],['real','d3','buy'],['real','d30','buy'],['real','d5','ch'],['hist','d5','gap'],['hist','d5','buy'],['real','d10','ipj']];
const all={};
for(const [m,d,s] of cfg){ const cnt={}; let err=[]; let nws=[]; for(let i=0;i<150;i++){ localStorage._={}; const r=play(m,d,s); cnt[r.end]=(cnt[r.end]||0)+1; err.push(...r.errs); nws.push(r.nw); all[r.end]=1; }
  nws.sort((a,b)=>a-b); console.log(m,d,s,'med NW',nws[75].toFixed(1),JSON.stringify(Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,10)), err.slice(0,3)); }
console.log('distinct endings', Object.keys(all).length, Object.keys(all).sort((a,b)=>+a.slice(1)-+b.slice(1)).join(','));
