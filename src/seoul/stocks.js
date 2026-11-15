// ===================== 주식 시장: 종목 12개 · 종목별 뉴스 =====================
// k: 위험 묶음(blue 우량·growth 성장·coin 가상자산·lev 레버리지) — 금융위기 낙폭과 엔딩 판정에 쓰임
// 모든 종목·뉴스는 게임용 가상입니다.
const TICK = [
  { id: 'dhe', n: '대한전자', sec: '반도체·가전', k: 'blue', ic: '💾', p0: 52000, mu: 3.5, sd: 11, d: '국내 대표 반도체·가전 기업. 경기에 따라 출렁이지만 길게 보면 꾸준히 오르는 국민주.',
    iss: [[1, '차세대 메모리 대규모 수주 성공!'], [1, '분기 영업이익, 시장 예상치 30% 웃돌아'], [-1, '반도체 재고 쌓여 감산 검토'], [-1, '해외 공장 가동 일시 중단'], [0, '외국인 투자자 5일째 순매수']] },
  { id: 'hbt', n: '한빛통신', sec: '통신·고배당', k: 'blue', ic: '📡', p0: 34000, mu: 2, sd: 6, div: .025, d: '주가 변동은 작지만 매년 배당금을 꼬박꼬박 주는 방어주. 반기마다 배당이 현금으로 들어와요.',
    iss: [[1, '배당금 역대 최대 발표'], [1, '5G 가입자 1,000만 돌파'], [-1, '통신요금 인하 압박 커져'], [0, '정부, 통신 3사 요금 점검'], [-1, '대규모 통신 장애로 보상 논란']] },
  { id: 'sfg', n: '서울금융지주', sec: '은행', k: 'blue', ic: '🏦', p0: 61000, mu: 2.5, sd: 9, rate: 1, d: '금리가 오르면 이자 이익이 늘어 웃는 은행주. 대신 경기가 나빠지면 부실 대출이 걱정이에요.',
    iss: [[1, '순이자마진 개선, 사상 최대 실적'], [1, '자사주 소각 발표'], [-1, '부동산 PF 부실 우려 확산'], [-1, '가계대출 규제 강화로 성장 둔화'], [0, '금리 동결 발표에 보합']] },
  { id: 'usx', n: '미국 대표지수 ETF', sec: '해외 지수', k: 'blue', ic: '🌎', p0: 15000, mu: 4.5, sd: 10, d: '미국 대형주 500개에 나눠 투자하는 상품. 한 회사가 망해도 크게 흔들리지 않아요.',
    iss: [[1, '미국 증시 사상 최고치 경신'], [1, '미국 고용 지표 호조'], [-1, '미국 기준금리 인상 우려'], [-1, '환율 급락으로 원화 환산 수익 감소'], [0, '연준 의장 발언 앞두고 관망세']] },
  { id: 'mbt', n: '미래배터리', sec: '2차전지', k: 'growth', ic: '🔋', p0: 240000, mu: 6, sd: 24, d: '전기차 배터리 대표 성장주. 기대가 크면 크게 오르고, 실망하면 크게 떨어져요.',
    iss: [[1, '유럽 완성차와 10년 공급 계약!'], [1, '신형 배터리 주행거리 30% 늘려'], [-1, '전기차 수요 둔화, 주문 감소'], [-1, '배터리 화재 리콜 소식'], [0, '공매도 재개 앞두고 변동성 확대']] },
  { id: 'hgb', n: '한강바이오', sec: '신약 개발', k: 'growth', ic: '🧬', p0: 87000, mu: 4, sd: 30, d: '임상 결과 하나에 주가가 두 배 또는 반토막이 나는 바이오주. 뉴스에 가장 민감해요.',
    iss: [[1, '신약 임상 3상 성공! 상한가 직행'], [1, '글로벌 제약사에 기술 수출 1조 원'], [-1, '임상 2상 실패… 하한가'], [-1, '식약처 허가 지연'], [0, '학회 발표 앞두고 기대감']] },
  { id: 'neo', n: '네오AI', sec: '인공지능', k: 'growth', ic: '🤖', p0: 118000, mu: 7, sd: 25, d: '인공지능 반도체·서비스를 만드는 기술주. 미래 기대가 주가에 많이 반영돼 있어요.',
    iss: [[1, '자체 AI 모델 공개, 글로벌 관심 집중'], [1, '빅테크와 데이터센터 계약 체결'], [-1, 'AI 거품론 확산에 기술주 급락'], [-1, '핵심 개발자 대거 이탈'], [0, '신제품 발표회 일정 공개']] },
  { id: 'kent', n: '케이스타엔터', sec: '엔터테인먼트', k: 'growth', ic: '🎤', p0: 45000, mu: 4, sd: 19, d: '아이돌 그룹 기획사. 대형 컴백과 해외 투어가 실적을 좌우해요.',
    iss: [[1, '소속 그룹 월드 투어 전석 매진'], [1, '신인 그룹 데뷔곡 글로벌 1위'], [-1, '간판 그룹 재계약 불발 우려'], [-1, '앨범 판매량 전년보다 감소'], [0, '하반기 컴백 일정 발표']] },
  { id: 'dcon', n: '대한건설', sec: '건설', k: 'growth', ic: '🏗️', p0: 28000, mu: 2, sd: 15, house: 1, d: '아파트를 짓는 건설사. 서울 집값과 분양 시장이 좋으면 같이 웃어요.',
    iss: [[1, '서울 대형 재건축 수주 성공'], [1, '분양 완판 행진'], [-1, '미분양 늘어 실적 경고'], [-1, '공사비 급등으로 적자 전환'], [0, '정부 공급 대책 발표 대기']] },
  { id: 'btc', n: '비트코인', sec: '가상자산', k: 'coin', ic: '🪙', p0: 30000000, mu: 9, sd: 42, d: '대표 가상자산. 하룻밤에 수십 퍼센트씩 움직여요. 금융위기 때는 가장 크게 떨어질 수 있어요.',
    iss: [[1, '해외 현물 ETF 승인 기대감'], [1, '반감기 앞두고 매수세 몰려'], [-1, '대형 거래소 해킹 사고'], [-1, '각국 규제 강화 움직임'], [0, '고래 지갑 대량 이동 포착']] },
  { id: 'alt', n: '멍멍코인', sec: '밈코인', k: 'coin', ic: '🐶', p0: 120, mu: 6, sd: 75, d: '유명인 한마디에 10배가 되기도, 0원 가까이 떨어지기도 하는 밈코인. 재미로만!',
    iss: [[1, '유명 기업가가 SNS에 언급! 폭등'], [1, '해외 결제 서비스 도입 소식'], [-1, '개발팀 물량 대거 매도'], [-1, '거래소 상장 폐지 경고'], [0, '커뮤니티 밈 유행 중']] },
  { id: 'lev', n: '나스닥 2배 레버리지', sec: '레버리지 ETF', k: 'lev', ic: '🎢', p0: 9000, mu: 0, sd: 0, d: '기술주 지수 움직임의 2배로 움직이는 상품. 크게 빠지면 강제 청산되고 빚이 남을 수 있어요.',
    iss: [[1, '기술주 랠리, 레버리지 수익률 급등'], [1, '나스닥 사상 최고치'], [-1, '기술주 급락, 레버리지 손실 확대'], [-1, '변동성 지수 급등 경고'], [0, '금리 결정 앞두고 숨 고르기']] },
];
const TK = Object.fromEntries(TICK.map(t => [t.id, t]));
const KIND_DEF = { blue: 'usx', growth: 'neo', coin: 'btc', lev: 'lev' };
function stockInit() {
  // 이전 버전 버그 복구: 주식 시세가 S.px(아파트 시세)를 덮어쓴 세이브
  if (S.px && S.px.dhe && Array.isArray(S.px.dhe)) { S.spx = S.spx || {}; for (const t of TICK) if (Array.isArray(S.px[t.id])) { S.spx[t.id] = S.px[t.id]; delete S.px[t.id]; } }
  if (S.px && S.hist) for (const a of APTS) if (!Number.isFinite(S.px[a.id])) {
    const h = (S.hist[a.id] || []).filter(Number.isFinite), g = S.Gh && S.Gh.length ? S.G / S.Gh[Math.max(0, S.Gh.length - h.length)] : 1;
    S.px[a.id] = r2(h.length ? h[h.length - 1] * (h.length < (S.hist[a.id] || []).length ? g : 1) : a.p);
    S.hist[a.id] = (S.hist[a.id] || []).map(v => Number.isFinite(v) ? v : S.px[a.id]);
  }
  if (S.hold && !S.spx) { S.spx = {}; for (const t of TICK) S.spx[t.id] = [t.p0]; }
  if (S.hold) return;
  S.hold = {}; S.spx = {}; S.news = {};
  for (const t of TICK) S.spx[t.id] = [t.p0];
  for (const k of ['blue', 'growth', 'coin', 'lev']) if (S.stk && S.stk[k] > 0) S.hold[KIND_DEF[k]] = { v: S.stk[k], in: S.stkIn[k] || S.stk[k] };
  syncKinds();
}
function syncKinds() {
  S.stk = { blue: 0, growth: 0, coin: 0, lev: 0 }; S.stkIn = { blue: 0, growth: 0, coin: 0, lev: 0 };
  for (const [id, h] of Object.entries(S.hold || {})) { const k = TK[id].k; S.stk[k] = r2(S.stk[k] + h.v); S.stkIn[k] = r2(S.stkIn[k] + h.in); }
}
const pxNow = id => { const a = S.spx[id]; return a[a.length - 1]; };
const pxChg = id => { const a = S.spx[id]; return a.length > 1 ? (a[a.length - 1] / a[a.length - 2] - 1) * 100 : 0; };
function fmtPx(p) { return p >= 1e4 ? Math.round(p).toLocaleString() + '원' : p >= 100 ? Math.round(p).toLocaleString() + '원' : p.toFixed(1) + '원'; }

function stepStocks() {
  stockInit();
  const out = { before: stockValue(), lines: [] }, sh = stockShock(), crisisNow = S.t === S.crisisT;
  const dRate = S.hr && S.hr.length > 1 ? S.rate - S.hr[S.hr.length - 1] : 0, gH = S.Gh.length > 1 ? (S.Gh[S.Gh.length - 1] / S.Gh[S.Gh.length - 2] - 1) * 100 : 0;
  const baseGrowth = (5 + gauss() * 17) / 100; let divCash = 0;
  for (const t of TICK) {
    let ret = t.k === 'lev' ? baseGrowth * 2 : (t.mu + gauss() * t.sd) / 100;
    if (t.rate) ret += dRate * .04;
    if (t.house) ret += gH * .012;
    if (sh) { const sk = sh.all * (t.k === 'coin' ? (sh.coinX || 1.5) : t.k === 'growth' ? 1.3 : t.k === 'lev' ? 2.6 : 1); ret = sk + ret * .3; }
    if (crisisNow) ret = (t.k === 'lev' ? -.75 : STK[t.k].crash) + rnd(-.06, .06);
    ret += (S.news[t.id] || 0) / 100; S.news[t.id] = 0;
    ret = clamp(ret, -.92, t.k === 'coin' ? 4 : 2);
    S.spx[t.id].push(Math.max(t.p0 * .02, pxNow(t.id) * (1 + ret))); if (S.spx[t.id].length > 42) S.spx[t.id].shift();
    const h = S.hold[t.id]; if (!h) continue;
    h.v = r2(h.v * (1 + ret));
    if (t.div && h.v > 0) divCash += h.v * t.div / 2;
    if (t.k === 'lev' && h.v < h.in * .3) {
      const owe = r2(h.in * .35); S.credit = r2(S.credit + owe); S.flags.levLiq = true; delete S.hold[t.id];
      out.lines.push(`☠️ ${t.n}가 반대매매로 강제 청산됐습니다. 남은 돈은 0원, 갚아야 할 빚 ${won(owe)}이 생겼습니다.`);
    } else if (h.v < .0005) delete S.hold[t.id];
  }
  if (divCash > .0005) { S.cash = r2(S.cash + divCash); out.lines.push(`💵 배당금 ${won(divCash)}이 들어왔습니다.`); }
  syncKinds();
  if (S.stk.blue > .05) S.st.blueTurns++; else S.st.blueTurns = 0;
  out.after = stockValue(); out.diff = r2(out.after - out.before);
  S.st.stkGainMax = Math.max(S.st.stkGainMax, r2(out.after - stockIn() + S.stkReal));
  if (crisisNow && out.diff < 0) S.st.crisisStkLoss = r2(S.st.crisisStkLoss - out.diff);
  if (out.before > 0) out.lines.unshift(`📈 주식 계좌 ${out.diff >= 0 ? '+' : ''}${won(out.diff)}${sh ? ` (${sh.tag})` : ''} → ${won(out.after)}`);
  return out;
}
function buyStock(id, amt) {
  stockInit(); if (!TK[id]) id = KIND_DEF[id] || 'usx';
  amt = r2(Math.min(amt, S.cash)); if (amt <= 0) return;
  S.cash = r2(S.cash - amt); const h = S.hold[id] || (S.hold[id] = { v: 0, in: 0 }); h.v = r2(h.v + amt); h.in = r2(h.in + amt);
  syncKinds(); log(`${TK[id].ic} ${TK[id].n} ${won(amt)} 매수`);
}
function sellOne(id, amt) {
  const h = S.hold[id]; if (!h) return 0; amt = r2(Math.min(amt, h.v)); if (amt <= 0) return 0;
  const basis = r2(h.in * amt / h.v), gain = r2(amt - basis), t = TK[id];
  h.v = r2(h.v - amt); h.in = r2(h.in - basis); if (h.v < .0005) delete S.hold[id];
  S.cash = r2(S.cash + amt); S.stkReal = r2(S.stkReal + gain);
  if (t.k === 'coin' && gain > 0) S.st.coinGain = r2(S.st.coinGain + gain);
  if (t.k === 'blue' && gain > 0 && S.st.blueTurns >= 16) S.st.blueGain = r2(S.st.blueGain + gain);
  log(`${t.ic} ${t.n} ${won(amt)} 매도 (${gain >= 0 ? '수익 +' : '손실 '}${won(gain)})`);
  return amt;
}
function sellStock(idOrKind, amt) {
  stockInit();
  if (TK[idOrKind]) { sellOne(idOrKind, amt); syncKinds(); return; }
  let left = amt; for (const id of Object.keys(S.hold).filter(i => TK[i].k === idOrKind)) { if (left <= 0) break; left = r2(left - sellOne(id, left)); }
  syncKinds();
}
function bumpStock(id, delta) { const h = S.hold[id]; if (h) { h.v = r2(Math.max(0, h.v + delta)); syncKinds(); } }
function pickIssue(id) { // 이번 매매 때 뜨는 종목 뉴스. 다음 반기 주가에 반영
  const t = TK[id], it = t.iss[Math.floor(Math.random() * t.iss.length)];
  const mag = it[0] === 0 ? rnd(-1.5, 1.5) : it[0] * rnd(4, t.k === 'coin' ? 18 : t.sd > 20 ? 12 : 7);
  S.news[id] = (S.news[id] || 0) + mag;
  return { sign: it[0], h: it[1], mag };
}
