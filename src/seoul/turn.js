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
  return clamp(t, 5, 98);
}
// 다음 반기로
function nextTurn() {
  const msgs = [];
  msgs.push(...settle());
  const g = stepMarket();
  msgs.unshift(`📊 서울 아파트 시장 ${pct(g)} · 기준금리 ${S.rate.toFixed(2)}% · 분위기 ${{ up: '상승장 🔥', flat: '보합 😐', down: '하락장 🧊' }[S.phase]}`);
  msgs.push(...progressProps());
  msgs.push(...crisis());
  // 연봉·나이
  if (S.t % 2 === 1) { S.salary = r2(S.salary * 1.03); if (S.spouse) S.spouse = r2(S.spouse * 1.03); }
  S.happy = clamp(Math.round(S.happy + (happyTarget() - S.happy) * .35), 0, 100);
  // 통계
  const n = nw(); S.st.peakNW = Math.max(S.st.peakNW, n);
  if (S.st.peakNW > 1.5 && n < S.st.peakNW * .6) S.st.bigLoss = true;
  const h = liveHome(); if (h) { S.st.homeTurns++; if ((aptTr(h).tr || 0) >= .5) S.st.transitTurns++; if (S.firstHome && h.uid === S.firstHome.uid) S.st.sameHome++; }
  if (S.flags.jCrashHit && S.cash >= 0) S.st.jCrash = 1;
  if (S.deal && S.deal.t < S.t) S.deal = null;
  S.imjang = Math.min(3, S.imjang + 1);
  S.t++;
  for (const m of msgs) log(m);
  if (S.ended) return { msgs, end: true };
  if (S.st.interestBad >= 4 && debtTotal() > income() * 6) { S.ended = 'e34'; return { msgs, end: true }; }
  if (S.t >= MAXT) { S.ended = chooseEnding(); return { msgs, end: true }; }
  const e = drawEvent(); S.ev = e ? e.id : null;
  if (S.t === 10 || S.t === 20 || S.t === 30) S.interAd = true;
  save();
  return { msgs, ev: e };
}

// ---------- 엔딩 판정 ----------
// 강제 종료 → 실패 플래그 → 특별·목표 → 일반 순서로 하나만
function chooseEnding() {
  const homes = S.props.filter(p => p.kind === 'buy'), live = liveHome(), n = nw(), re = reNW(), debt = debtTotal();
  const ownSeoul = homes.length > 0;
  const age = ageOf(MAXT - 1);
  const C = [];
  // 실패·위기
  if (!ownSeoul && S.flags.cashOut) C.push('e38');
  if (S.flags.ipjCrisis || (S.flags.ipjLong && S.st.crisis >= 2 && S.props.some(p => p.kind === 'ipj'))) C.push('e37');
  if (!ownSeoul && S.flags.depositLost) C.push('e33');
  if (!ownSeoul && S.flags.chGiveUp) C.push('e32');
  if (S.st.interestBad >= 3 && debt > income() * 5) C.push('e34');
  if (homes.some(p => p.peakBuy) && n < S.st.peakNW * .7 && debt > re * .8) C.push('e36');
  if (S.panic && price(S.panic.aid) > S.panic.p * 1.2 && !ownSeoul) C.push('e35');
  if (!ownSeoul && S.everOwned && S.flags.forcedSale && S.cash > 0 && S.happy >= 55) C.push('e40');
  if (!ownSeoul) {
    if (S.mode === 'hist' && S.st.gapOk >= 3) C.push('e22');
    if (S.st.bunProfit >= 3) C.push('e26');
    if (n >= 10 && S.st.gap === 0 && !S.st.chWin) C.push('e2');
    if (S.st.jReturn >= 3 && S.st.crisis === 0) C.push('e23');
    if (S.panic && price(S.panic.aid) > S.panic.p * 1.2) C.push('e35');
    if (S.everOwned && S.flags.forcedSale) C.push('e40');
    C.push('e31');
  }
  if (C.length) { const got = store.get('_dex', {}); return C.find(k => !got[k]) || C[0]; }
  // 성공·특별
  const liveAp = live && !live.vb ? AP[live.aid] : null;
  const has = ids => homes.some(p => !p.vb && ids.includes(p.aid));
  if (S.st.bigLoss && ownSeoul && n >= S.st.peakNW * .85) C.push('e30');
  if (re >= 30 && S.st.crisis === 0) C.push('e10');
  if (has(['em', 'rdp', 'bpj', 'arp']) && homes.filter(p => ['em', 'rdp', 'bpj', 'arp'].includes(p.aid)).every(p => (p.loan || 0) <= propValue(p) * .15)) C.push('e4');
  if (live && (aptTr(live).hv || 0) >= .7 && S.happy >= 70) C.push('e9');
  if (liveAp && ['els', 'rcz', 'helio'].includes(liveAp.id)) C.push('e5');
  if (S.st.ipjDone && (S.st.ipjProfit || 0) > 3) C.push('e7');
  if (S.st.chWin && S.st.chGain >= 3) C.push('e6');
  if (S.st.bunProfit >= 3) C.push('e26');
  if (S.mode === 'hist' && S.st.gapOk >= 3) C.push('e22');
  if (S.st.flips >= 3) C.push('e3');
  if (debt <= 0.001 && ownSeoul) C.push('e8');
  if (liveAp && liveAp.id === 'md7' && S.kids.length) C.push('e14');
  if (S.st.ipjDone) C.push(S.st.duesUp >= 2 ? 'e28' : 'e27');
  if (S.st.musun) C.push('e25');
  if (S.st.jCrash && S.st.crisis === 0) C.push('e24');
  if (S.st.jReturn >= 3 && S.st.crisis === 0) C.push('e23');
  if (S.st.lowBuy) C.push('e29');
  if (S.st.oldBuyGain >= .8) C.push('e21');
  if (S.kids.length >= 2 && live) C.push('e13');
  if (S.married >= 0 && S.firstHome && S.firstHome.t - S.married <= 10 && S.firstHome.t >= S.married) C.push('e12');
  if (S.parentsHelp) C.push('e15');
  if (n >= 10 && S.st.gap === 0 && !S.st.chWin && !S.st.ipjDone && S.st.flips <= 1) C.push('e2');
  if (S.married < 0 && debt <= 0.001 && live) C.push('e17');
  if (S.st.sameHome >= 24) C.push('e18');
  if (S.st.transitTurns >= 16) C.push('e16');
  if (age >= 48 && debt < re * .2 && S.cash >= 3) C.push('e20');
  if (S.happy >= 85 && n < 15) C.push('e19');
  if (live && propValue(live) < 12 && S.happy >= 78) C.push('e11');
  // 같은 판에서 여러 개면 '아직 못 본 엔딩'을 먼저
  const got = store.get('_dex', {});
  const fresh = C.find(k => !got[k]);
  if (fresh) return fresh;
  if (C.length) return C[0];
  return live ? 'e1' : 'e1';
}
function unlockEnding(k) { const d = store.get('_dex', {}); if (!d[k]) d[k] = { t: Date.now(), name: S.name, nw: nw(), mode: S.mode }; store.set('_dex', d); }
