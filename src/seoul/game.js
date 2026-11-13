// ===================== 나의 첫 번째 서울 아파트 구하기 — 엔진 =====================
const KEY = 'seoulapt_v1';
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r2 = v => Math.round(v * 100) / 100;
function won(v) { // 억 단위 숫자 → "3억 2,500만"
  const neg = v < 0; v = Math.abs(v);
  let e = Math.floor(v + 1e-9), m = Math.round((v - e) * 1000) * 10;
  if (m >= 10000) { e++; m -= 10000; }
  const s = e >= 1 ? e + '억' + (m > 0 ? ' ' + m.toLocaleString() + '만' : '') : (m > 0 ? m.toLocaleString() + '만' : '0');
  return (neg ? '-' : '') + s + '원';
}
const wonS = v => (Math.abs(v) >= 1 ? (Math.round(v * 10) / 10) + '억' : Math.round(v * 10000).toLocaleString() + '만') ;
const pct = v => (v >= 0 ? '+' : '') + (Math.round(v * 10) / 10) + '%';
const store = { get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { } } };

const MAXT = 40; // 20년 × 반기
const DIFFS = { d3: { n: '하드', cash: .3, d: '현금 3,000만 원' }, d5: { n: '보통', cash: .5, d: '현금 5,000만 원' }, d10: { n: '쉬움', cash: 1, d: '현금 1억 원' }, d30: { n: '금수저', cash: 3, d: '현금 3억 원' } };
let S = null;

// ---------- 시간·규칙 ----------
const yearOf = (t = S.t) => S.startYear + Math.floor(t / 2);
const halfOf = t => t % 2 === 0 ? '상반기' : '하반기';
const when = (t = S.t) => `${yearOf(t)}년 ${halfOf(t)}`;
const ageOf = (t = S.t) => 29 + Math.floor(t / 2);
// 시점별 규제 (역사 모드는 실제 흐름을 단순화, 현실 모드는 2026년 10·15 대책 기준)
function rules(t = S.t) {
  const y = yearOf(t) + (t % 2 ? .5 : 0);
  const R = { name: '', ltv: .4, ltvFirst: .7, ownerLoan: false, gap: false, live: true, transfer: false, bunResale: false, acqHeavy: true, cap: p => p <= 15 ? 6 : p <= 25 ? 4 : 2, note: '' };
  if (S.mode === 'hist' && y < 2017.5) Object.assign(R, { name: '2015 부동산 완화기', ltv: .7, ltvFirst: .7, ownerLoan: true, gap: true, live: false, transfer: true, bunResale: true, acqHeavy: false, cap: () => 99, note: 'LTV 70%, 전세 낀 매수(갭투자) 가능, 실거주 의무 없음' });
  else if (S.mode === 'hist' && y < 2020) Object.assign(R, { name: '8·2 대책 시기', ltv: .4, ltvFirst: .5, ownerLoan: false, gap: true, live: false, transfer: true, bunResale: true, acqHeavy: false, cap: () => 99, note: '서울 LTV 40%, 다주택자 대출 제한, 갭투자는 가능' });
  else if (S.mode === 'hist' && y < 2025.5) Object.assign(R, { name: '12·16 대책 이후', ltv: .4, ltvFirst: .5, ownerLoan: false, gap: true, live: false, transfer: true, bunResale: true, acqHeavy: y >= 2020.5, cap: p => p > 15 ? 0 : 99, note: '15억 초과 주택 대출 금지, 다주택 취득세 중과(2020 하반기~), 갭투자 가능' });
  else Object.assign(R, { name: '10·15 대책 (서울 전역 토지거래허가)', note: '무주택 LTV 40%(생애최초 70%), 대출 한도 6·4·2억, 유주택자 주담대 불가, 2년 실거주 의무, 갭투자 금지, 조합원 지위 양도·분양권 전매 제한' });
  if (S.relax && R.name.startsWith('10·15')) Object.assign(R, { name: '규제지역 일부 해제', ltv: .5, ltvFirst: .7, ownerLoan: true, gap: true, live: false, transfer: true, bunResale: true, cap: p => p <= 15 ? 6 : 4, note: '규제 완화: LTV 50%, 갭투자 다시 가능, 실거주 의무 해제' });
  if (S.tight) { R.ltv = Math.max(.3, R.ltv - .1); R.ltvFirst = Math.max(.5, R.ltvFirst - .1); R.note += ' · 추가 대출 규제(LTV −10%p)'; }
  return R;
}

// ---------- 시세 ----------
function price(id) { return S.px[id]; }
function bunValue(pr) { // 분양권 시세 = 분양가 + 프리미엄
  if (pr.vb) return pr.base * (S.G / pr.G0) * pr.prem;
  return price(pr.aid);
}
function propValue(pr) {
  if (pr.kind === 'bun') return bunValue(pr);
  if (pr.kind === 'ipj') return pr.conv ? price(pr.aid) * (1 + pr.stage * .06) : price(pr.aid) * .72 * (pr.stage >= 4 ? 1.05 : 1);
  return pr.vb ? pr.base * (S.G / pr.G0) : price(pr.aid);
}
function aptName(pr) { return pr.vb ? pr.vname : AP[pr.aid].n; }
function aptTr(pr) { return pr.vb ? { nw: 1 } : AP[pr.aid].tr; }

// ---------- 대출 ----------
const mRate = () => S.rate + 1.6;              // 주담대 금리
function pmtHalf(bal, ratePct, years = 30) { const r = ratePct / 100 / 12, n = years * 12; if (bal <= 0) return 0; return 6 * bal * r / (1 - Math.pow(1 + r, -n)); }
function income() { return S.salary + (S.spouse ? S.spouse : 0); } // 연 소득(억)
function annualDebtService(extra = 0, stress = 1.5) {
  let a = 0;
  for (const p of S.props) if (p.loan > 0) a += 2 * pmtHalf(p.loan, mRate() + stress);
  if (S.res.loan > 0) a += S.res.loan * (S.rate + 1.3) / 100;
  if (S.credit > 0) a += S.credit * (S.rate + 4) / 100 + S.credit / 5;
  if (extra > 0) a += 2 * pmtHalf(extra, mRate() + stress);
  return a;
}
function homesOwned() { return S.props.filter(p => p.kind === 'buy').length + S.props.filter(p => p.kind !== 'buy').length; }
function isHomeless() { return S.props.length === 0; }
function loanLimit(priceV, opts = {}) {
  const R = rules();
  const owner = S.props.length > 0 && !opts.replacing;
  if (owner && !R.ownerLoan) return { max: 0, why: '유주택자는 주택담보대출을 받을 수 없어요 (현 규제)' };
  const first = !S.everOwned;
  const ltv = first ? R.ltvFirst : R.ltv;
  let max = priceV * ltv; let why = `LTV ${Math.round(ltv * 100)}%${first ? ' (생애최초)' : ''}`;
  const cap = R.cap(priceV); if (cap < max) { max = cap; why = cap === 0 ? '15억 초과 주택은 주담대 금지' : `주택가격 구간 대출 한도 ${cap}억`; }
  // DSR 40%
  let lo = 0, hi = max;
  if (annualDebtService(hi) > income() * .4) {
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (annualDebtService(m) <= income() * .4) lo = m; else hi = m; }
    max = lo; why = 'DSR 40% (소득 대비 원리금)';
  }
  return { max: Math.max(0, Math.floor(max * 100) / 100), why };
}
function acqTax(p, homesAfter) {
  const R = rules();
  if (R.acqHeavy && homesAfter >= 3) return p * .12;
  if (R.acqHeavy && homesAfter === 2) return p * .08;
  return p * (p <= 6 ? .01 : p <= 9 ? .02 : .03);
}

// ---------- 새 게임 ----------
function newGame(mode, diff, name, goal) {
  const hist = mode === 'hist';
  S = {
    v: 1, mode, diff, name: name || '나', goal, t: 0, startYear: hist ? 2015 : 2026,
    cash: DIFFS[diff].cash, salary: .48, spouse: 0, married: -1, kids: [], parentsHelp: false,
    res: { type: 'wolse', dep: .1, loan: 0 }, props: [], credit: 0,
    G: 1, J: hist ? 1.75 : 1, rate: hist ? 1.75 : 2.5, phase: hist ? 'up' : 'up', future: [],
    px: {}, hist: {}, Gh: [1], happy: 50, imjang: 1, adUsed: {}, report: 0, chart: false,
    everOwned: false, firstHome: null, log: [], flags: {}, st: { flips: 0, gap: 0, gapOk: 0, jReturn: 0, jCrash: 0, duesUp: 0, crisis: 0, interestBad: 0, peakNW: 0, minAfterPeak: 1e9, homeTurns: 0, transitTurns: 0, bigLoss: false, lowBuy: false, oldBuyGain: 0, chWin: 0, chGain: 0, bunProfit: 0, ipjDone: 0, musun: false, sameHome: 0 },
    relax: false, tight: false, deal: null, ev: null, ended: null, uid: 1, seen: {},
  };
  // 시작 시세: 현실 모드는 2026 시세, 역사 모드는 2015년 수준으로 역산
  let back = 1; if (hist) for (const [g] of HIST) back *= 1 + g / 100;
  for (const a of APTS) { const p = hist ? a.p / back * rnd(.92, 1.08) : a.p; S.px[a.id] = r2(p); S.hist[a.id] = [S.px[a.id]]; }
  // 역사 모드에서 아직 분양 전/입주권 단계 전 단지는 나중에 등장
  S.avail = {}; for (const a of APTS) S.avail[a.id] = !hist || a.kind === 'buy';
  rollFuture();
  log(`${when()}, ${S.name}의 서울 생활이 시작됐습니다. ${DIFFS[diff].d}, 연봉 4,800만 원, 월세 85만 원.`);
  save();
}
function log(s) { S.log.unshift({ t: S.t, s }); if (S.log.length > 60) S.log.pop(); }
function save() { store.set('_save', S); }

// ---------- 시장 ----------
function nextPhase(ph) {
  const T = { up: [['up', .62], ['flat', .28], ['down', .1]], flat: [['up', .35], ['flat', .4], ['down', .25]], down: [['down', .45], ['flat', .35], ['up', .2]] }[ph];
  let r = Math.random(); for (const [k, p] of T) { if ((r -= p) < 0) return k; } return 'flat';
}
function rollFuture() { // 앞으로 4반기 시장 흐름을 미리 굴려 둠 (전문가 리포트가 정직하게 보여주도록)
  while (S.future.length < 4) {
    const t = S.t + S.future.length;
    if (S.mode === 'hist' && t < HIST.length) { const [g, r] = HIST[t]; S.future.push({ g, rate: r, ph: g >= 4 ? 'up' : g <= -1 ? 'down' : 'flat' }); continue; }
    const prev = S.future.length ? S.future[S.future.length - 1].ph : S.phase;
    const ph = nextPhase(prev);
    const g = ph === 'up' ? rnd(2.5, 7.5) : ph === 'down' ? rnd(-7, -1) : rnd(-1, 2.5);
    S.future.push({ g, ph, rate: null });
  }
}
function stepMarket() {
  rollFuture();
  const f = S.future.shift(); S.phase = f.ph;
  if (f.rate != null) S.rate = f.rate;
  else { S.rate = clamp(S.rate + (f.ph === 'up' ? rnd(-.1, .3) : f.ph === 'down' ? rnd(-.35, .1) : rnd(-.15, .15)), .5, 6); S.rate = Math.round(S.rate * 4) / 4; }
  const g = f.g + (S.gShock || 0); S.gShock = 0;
  S.G *= 1 + g / 100; S.Gh.push(S.G);
  // J = 전세가율 배수: 전세가는 매매가보다 덜 오르고 덜 떨어짐 → 상승장엔 전세가율 하락
  S.J = S.J * (1 + (g * .45 + rnd(-1, 1.5) + (S.jShock || 0)) / 100) / (1 + g / 100); S.J += (1 - S.J) * .04; S.jShock = 0;
  for (const a of APTS) {
    let d = g * (a.b || 1) + rnd(-1.4, 1.4);
    if (a.tr.rb) d += (S.rbBoost || 0) * a.tr.rb;
    if (a.tr.nw && a.kind === 'buy') d -= .15; // 신축 프리미엄이 서서히 줄어듦
    S.px[a.id] = r2(Math.max(.5, S.px[a.id] * (1 + d / 100)));
    S.hist[a.id].push(S.px[a.id]);
  }
  S.rbBoost = 0;
  // 역사 모드: 정비사업·분양 단지 등장 시점
  if (S.mode === 'hist') for (const a of APTS) if (!S.avail[a.id] && ((a.kind === 'bun' && yearOf() >= a.mv - 3) || (a.kind === 'ipj' && yearOf() >= 2024))) { S.avail[a.id] = true; log(`📢 ${a.n} ${a.kind === 'bun' ? '분양권 거래가 시작됐습니다' : '입주권 매물이 나오기 시작했습니다'}.`); }
  return g;
}

// ---------- 한 반기 정산 ----------
function settle() {
  const R = rules(), lines = [];
  const inc = income() / 2;
  const living = Math.max(.1, inc * .42) + (S.married >= 0 ? .03 : 0) + S.kids.length * .06; // 소득이 늘면 씀씀이도 늘어남
  let housing = 0;
  if (S.res.type === 'wolse') housing = .051;
  if (S.res.type === 'jeonse') housing = S.res.loan * (S.rate + 1.3) / 100 / 2;
  let loanPay = 0;
  for (const p of S.props) if (p.loan > 0) { const pay = pmtHalf(p.loan, mRate()); const intr = p.loan * mRate() / 100 / 2; p.loan = r2(Math.max(0, p.loan - (pay - intr))); loanPay += pay; }
  const credit = S.credit > 0 ? S.credit * (S.rate + 4) / 100 / 2 : 0;
  let tax = 0;
  if (S.t % 2 === 1) { // 하반기: 보유세
    const homes = S.props.filter(p => p.kind === 'buy');
    for (const p of homes) { const v = propValue(p); tax += homes.length >= 2 ? v * .004 : v * .0012 + Math.max(0, v - 12) * .003; }
  }
  const out = living + housing + loanPay + credit + tax;
  S.cash = r2(S.cash + inc - out);
  S.lastFlow = { inc, living, housing, loanPay, credit, tax, net: inc - out };
  if (loanPay + credit + housing > inc * .55) { S.st.interestBad++; lines.push('⚠️ 이자·원리금이 소득의 절반을 넘었습니다.'); } else S.st.interestBad = Math.max(0, S.st.interestBad - 1);
  return lines;
}
function progressProps() {
  const msgs = [];
  for (const p of [...S.props]) {
    // 세입자 만기
    if (p.tenant && S.t >= p.tenant.until) {
      const v = propValue(p), jr = AP[p.aid] ? AP[p.aid].jr || .5 : .5;
      const newDep = r2(Math.min(v * .8, v * jr * S.J));
      const diff = r2(newDep - p.tenant.dep);
      if (diff >= 0) { S.cash = r2(S.cash + diff); msgs.push(`🔑 ${aptName(p)} 전세 재계약: 보증금이 ${won(diff)} 올라 현금이 들어왔습니다.`); }
      else {
        S.cash = r2(S.cash + diff); msgs.push(`💦 ${aptName(p)} 전세 재계약: 전세가가 떨어져 보증금 차액 ${won(-diff)}을 돌려줬습니다.`);
        if (-diff > p.tenant.dep * .12) { S.flags.jCrashHit = true; }
      }
      S.st.jReturn++;
      p.tenant = { dep: newDep, until: S.t + 4, J0: S.J };
    }
    // 분양권 입주
    if (p.kind === 'bun' && yearOf() >= p.mv && S.t % 2 === 0) msgs.push(...moveInBun(p));
    // 입주권 진행
    if (p.kind === 'ipj') {
      if (!p.verified && !p.cleared && Math.random() < .12) { // 권리 검증 실패 → 현금청산
        const back = r2(p.paid * .72); S.cash = r2(S.cash + back - (p.loan || 0)); S.props = S.props.filter(x => x !== p);
        S.flags.cashOut = true; msgs.push(`⚠️ ${aptName(p)}: 조합원 지위 승계가 인정되지 않아 현금청산 대상이 됐습니다. 감정가 ${won(back)}만 돌려받습니다.`); continue;
      }
      p.wait = (p.wait || 0) + 1;
      if (Math.random() < (p.slow ? .1 : .2)) { p.stage++; p.wait = 0; msgs.push(`🏗️ ${aptName(p)}: '${STAGES[Math.min(p.stage, 5)]}' 단계에 들어섰습니다.`); }
      if (p.wait >= 6) S.flags.ipjLong = true;
      if (p.stage >= 5) msgs.push(...completeIpj(p));
    }
  }
  return msgs;
}
function moveInBun(p) {
  const v = bunValue(p), R = rules();
  const need = r2(p.total * .9 - (p.prepaid || 0) + acqTax(p.total, S.props.filter(x => x.kind === 'buy').length + 1)); // 중도금(대출 상환)+잔금+취득세
  const lim = loanLimit(v, { replacing: S.props.length === 1 });
  const cashNeed = r2(Math.max(0, need - lim.max));
  if (S.cash >= cashNeed) {
    S.cash = r2(S.cash - cashNeed);
    Object.assign(p, { kind: 'buy', loan: r2(need - cashNeed), buyP: p.total + (p.premPaid || 0), buyT: S.t, live: !S.props.some(x => x.live && x !== p), vb: p.vb, base: v, G0: S.G });
    if (p.live) moveIntoOwned(p);
    S.everOwned = true; if (!S.firstHome) S.firstHome = { t: S.t, uid: p.uid };
    if (p.fromCh) { S.st.chGain = Math.max(S.st.chGain, v - p.total); }
    if (p.musun) S.st.musun = true;
    return [`🎉 ${aptName(p)} 입주! 잔금을 치르고 새 아파트의 주인이 됐습니다. (잔금대출 ${won(p.loan)})`];
  }
  // 잔금 부족
  if (R.bunResale || p.resaleOk) {
    const sell = r2(v * .95), got = r2(sell - p.total * .9 + (p.prepaid || 0) - (p.loan || 0));
    S.cash = r2(S.cash + Math.max(0, got)); S.props = S.props.filter(x => x !== p);
    if (got < p.total * .1) S.flags.depositLost = true;
    return [`📉 ${aptName(p)}: 잔금 ${won(cashNeed)}이 모자라 입주 직전 급매로 넘겼습니다. 손에 쥔 돈 ${won(Math.max(0, got))}.`];
  }
  S.props = S.props.filter(x => x !== p); S.flags.depositLost = true;
  return [`💸 ${aptName(p)}: 잔금 ${won(cashNeed)}을 마련하지 못해 계약이 해지되고 계약금 ${won(p.total * .1)}을 잃었습니다.`];
}
function completeIpj(p) {
  const v = r2(price(p.aid) * (p.conv ? 1.7 : 1.05));
  const need = p.dues;
  const lim = loanLimit(v, { replacing: S.props.length === 1 });
  const cashNeed = r2(Math.max(0, need - lim.max));
  if (S.cash < cashNeed) {
    S.flags.ipjCrisis = true;
    const sell = r2(v * .9 - need); S.cash = r2(S.cash + sell - (p.loan || 0)); S.props = S.props.filter(x => x !== p);
    return [`😵 ${aptName(p)}: 준공됐지만 분담금 ${won(need)}을 낼 돈이 없어 입주권을 급매로 넘겼습니다.`];
  }
  S.cash = r2(S.cash - cashNeed);
  Object.assign(p, { kind: 'buy', loan: r2((p.loan || 0) + need - cashNeed), buyP: p.paid + need, buyT: S.t, live: !S.props.some(x => x.live && x !== p) });
  if (!p.conv) S.px[p.aid] = v; else { p.vb = true; p.vname = AP[p.aid].n.replace(/주공 ?\d*단지|아파트|\d+단지/, '') + ' 신축 (재건축)'; p.base = v; p.G0 = S.G; }
  if (p.live) moveIntoOwned(p);
  S.st.ipjDone++; S.everOwned = true; if (!S.firstHome) S.firstHome = { t: S.t, uid: p.uid };
  S.st.ipjProfit = v - p.buyP;
  return [`🔑 ${aptName(p)} 준공! 조합원 입주권이 새 아파트로 바뀌었습니다. 시세 ${won(v)}.`];
}
function moveIntoOwned(p) {
  // 전세 보증금 회수
  if (S.res.type === 'jeonse' || S.res.type === 'wolse') { S.cash = r2(S.cash + S.res.dep - S.res.loan); }
  S.res = { type: 'own', dep: 0, loan: 0, uid: p.uid };
  p.live = true; p.liveFrom = S.t; p.tenant = null;
}
function propEquity(p) {
  if (p.kind === 'bun') return bunValue(p) - p.total * .9 + (p.prepaid || 0) - (p.loan || 0);
  if (p.kind === 'ipj') return propValue(p) - (p.loan || 0);
  return propValue(p) - (p.loan || 0) - (p.tenant ? p.tenant.dep : 0);
}
function nw() {
  let v = S.cash + (S.res.type !== 'own' ? S.res.dep - S.res.loan : 0) - S.credit;
  for (const p of S.props) v += propEquity(p);
  return r2(v);
}
function reNW() { let v = 0; for (const p of S.props) v += propEquity(p); return r2(v); }
function debtTotal() { let d = S.credit + S.res.loan; for (const p of S.props) d += (p.loan || 0); return r2(d); }

// 위기: 현금이 마이너스면 신용대출 → 급매 → 파산
function crisis() {
  const msgs = [];
  if (S.cash >= 0) return msgs;
  const room = Math.max(0, Math.min(1.5, income() * 1.2) - S.credit);
  if (room > 0) { const take = r2(Math.min(room, -S.cash + .05)); S.credit = r2(S.credit + take); S.cash = r2(S.cash + take); msgs.push(`🏦 현금이 바닥나 신용대출 ${won(take)}을 받았습니다. (금리 ${(S.rate + 4).toFixed(1)}%)`); S.st.crisis++; }
  if (S.cash < 0 && S.res.type === 'jeonse') { const back = r2(S.res.dep - S.res.loan); S.cash = r2(S.cash + back); S.res = { type: 'wolse', dep: 0, loan: 0 }; msgs.push(`📦 전세 보증금을 빼서 보증금 없는 월세로 옮겼습니다.`); }
  while (S.cash < 0 && S.props.length) {
    const p = S.props.slice().sort((a, b) => (b.live ? 0 : 1) - (a.live ? 0 : 1))[S.props.length - 1];
    const got = sellProp(p, true);
    msgs.push(`🚨 돈이 모자라 ${aptName(p)}을(를) 급매로 처분했습니다. (${won(got)})`); S.flags.forcedSale = true;
  }
  if (S.cash < 0) { S.ended = 'e39'; msgs.push('💥 더 이상 버틸 수 없습니다…'); }
  return msgs;
}

// ---------- 매수 ----------
function buyQuote(aid, mode) { // mode: live | gap
  const a = AP[aid], p = price(aid) * (S.deal && S.deal.aid === aid ? 1 - S.deal.disc : 1);
  const homesAfter = S.props.filter(x => x.kind === 'buy').length + 1;
  const tax = r2(acqTax(p, homesAfter)), fee = r2(p * .005);
  let dep = 0;
  if (mode === 'gap') dep = r2(Math.min(p * .8, p * a.jr * S.J));
  const lim = mode === 'gap' ? { max: 0, why: '갭투자는 주택담보대출 없이 전세보증금으로 매수' } : loanLimit(p);
  const resBack = mode === 'live' && S.res.type !== 'own' ? r2(S.res.dep - S.res.loan) : 0;
  const cashNeed = r2(p + tax + fee - dep - lim.max);
  return { p, tax, fee, dep, lim, cashNeed, resBack, ok: S.cash + resBack >= cashNeed };
}
function doBuy(aid, mode, loanUse) {
  const q = buyQuote(aid, mode), a = AP[aid];
  const loan = mode === 'gap' ? 0 : clamp(loanUse == null ? q.lim.max : loanUse, 0, q.lim.max);
  const cashNeed = r2(q.p + q.tax + q.fee - q.dep - loan);
  if (S.cash + q.resBack < cashNeed) return false;
  const pr = { uid: S.uid++, aid, kind: 'buy', buyP: r2(q.p), buyT: S.t, loan: r2(loan), live: false, tenant: null, G0: S.G };
  if (mode === 'live') { S.props.push(pr); moveIntoOwned(pr); }
  else { pr.tenant = { dep: q.dep, until: S.t + 4, J0: S.J }; S.props.push(pr); S.st.gap++; }
  S.cash = r2(S.cash - cashNeed);
  if (!S.everOwned && mode === 'live') S.firstHome = { t: S.t, uid: pr.uid };
  S.everOwned = true;
  if (S.phase === 'down' || (S.Gh.length > 3 && S.G < Math.max(...S.Gh) * .9)) pr.lowBuy = true;
  if (S.Gh.length > 2 && S.G >= Math.max(...S.Gh) * .98 && S.phase === 'up') pr.peakBuy = true;
  if (a.y && a.y < 2000) pr.old = true;
  // 갈아타기: 최근 2반기 안에 실거주 집을 판 뒤 더 비싼 집으로
  if (mode === 'live' && S.lastLivedSale && S.t - S.lastLivedSale.t <= 2 && q.p > S.lastLivedSale.p * 1.15) { S.st.flips++; S.lastLivedSale = null; }
  if (S.deal && S.deal.aid === aid) S.deal = null;
  S.seen[aid] = 2;
  log(`🖊️ ${a.n} ${mode === 'gap' ? '전세 끼고 매수' : '매수·입주'} (${won(q.p)}, 대출 ${won(loan)})`);
  return true;
}
function buyBun(aid) { // 분양권 전매 매수
  const a = AP[aid], v = price(aid), prem = r2(Math.max(0, v - a.p));
  const cost = r2(a.p * .1 + prem + v * .005);
  if (S.cash < cost) return false;
  S.cash = r2(S.cash - cost);
  S.props.push({ uid: S.uid++, aid, kind: 'bun', total: a.p, premPaid: prem, mv: a.mv, buyT: S.t, loan: 0, resaleOk: true });
  log(`📄 ${a.n} 분양권 매수 (계약금 ${won(a.p * .1)} + 프리미엄 ${won(prem)})`);
  return true;
}
function buyIpj(aid, verify) {
  const a = AP[aid], v = price(aid), cost = r2(v * .72), R = rules();
  const fee = verify === 'paid' ? .03 : 0, loan = ipjLoan(aid);
  if (S.cash < cost + fee - loan) return false;
  S.cash = r2(S.cash - cost - fee + loan);
  S.props.push({ uid: S.uid++, aid, kind: 'ipj', paid: cost, paid0: cost, dues: r2(v * .3), stage: a.stage, buyT: S.t, loan, verified: R.transfer || !!verify, slow: false });
  log(`📜 ${a.n} 조합원 입주권 매수 (${won(cost)}, 예상 분담금 ${won(v * .3)})${!R.transfer && !verify ? ' — 권리 검증 없이 매수' : ''}`);
  return true;
}
function ipjLoan(aid) { // 조합 이주비 대출 승계 (권리가액의 일부)
  return S.props.length ? 0 : r2(price(aid) * .72 * .35);
}
function sellProp(p, forced) {
  const v = propValue(p) * (forced ? .9 : 1), R = rules();
  let tax = 0;
  if (p.kind === 'buy') {
    const gain = v - p.buyP - p.buyP * .04, held = S.t - p.buyT, homes = S.props.filter(x => x.kind === 'buy').length;
    if (gain > 0) {
      const lived = p.live && S.t - (p.liveFrom ?? p.buyT) >= 4;
      if (homes === 1 && held >= 4 && (lived || S.mode === 'hist' && yearOf(p.buyT) < 2017)) tax = v > 12 ? gain * (v - 12) / v * .25 : 0;
      else tax = gain * (held < 2 ? .7 : held < 4 ? .6 : homes >= 2 ? .45 : .3);
    }
  }
  let got;
  if (p.kind === 'bun') got = v - p.total * .9 + (p.prepaid || 0) - (p.loan || 0);
  else if (p.kind === 'ipj') got = v - (p.loan || 0);
  else got = v - (p.loan || 0) - (p.tenant ? p.tenant.dep : 0) - v * .005 - tax;
  got = r2(got);
  S.cash = r2(S.cash + got);
  S.props = S.props.filter(x => x !== p);
  const profit = p.kind === 'buy' ? v - p.buyP : 0;
  if (p.kind === 'buy') {
    if (p.tenant && profit > 0 && S.mode === 'hist') S.st.gapOk++;
    if (p.old && profit / p.buyP > S.st.oldBuyGain) S.st.oldBuyGain = profit / p.buyP;
    if (p.lowBuy && S.t - p.buyT >= 8 && profit / p.buyP >= .4) S.st.lowBuy = true;
    if (S.phase === 'down' && profit < 0 && !forced) S.panic = { aid: p.aid, p: v, t: S.t };
  }
  if (p.kind === 'bun' && !forced) S.st.bunProfit += got - (p.total * .1 + (p.premPaid || 0));
  if (p.live) { S.res = { type: 'wolse', dep: 0, loan: 0 }; S.lastLivedSale = { t: S.t, p: v }; S.st.sameHome = 0; }
  log(`🤝 ${aptName(p)} ${forced ? '급매 ' : ''}매도 (${won(v)}${tax > 0 ? `, 양도세 ${won(tax)}` : ''})`);
  return got;
}
