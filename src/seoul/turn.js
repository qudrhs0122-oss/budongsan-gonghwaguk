// ===================== 반기 진행 · 엔딩 판정 =====================
function liveHome() { return S.props.find(p => p.kind === 'buy' && p.live); }
function happyTarget() {
  let t = S.res.type === 'wolse' ? 38 : S.res.type === 'jeonse' ? 50 : 62;
  const h = liveHome();
  if (h) { const tr = aptTr(h); t += (tr.nw || 0) * 8 + (tr.tr || 0) * 7 + (tr.hv || 0) * 12 + (tr.sc || 0) * (S.kids.length ? 8 : 2) + (h.remod ? 6 : 0) - (!h.vb && AP[h.aid].y && AP[h.aid].y < 1995 ? 5 : 0); }
  if (S.married >= 0) t += 6; t += Math.min(2, S.kids.length) * 4; if (S.parentsHelp) t += 3;
  const ds = annualDebtService(0, 0) / Math.max(.1, income());
  t -= ds > .5 ? 18 : ds > .4 ? 10 : ds > .3 ? 4 : 0;
  if (S.credit > 0) t -= 6;
  if (S.hp < 40) t -= 8;
  return clamp(t, 5, 98);
}
// 다음 반기로: 일하기 → 생활비 정산 → 경제(위기·집값·주식) → 보유 자산 → 인생
function nextTurn() {
  const msgs = [], R = { t: S.t, cash0: S.cash, nw0: nw(), G0: S.G };
  R.work = doWork();
  if (S.ended) { save(); return { msgs: R.work.lines, end: true, R }; }
  msgs.push(...settle());
  R.crisis = worldCrisis();
  const g = stepMarket(); R.g = g;
  R.stk = stepStocks();
  if (S.tightCrisis > 0) S.tightCrisis--;
  msgs.unshift(`📊 서울 아파트 시장 ${pct(g)} · 기준금리 ${S.rate.toFixed(2)}% · 분위기 ${{ up: '상승장 🔥', flat: '보합 😐', down: '하락장 🧊' }[S.phase]}`);
  msgs.push(...R.stk.lines);
  if (S.layoffNext) { S.layoffNext = false; if (!S.biz) { const cut = r2(S.salary * .25); S.cash = r2(S.cash - cut); S.salary = r2(S.salary * .95); msgs.push(`🏢 금융위기 여파로 회사가 구조조정을 했습니다. 몇 달 쉬며 ${won(cut)}을 잃고 재취업했습니다.`); } }
  msgs.push(...progressProps());
  msgs.push(...crisis());
  if (S.t % 2 === 1) { if (S.salary) S.salary = r2(S.salary * 1.03); if (S.spouse) S.spouse = r2(S.spouse * 1.03); }
  S.happy = clamp(Math.round(S.happy + (happyTarget() - S.happy) * .25), 0, 100);
  const n = nw(); S.st.peakNW = Math.max(S.st.peakNW, n);
  if (S.st.peakNW > 1.5 && n < S.st.peakNW * .6) S.st.bigLoss = true;
  const h = liveHome(); if (h) { S.st.homeTurns++; if ((aptTr(h).tr || 0) >= .5) S.st.transitTurns++; if (S.firstHome && h.uid === S.firstHome.uid) S.st.sameHome++; }
  if (S.flags.jCrashHit && S.cash >= 0) S.st.jCrash = 1;
  if (S.deal && S.deal.t < S.t) S.deal = null;
  S.imjang = Math.min(3, S.imjang + 1);
  S.t++;
  R.cash1 = S.cash; R.nw1 = nw();
  for (const m of [...R.work.lines, ...msgs]) log(m);
  if (S.ended) return { msgs, end: true, R };
  if (S.st.interestBad >= 4 && debtTotal() > income() * 6) { S.ended = S.biz || S.flags.bizFail ? 'e17' : 'e25'; return { msgs, end: true, R }; }
  if (S.t >= MAXT) { S.ended = chooseEnding(); return { msgs, end: true, R }; }
  let e = null;
  if (S.gradT && S.t >= S.gradT) { S.gradT = 0; S.salary = r2(S.salary * 1.25); log(`🎓 대학원을 졸업했습니다! 연봉이 ${won(S.salary)}으로 올랐습니다.`); }
  const cr = CROSS[S.t] || (S.crossRetry === S.t && S.married < 0 ? CROSS[15] : null);
  if (cr) { e = { id: 'cross', run: cr }; S.crossT = S.t; }
  else if (S.plan.ch && isHomeless()) { e = EVENTS.find(x => x.id === 'cheong'); S.plan.ch = false; }
  else e = drawEvent();
  S.ev = e ? e.id : null;
  if (S.t === 10 || S.t === 20 || S.t === 30) S.interAd = true;
  save();
  return { msgs, ev: e, R };
}

// ---------- 엔딩 판정 ----------
// 조건을 만족하는 엔딩을 모두 모은 뒤, 희귀도가 가장 높은 묶음에서 아직 못 본 엔딩을 우선
function endingCands() {
  const homes = S.props.filter(p => p.kind === 'buy'), live = liveHome(), n = nw(), re = reNW(), debt = debtTotal();
  const own = homes.length > 0, C = [];
  const inGN = homes.some(p => !p.vb && GANGNAM.includes(AP[p.aid].gu));
  const ds = annualDebtService(0, 0) / Math.max(.1, income());
  const sideJobs = S.w.two + S.w.three;
  if (own) {
    if (S.hp >= 80 && S.happy >= 88 && debt <= re * .15 && n >= 18 && S.married >= 0 && S.kids.length && !S.flags.forcedSale && !S.st.crisis && !S.overwarn) C.push('e40');
    if (live && (aptTr(live).hv || 0) >= .7 && S.happy >= 70) C.push('e10');
    if (S.st.bizPeak >= 3) C.push('e14');
    if (n >= 25 && stockValue() + S.cash >= 8 && debt <= re * .2) C.push('e15');
    if (inGN && S.st.stkGainMax >= 5) C.push('e18');
    if (inGN) C.push('e2');
    if (S.st.flips >= 2) C.push('e6');
    if (debt <= .001 && homes.some(p => propValue(p) >= 10)) C.push('e8');
    if (homes.some(p => p.lowBuy && propValue(p) >= p.buyP * 1.6)) C.push('e9');
    if (S.w.three >= 8) C.push('e12');
    if (S.st.coinGain >= 3) C.push('e20');
    if (homes.length >= 3) C.push('e38');
    if (re >= 40) C.push('e39');
    if (S.st.chWin && S.st.chGain >= 3) C.push('e3');
    if (S.st.ipjDone && !S.st.rbDone && (S.st.ipjProfit || 0) > 3) C.push('e4');
    if (S.st.rbDone) C.push('e5');
    if (S.st.bunProfit >= 2) C.push('e7');
    if (S.w.two >= 8) C.push('e11');
    if (S.st.blueGain >= 1 || (S.st.blueTurns >= 16 && S.stk.blue - S.stkIn.blue >= 1)) C.push('e19');
    if (S.st.crisisBuy) C.push('e23');
    if (S.married >= 0 && S.firstHome && S.firstHome.t >= S.married) C.push('e36');
    if (S.married < 0 && S.happy < 45 && n >= 10) C.push('e37');
    if (sideJobs <= 2 && !S.w.biz && S.promos >= 2 && stockIn() < 1) C.push('e13');
    if (homes.some(p => p.peakBuy) && n < S.st.peakNW * .7) C.push('e30');
    if (ds > .45) C.push('e33');
    if (S.flags.ipjLong && S.props.some(p => p.kind === 'ipj')) C.push('e27');
    C.push('e1');
  } else {
    if (S.married >= 0 && S.kids.length && S.happy >= 70) C.push('e34');
    if (S.st.chTry >= 8 && !S.st.chWin) C.push('e28');
    if (S.flags.fraud) C.push('e26');
    if (S.flags.depositLost) C.push('e32');
    if (S.flags.forcedSale) C.push('e25');
    if (S.flags.bizFail) C.push('e17');
    if (S.flags.levLiq) C.push('e22');
    if (S.st.crisisStkLoss >= 1) C.push('e21');
    if (stockValue() >= 1 && S.G >= S.Gh[0] * 1.4) C.push('e24');
    if (S.flags.ipjLong && S.props.some(p => p.kind === 'ipj')) C.push('e27');
    C.push('e29');
  }
  return C;
}
function chooseEnding() {
  const C = endingCands(), got = store.get('_dex', {});
  const top = Math.max(...C.map(k => RANK[ENDS[k].r]));
  const best = C.filter(k => RANK[ENDS[k].r] === top);
  return best.find(k => !got[k]) || best[0];
}
function unlockEnding(k) { const d = store.get('_dex', {}); if (!d[k]) d[k] = { t: Date.now(), name: S.name, nw: nw(), mode: S.mode }; store.set('_dex', d); }
