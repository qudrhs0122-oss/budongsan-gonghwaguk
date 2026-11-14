// ===================== 인생 시스템: 노동 · 체력 · 창업 · 주식 · 경제위기 · 챕터 =====================
const CHAPTERS = ['사회초년생', '종잣돈 모으기', '첫 집 도전', '버티는 시간', '인생의 갈림길', '가족과 집', '갈아타기', '위기와 기회', '자산 굳히기', '최종 결산'];
const chapterOf = (t = S.t) => Math.min(9, Math.floor(t / 4));
const GANGNAM = ['gangnam', 'seocho', 'songpa'];

// 저장 데이터 보정 (이전 버전 세이브 호환)
function migrate() {
  if (!S) return;
  S.hp ??= 90; S.career ??= 0; S.promos ??= 0; S.biz ??= null; S.bizDebt ??= 0;
  S.w ??= { main: 0, two: 0, three: 0, rest: 0, biz: 0 };
  S.plan ??= { work: 'main', ch: false };
  S.stk ??= { blue: 0, growth: 0, coin: 0, lev: 0 }; S.stkIn ??= { blue: 0, growth: 0, coin: 0, lev: 0 };
  S.stkReal ??= 0; S.overwarn ??= 0; S.crisisT ??= null; S.crisisLeft ??= 0;
  const st = S.st; st.chTry ??= 0; st.sideEarn ??= 0; st.bizPeak ??= 0; st.stkGainMax ??= 0; st.coinGain ??= 0; st.blueTurns ??= 0; st.blueGain ??= 0; st.crisisStkLoss ??= 0; st.crisisBuy ??= 0;
  if (S.crisisT == null) { // 가상 금융위기 시점: 2028~2031년 사이
    const y0 = S.startYear, lo = Math.max(2, (2028 - y0) * 2), hi = Math.min(MAXT - 4, (2031 - y0) * 2 + 1);
    S.crisisT = Math.floor(rnd(lo, hi + 1));
  }
}

// ---------- 노동 ----------
// 반기 단위: 수입(억), 체력, 행복
const WORK = {
  main: { ic: '🏢', t: '본업에 집중', d: '정시 퇴근, 업무 역량 쌓기 · 승진 확률 ↑', add: 0, hp: 8, hap: 3 },
  two: { ic: '🛵', t: '투잡 뛰기', d: '퇴근 후 배달·아르바이트', add: .03, hp: -15, hap: -6 },
  three: { ic: '🌙', t: '쓰리잡 뛰기', d: '밤낮없이 일해 종잣돈 모으기', add: .065, hp: -26, hap: -14 },
  rest: { ic: '🛌', t: '휴식·재충전', d: '연차를 몰아 쓰고 건강 회복 · 월급 일부 감소', add: 0, hp: 30, hap: 10 },
  biz: { ic: '🚀', t: '퇴사하고 창업', d: '퇴직금으로 작은 사업 시작 · 월급 없음', add: 0, hp: -15, hap: -4 },
  bizrun: { ic: '📦', t: '사업에 올인', d: '사업을 키울 기회 ↑ · 체력 소모 큼', add: 0, hp: -22, hap: -4 },
  bizlite: { ic: '☕', t: '사업 적당히 운영', d: '무리하지 않고 현상 유지', add: 0, hp: 6, hap: 4 },
  rejoin: { ic: '🔙', t: '사업 정리·재취업', d: '가게를 정리하고 다시 회사로', add: 0, hp: 5, hap: 0 },
};
function workOptions() { return S.biz ? ['bizrun', 'bizlite', 'rejoin'] : ['main', 'two', 'three', 'rest', 'biz']; }
function sideMul() { return 1 + Math.max(0, S.t - 4) * .015; } // 부업 단가도 물가 따라 조금씩 오름
function hpCost(k) { const w = WORK[k]; if (w.hp >= 0) return w.hp; return Math.round(w.hp * (ageOf() >= 40 ? 1.2 : 1) * (S.kids.length ? 1.1 : 1)); }
function workPreview(k) {
  const w = WORK[k]; let inc = 0;
  if (k === 'biz') inc = -.05;
  else if (k === 'rest') inc = -S.salary / 2 * .15;
  else if (S.biz) inc = 0; else inc = w.add * sideMul();
  return { inc, hp: hpCost(k), hap: w.hap };
}
const BIZ_REV = [0, .04, .12, .32, .75]; // 사업 단계별 반기 순이익(억)
const BIZ_N = ['', '작은 온라인 스토어', '입소문 난 가게', '직원 10명 회사', '업계가 주목하는 기업'];
function doWork() { // 반기 정산 직전에 호출 → 결과 요약 반환
  const k = S.plan.work, w = WORK[k], R = { k, inc: 0, lines: [] };
  S.w[k in S.w ? k : 'biz'] = (S.w[k in S.w ? k : 'biz'] || 0) + 1;
  if (k === 'biz') {
    S.biz = { lv: 1, t: S.t, bad: 0 }; S.jobSal = S.salary; S.salary = 0; S.cash = r2(S.cash - .05); R.inc = -.05;
    R.lines.push('🚀 회사를 그만두고 창업했습니다. 초기 비용 500만 원. 이제 월급은 없습니다.');
  } else if (k === 'rejoin') {
    S.salary = r2((S.jobSal || .48) * .9); S.biz = null; S.plan.work = 'main';
    R.lines.push(`🔙 사업을 정리하고 재취업했습니다. 연봉 ${won(S.salary)}.`);
  } else if (k === 'bizrun' || k === 'bizlite') {
    const b = S.biz, up = k === 'bizrun' ? .26 : .12, bad = k === 'bizrun' ? .3 : .22, r = Math.random();
    if (r < up && b.lv < 4) { b.lv++; b.bad = 0; R.lines.push(`📈 사업이 성장했습니다! 이제 '${BIZ_N[b.lv]}' 단계입니다.`); }
    else if (r > 1 - bad) {
      const loss = r2(.05 * b.lv * rnd(.8, 1.6)); S.bizDebt = r2(S.bizDebt + loss); b.bad++; R.inc -= loss;
      R.lines.push(`📉 매출이 꺾였습니다. 손실 ${won(loss)}은 사업자 대출로 메웠습니다.`);
      if (b.bad >= 3 && b.lv <= 2) { S.flags.bizFail = true; S.biz = null; S.salary = r2((S.jobSal || .48) * .85); S.plan.work = 'main'; R.lines.push('🏚️ 결국 사업을 접었습니다. 남은 사업 빚을 안고 다시 회사에 들어갔습니다.'); }
      else if (b.bad >= 2 && b.lv > 1) { b.lv--; R.lines.push('사업 규모를 줄였습니다.'); }
    }
    if (S.biz) { const rev = r2(BIZ_REV[S.biz.lv] * rnd(.7, 1.3) * (k === 'bizlite' ? .8 : 1)); S.cash = r2(S.cash + rev); R.inc += rev; S.biz.inc = rev; S.st.bizPeak = Math.max(S.st.bizPeak, S.biz.lv); R.lines.push(`💼 사업 순이익 +${won(rev)}`); }
    if (S.bizDebt > 0 && S.cash > S.bizDebt * 1.5) { S.cash = r2(S.cash - S.bizDebt); R.lines.push(`사업자 대출 ${won(S.bizDebt)}을 갚았습니다.`); S.bizDebt = 0; }
  } else {
    if (k === 'rest') { const cut = r2(S.salary / 2 * .15); S.cash = r2(S.cash - cut); R.inc -= cut; }
    const add = r2(w.add * sideMul()); if (add) { S.cash = r2(S.cash + add); S.st.sideEarn = r2(S.st.sideEarn + add); R.inc += add; R.lines.push(`${w.ic} ${w.t}로 ${won(add)}을 더 벌었습니다.`); }
    // 승진: 본업에 집중할수록 확률 ↑, 부업은 경력을 갉아먹음
    S.career = k === 'main' ? S.career + 1 : k === 'rest' ? S.career : Math.max(0, S.career - (k === 'three' ? 2 : 1));
    if (k === 'main' && Math.random() < Math.min(.35, .04 + S.career * .035)) { S.salary = r2(S.salary * 1.13); S.promos++; S.career = 0; R.lines.push(`🎉 승진했습니다! 연봉이 ${won(S.salary)}으로 올랐습니다.`); }
  }
  S.hp = clamp(S.hp + hpCost(k), 0, 100);
  S.happy = clamp(S.happy + w.hap, 0, 100);
  R.hp = S.hp;
  // 체력 경고 · 과로
  if (S.hp <= 0) {
    if (S.overwarn >= 2) { S.ended = 'e16'; R.lines.push('🚑 쓰러졌습니다…'); return R; }
    const bill = .03; S.cash = r2(S.cash - bill); S.hp = 35; S.overwarn++; S.plan.work = S.biz ? 'bizlite' : 'rest';
    R.lines.push(`🚑 과로로 쓰러져 입원했습니다. 병원비 ${won(bill)}. 의사가 "이대로면 정말 위험하다"고 경고했습니다. (경고 ${S.overwarn}/2) 다음 반기는 쉬도록 바꿔 두었어요.`);
  } else if (S.hp < 25) { R.lines.push(`⚠️ 체력 ${S.hp}. 과로 경고 단계입니다. 쉬지 않으면 쓰러질 수 있어요.`); if (Math.random() < .25) { const b = .015; S.cash = r2(S.cash - b); R.lines.push(`🤒 몸살로 병원에 다녀왔습니다. ${won(b)}`); } }
  else if (S.hp >= 60 && S.overwarn > 0 && Math.random() < .5) S.overwarn--;
  if (ageOf() >= 42) S.hp = clamp(S.hp - 2, 0, 100); // 나이가 들수록 체력이 조금씩 떨어짐
  return R;
}

// ---------- 주식 ----------
const STK = {
  blue: { ic: '🏛️', t: '우량주', d: '변동이 작고 꾸준함', mu: 3, sd: 9, crash: -.33 },
  growth: { ic: '🚀', t: '성장주', d: '오를 땐 크게, 떨어질 땐 아프게', mu: 5, sd: 17, crash: -.5 },
  coin: { ic: '🪙', t: '코인', d: '하룻밤에 2배 또는 반토막', mu: 9, sd: 45, crash: -.65 },
  lev: { ic: '🎢', t: '레버리지(빚투)', d: '성장주 수익률 2배 · 크게 빠지면 강제 청산', mu: 0, sd: 0, crash: -1 },
};
const stockValue = () => r2(S.stk.blue + S.stk.growth + S.stk.coin + S.stk.lev);
const stockIn = () => r2(S.stkIn.blue + S.stkIn.growth + S.stkIn.coin + S.stkIn.lev);
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function stockShock() { // 역사적 사건 + 가상 금융위기
  const y = yearOf(), h = S.t % 2;
  if (S.mode === 'hist' && y === 2020 && h === 0) return { all: -.28, tag: '팬데믹 충격' };
  if (S.mode === 'hist' && y === 2020 && h === 1) return { all: .38, coinX: 1.8, tag: '유동성 랠리' };
  if (S.mode === 'hist' && y === 2022) return { all: -.16, coinX: 2, tag: '금리 인상기' };
  if (S.crisisLeft === 1) return { all: .18, tag: '위기 후 반등' };
  return null;
}
function stepStocks() {
  const out = { before: stockValue(), lines: [] }, sh = stockShock(), crisisNow = S.t === S.crisisT;
  let growthRet = 0;
  for (const k of ['blue', 'growth', 'coin']) {
    if (S.stk[k] <= 0 && k !== 'growth') continue;
    let ret = (STK[k].mu + gauss() * STK[k].sd) / 100;
    if (sh) ret = sh.all * (k === 'coin' ? (sh.coinX || 1.5) : k === 'growth' ? 1.3 : 1) + ret * .3;
    if (crisisNow) ret = STK[k].crash + rnd(-.05, .05);
    ret = clamp(ret, -.9, 3);
    if (k === 'growth') growthRet = ret;
    S.stk[k] = r2(S.stk[k] * (1 + ret));
  }
  if (S.stk.lev > 0) {
    S.stk.lev = r2(S.stk.lev * (1 + clamp(growthRet * 2, -1, 4)));
    if (S.stk.lev < S.stkIn.lev * .3) { // 강제 청산: 남은 평가금은 날아가고 추가 채무 발생
      const owe = r2(S.stkIn.lev * .35); S.credit = r2(S.credit + owe); S.flags.levLiq = true;
      out.lines.push(`☠️ 레버리지 계좌가 반대매매로 강제 청산됐습니다. 남은 돈은 0원, 갚아야 할 빚 ${won(owe)}이 생겼습니다.`);
      S.stk.lev = 0; S.stkIn.lev = 0;
    }
  }
  if (S.stk.blue > .05) { S.st.blueTurns++; } else S.st.blueTurns = 0;
  out.after = stockValue(); out.diff = r2(out.after - out.before);
  const gain = r2(out.after - stockIn() + S.stkReal); S.st.stkGainMax = Math.max(S.st.stkGainMax, gain);
  if (crisisNow && out.diff < 0) S.st.crisisStkLoss = r2(S.st.crisisStkLoss - out.diff);
  if (out.before > 0) out.lines.unshift(`📈 주식 계좌 ${out.diff >= 0 ? '+' : ''}${won(out.diff)}${sh ? ` (${sh.tag})` : ''} → ${won(out.after)}`);
  return out;
}
function buyStock(k, amt) { amt = r2(Math.min(amt, S.cash)); if (amt <= 0) return; S.cash = r2(S.cash - amt); S.stk[k] = r2(S.stk[k] + amt); S.stkIn[k] = r2(S.stkIn[k] + amt); log(`${STK[k].ic} ${STK[k].t} ${won(amt)} 매수`); }
function sellStock(k, amt) {
  amt = r2(Math.min(amt, S.stk[k])); if (amt <= 0) return;
  const ratio = amt / S.stk[k], basis = r2(S.stkIn[k] * ratio), gain = r2(amt - basis);
  S.stk[k] = r2(S.stk[k] - amt); S.stkIn[k] = r2(S.stkIn[k] - basis); S.cash = r2(S.cash + amt); S.stkReal = r2(S.stkReal + gain);
  if (k === 'coin' && gain > 0) S.st.coinGain = r2(S.st.coinGain + gain);
  if (k === 'blue' && gain > 0 && S.st.blueTurns >= 16) S.st.blueGain = r2(S.st.blueGain + gain);
  log(`${STK[k].ic} ${STK[k].t} ${won(amt)} 매도 (${gain >= 0 ? '수익 +' : '손실 '}${won(gain)})`);
}

// ---------- 경제위기 ----------
function worldCrisis() { // 가상 금융위기 발생 반기
  if (S.t !== S.crisisT) { if (S.crisisLeft > 0) S.crisisLeft--; return null; }
  S.crisisLeft = 2; S.gShock = (S.gShock || 0) - 13; S.tightCrisis = 2;
  const cands = APTS.filter(a => a.kind === 'buy' && S.avail[a.id]).sort(() => Math.random() - .5);
  S.deal = { aid: cands[0].id, disc: .15, t: S.t + 1 };
  S.st.cashAtCrisis = S.cash;
  if (!S.biz && Math.random() < .25) { S.layoffNext = true; }
  return { t: `${yearOf()}년, 세계 금융위기 발생!`, d: '해외 금융시장 불안이 한국까지 번졌습니다. 증시가 폭락하고, 아파트 거래가 얼어붙었습니다. 은행들은 대출 문을 좁혔습니다.' };
}

// ---------- 매수 추천 3곳 ----------
function shortfall(aid) { // 지금 실거주 매수에 모자란 현금 (0이면 가능)
  const a = AP[aid];
  if (a.kind === 'buy') { const q = buyQuote(aid, 'live'); return { need: q.cashNeed, short: r2(Math.max(0, q.cashNeed - S.cash - q.resBack)), loan: q.lim.max }; }
  if (a.kind === 'bun') { const c = r2(a.p * .1 + Math.max(0, price(aid) - a.p) + price(aid) * .005); return { need: c, short: r2(Math.max(0, c - S.cash)), loan: 0 }; }
  const c = r2(price(aid) * .72 - ipjLoan(aid)); return { need: c, short: r2(Math.max(0, c - S.cash)), loan: ipjLoan(aid) };
}
function picks3() {
  const out = [];
  for (const kind of ['buy', 'bun', 'ipj']) {
    const list = APTS.filter(a => a.kind === kind && S.avail[a.id] && !S.props.some(p => p.aid === a.id)).map(a => ({ a, ...shortfall(a.id) }));
    if (!list.length) continue;
    const ok = list.filter(x => x.short <= 0).sort((x, y) => price(y.a.id) - price(x.a.id));
    out.push(ok.length ? ok[0] : list.sort((x, y) => x.short - y.short)[0]);
  }
  if (out.length < 3) { const more = APTS.filter(a => a.kind === 'buy' && S.avail[a.id] && !out.some(o => o.a === a)).map(a => ({ a, ...shortfall(a.id) })).sort((x, y) => x.short - y.short); while (out.length < 3 && more.length) out.push(more.shift()); }
  return out;
}
function firstHomeGap() { // 첫 집까지 남은 돈: 가장 싼 실거주 매수 기준
  const l = APTS.filter(a => a.kind === 'buy' && S.avail[a.id]).map(a => shortfall(a.id)).sort((x, y) => x.short - y.short)[0];
  return l || { short: 0, need: 0 };
}

// ---------- 용어 설명 ----------
const TERMS = {
  LTV: ['LTV (담보인정비율)', '집값에 비해 은행이 빌려주는 비율이에요. 10억 원 집에 LTV 40%면 최대 4억 원까지 빌릴 수 있어요.'],
  DSR: ['DSR (총부채원리금상환비율)', '1년 동안 갚을 모든 대출의 원금과 이자가 연소득의 몇 %인지 보는 기준이에요. 40%를 넘으면 대출이 더 안 나와요.'],
  갭투자: ['갭투자', '세입자의 전세보증금을 끼고 집을 사서, 집값과 보증금의 차이(갭)만큼만 내 돈을 넣는 방법이에요. 전셋값이 떨어지면 차액을 돌려줘야 해요.'],
  분양권: ['분양권', '청약에 당첨되거나 산, 아직 지어지지 않은 새 아파트에 들어갈 권리예요. 계약금은 지금, 잔금은 입주 때 내요.'],
  입주권: ['입주권', '재개발·재건축 조합원이 새 아파트를 받을 권리예요. 공사비가 오르면 분담금이 늘고, 사업이 늦어지면 돈이 오래 묶여요.'],
  가점: ['청약 가점', '무주택 기간(32점) + 부양가족(35점) + 통장 가입 기간(17점), 84점 만점이에요. 점수가 높을수록 당첨 확률이 올라가요.'],
  체력: ['체력', '투잡·쓰리잡·창업은 체력을 깎아요. 25 아래면 경고, 0이 되면 쓰러져 입원해요. 경고를 무시하고 반복하면 과로사 엔딩이 나올 수 있어요.'],
  전세가율: ['전세가율', '매매가 대비 전셋값 비율이에요. 높을수록 갭투자에 돈이 적게 들지만, 전셋값이 떨어지면 위험해요.'],
  레버리지: ['레버리지(빚투)', '빚을 내서 투자해 수익률을 2배로 키우는 방법이에요. 크게 빠지면 증권사가 강제로 팔아 버리고(반대매매) 빚만 남을 수 있어요.'],
};
function term(k, label) { return `<button class="term" data-term="${k}">${label || k}<i>?</i></button>`; }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-term]'); if (!b) return; e.stopPropagation(); const t = TERMS[b.dataset.term]; if (!t) return; const m = $('#tip'); m.innerHTML = `<b>${t[0]}</b><p>${t[1]}</p>`; m.classList.add('on'); clearTimeout(term.h); term.h = setTimeout(() => m.classList.remove('on'), 6000); }, true);
document.addEventListener('click', e => { if (!(e.target.closest && e.target.closest('[data-term]'))) { const m = $('#tip'); if (m) m.classList.remove('on'); } });
