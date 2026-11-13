// ===================== 화면 =====================
let TAB = 'home', MAPGU = null, FILTER = 'all', ONLYOK = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TRN = { rb: '재건축 기대', sc: '학군', tr: '교통', hv: '한강', nw: '신축', bg: '대단지' };
function tags(tr) { return Object.entries(tr || {}).filter(([, v]) => v >= .5).map(([k]) => `<span class="tg tg-${k}">${TRN[k]}</span>`).join(''); }
function toast(s) { const t = $('#toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
function modal(html, cls = '') { const m = $('#modal'); m.innerHTML = `<div class="mbox ${cls}">${html}</div>`; m.classList.add('on'); m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal); }
function closeModal() { $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; }
function spark(arr, w = 120, h = 34) {
  if (!arr || arr.length < 2) return '';
  const mn = Math.min(...arr), mx = Math.max(...arr), sx = w / (arr.length - 1), sy = mx > mn ? (h - 4) / (mx - mn) : 0;
  const pts = arr.map((v, i) => `${(i * sx).toFixed(1)},${(h - 2 - (v - mn) * sy).toFixed(1)}`).join(' ');
  const up = arr[arr.length - 1] >= arr[0];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline fill="none" stroke="${up ? '#e5484d' : '#3b82f6'}" stroke-width="2" points="${pts}"/></svg>`;
}
function chg(id, n = 2) { const h = S.hist[id]; if (!h || h.length <= n) return 0; return (h[h.length - 1] / h[h.length - 1 - n] - 1) * 100; }

// ---------- 타이틀 ----------
function renderTitle() {
  const sv = store.get('_save', null), dex = store.get('_dex', {});
  $('#app').innerHTML = `<div class="title fade">
    <div class="sky"><div class="sun"></div>${skyline()}</div>
    <div class="tcard">
      <div class="kicker">MY FIRST SEOUL APARTMENT</div>
      <h1>나의 첫 번째<br><b>서울 아파트</b> 구하기</h1>
      <p class="sub">월급쟁이로 시작해 서울에 내 집 한 채.<br>어떤 집을, 언제, 어떻게 샀느냐에 따라 <b>40가지 인생</b>이 갈립니다.</p>
      <div class="chips"><span>🏙️ 서울 25개 구</span><span>🏢 실존 단지 30곳</span><span>🎬 엔딩 40종</span><span>⏳ 최대 20년</span></div>
      ${sv && !sv.ended ? `<button class="btn pri big" id="bCont">이어하기 · ${sv.name} ${sv.startYear + Math.floor(sv.t / 2)}년</button>` : ''}
      <button class="btn ${sv && !sv.ended ? '' : 'pri big'}" id="bNew">🏁 새 인생 시작</button>
      <button class="btn ghost" id="bDex">📖 엔딩 도감 (${Object.keys(dex).length}/40)</button>
      <p class="fine">게임 속 시세·수익률은 실제 공개 자료를 참고한 <b>게임용 시뮬레이션 수치</b>이며 미래 시세 예측이나 투자 권유가 아닙니다. 단지 이름은 실제 장소, 그 외 인물·사건은 가상입니다.</p>
      <a class="other" href="/">← aptgame.kr 다른 부동산 게임</a>
    </div></div>`;
  if ($('#bCont')) $('#bCont').onclick = () => { S = sv; renderGame(); };
  $('#bNew').onclick = renderSetup;
  $('#bDex').onclick = () => renderDexPage(renderTitle);
}
function skyline() {
  let s = '<svg class="city" viewBox="0 0 400 120" preserveAspectRatio="none">';
  const hs = [50, 80, 64, 95, 70, 110, 58, 88, 74, 100, 62, 84, 54, 92, 66, 78, 104, 60, 86, 72];
  hs.forEach((h, i) => { s += `<rect x="${i * 20 + 2}" y="${120 - h}" width="17" height="${h}" rx="2" fill="rgba(31,37,71,${.35 + (i % 3) * .15})"/>`; for (let y = 120 - h + 8; y < 114; y += 12) s += `<rect x="${i * 20 + 6}" y="${y}" width="3" height="4" fill="#ffe7a3" opacity=".7"/><rect x="${i * 20 + 12}" y="${y}" width="3" height="4" fill="#ffe7a3" opacity=".5"/>`; });
  return s + '<path d="M0 118 Q100 108 200 116 T400 112 V120 H0Z" fill="#7cc4e8" opacity=".8"/></svg>';
}

// ---------- 시작 설정 ----------
function renderSetup() {
  let mode = 'real', diff = 'd5';
  const draw = () => {
    $('#app').innerHTML = `<div class="setup fade">
      <h2>🗓️ 2026년, 서울에 첫 직장을 얻었습니다.</h2>
      <div class="me card"><div class="avatar">🧑‍💼</div><div><b>29세 · 무주택 · 서울 거주</b><br><span class="small">연봉 4,800만 원 · 월세 85만 원 · 청약통장 가입 5년</span></div></div>
      <label class="lbl">이름</label><input id="nm" maxlength="8" placeholder="나" value="">
      <label class="lbl">시장 모드</label>
      <div class="opts">
        <button class="opt ${mode === 'real' ? 'on' : ''}" data-m="real"><b>🏛️ 2026 현실 모드</b><span>서울 전역 토지거래허가구역. 갭투자 불가, 2년 실거주 의무, LTV 40%(생애최초 70%). 이후 시장은 가상 시나리오.</span></button>
        <button class="opt ${mode === 'hist' ? 'on' : ''}" data-m="hist"><b>📜 역사 모드 (2015년 시작)</b><span>2015년 완화기부터 시작. 8·2, 12·16, 10·15 대책을 차례로 겪으며 갭투자도 합법적으로 체험.</span></button>
      </div>
      <label class="lbl">시작 자금 (난이도)</label>
      <div class="diffs">${Object.entries(DIFFS).map(([k, d]) => `<button class="df ${diff === k ? 'on' : ''}" data-d="${k}"><b>${d.n}</b><span>${d.d}</span></button>`).join('')}</div>
      <button class="btn pri big" id="go">다음: 첫 번째 선택 →</button>
      <button class="btn ghost" id="back">← 처음으로</button></div>`;
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; const v = $('#nm').value; draw(); $('#nm').value = v; });
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { diff = b.dataset.d; const v = $('#nm').value; draw(); $('#nm').value = v; });
    $('#back').onclick = renderTitle;
    $('#go').onclick = () => renderFirstChoice(mode, diff, $('#nm').value.trim());
  };
  draw();
}
const GOALS = {
  old: { ic: '🏚️', t: '구축 아파트 매수', d: '저렴한 지역부터 시작해 갈아타기', hint: '외곽 구축은 대출 한도 안에서 들어가기 쉽습니다. 실거주 2년을 채우고 상급지로 갈아타 보세요.' },
  gap: { ic: '🎯', t: '갭투자 도전', d: '시대별 규제와 전세금 반환 위험까지 관리', hint: '갭투자는 규제가 허용할 때만 가능합니다. 현실 모드에서는 금지돼 있으니 역사 모드에서 도전하세요. 전세 만기마다 보증금 차액을 조심하세요.' },
  ch: { ic: '🎟️', t: '청약·분양권', d: '당첨을 기다리거나 거래 가능한 분양권 매수', hint: '무주택 기간과 부양가족이 가점을 올립니다. 당첨되면 계약금 10%가 바로 필요하니 현금을 모아 두세요.' },
  re: { ic: '🏗️', t: '재개발·재건축', d: '정비사업 투자로 신축 아파트 입성', hint: '입주권은 권리 승계 요건 검증이 핵심입니다. 임장으로 검증하지 않으면 현금청산 위험이 있습니다. 분담금 증가에도 대비하세요.' },
};
function renderFirstChoice(mode, diff, name) {
  $('#app').innerHTML = `<div class="setup fade"><h2>당신의 첫 번째 선택은?</h2><p class="small">어떤 길로 가도 나중에 바꿀 수 있어요. 고른 길에 맞춘 조언과 작은 혜택이 따라옵니다.</p>
    <div class="goals">${Object.entries(GOALS).map(([k, g], i) => `<button class="goal" data-g="${k}"><span class="gn">0${i + 1}</span><span class="gi">${g.ic}</span><b>${g.t}</b><span>${g.d}</span></button>`).join('')}</div>
    <button class="btn ghost" id="back">← 이전</button></div>`;
  $('#back').onclick = renderSetup;
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
    newGame(mode, diff, name, b.dataset.g);
    if (b.dataset.g === 'old') S.imjang = 3;
    if (b.dataset.g === 're') S.freeVerify = 1;
    if (b.dataset.g === 'ch') S.chBonus = 2;
    TAB = 'home'; renderGame();
    modal(`<div class="evcat">튜토리얼</div><h3>${GOALS[b.dataset.g].ic} ${GOALS[b.dataset.g].t}</h3><p>${GOALS[b.dataset.g].hint}</p>
      <ul class="tut"><li>🗺️ <b>지도</b>에서 구를 눌러 실제 단지 매물을 보고, 살 수 있는지 자금 계산을 확인하세요.</li><li>💼 <b>내 자산</b>에서 집을 팔거나 전세로 옮기고, 대출을 갚을 수 있어요.</li><li>⏭️ 아래 <b>다음 반기</b>를 누르면 6개월이 흐르고 월급·이자·시세가 바뀝니다. 20년(40턴) 뒤 인생이 결산됩니다.</li></ul>
      <p class="small">현재 규제: ${rules().name} — ${rules().note}</p><button class="btn pri" data-close>시작하기</button>`);
  });
}

// ---------- 게임 화면 ----------
function hud() {
  const n = nw();
  return `<div class="hud"><div class="hrow"><b class="when">${when()}</b><span>${S.name} · ${ageOf()}세${S.married >= 0 ? ' · 기혼' : ''}${S.kids.length ? ' · 자녀 ' + S.kids.length : ''}</span><span class="tn">${S.t + 1}/${MAXT}턴</span></div>
    <div class="hstats"><div><small>현금</small><b class="${S.cash < 0 ? 'neg' : ''}">${won(S.cash)}</b></div><div><small>순자산</small><b>${won(n)}</b></div><div><small>부채</small><b>${won(debtTotal())}</b></div><div><small>행복</small><b>${S.happy}</b><i class="hb"><i style="width:${S.happy}%"></i></i></div></div>
    <div class="prog"><i style="width:${S.t / MAXT * 100}%"></i></div></div>`;
}
function renderGame() {
  if (S.ended) return renderEnding();
  $('#app').innerHTML = `${hud()}<div id="tab" class="fade"></div>
    <nav class="bnav"><button data-t="home" class="${TAB === 'home' ? 'on' : ''}">🏠<span>홈</span></button><button data-t="map" class="${TAB === 'map' ? 'on' : ''}">🗺️<span>지도</span></button><button data-t="assets" class="${TAB === 'assets' ? 'on' : ''}">💼<span>내 자산</span></button><button data-t="dex" class="${TAB === 'dex' ? 'on' : ''}">📖<span>도감</span></button>
    <button class="next" id="bNext">다음 반기 ⏭️</button></nav>`;
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { TAB = b.dataset.t; MAPGU = null; renderGame(); });
  $('#bNext').onclick = onNext;
  ({ home: tabHome, map: tabMap, assets: tabAssets, dex: tabDex })[TAB]();
}
function tabHome() {
  const R = rules(), f = S.lastFlow, g = GOALS[S.goal], live = liveHome();
  const resTxt = S.res.type === 'own' ? `🏡 자가 · ${aptName(live)}` : S.res.type === 'jeonse' ? `🔑 전세 · 보증금 ${won(S.res.dep)}${S.res.loan ? ` (전세대출 ${won(S.res.loan)})` : ''}` : `📦 월세 · 월 85만 원`;
  const ph = { up: ['상승장', '🔥', 'up'], flat: ['보합', '😐', 'flat'], down: ['하락장', '🧊', 'down'] }[S.phase];
  const gj = gajeom();
  $('#tab').innerHTML = `
    <div class="card mk"><div class="mrow"><div><small>시장 분위기</small><b class="ph ${ph[2]}">${ph[1]} ${ph[0]}</b></div><div><small>기준금리</small><b>${S.rate.toFixed(2)}%</b></div><div><small>주담대</small><b>${mRate().toFixed(2)}%</b></div><div><small>서울 지수</small><b>${Math.round(S.G * 100)}</b></div></div>
      ${spark(S.Gh.slice(-16), 300, 40)}
      <div class="rule"><b>📜 ${esc(R.name)}</b><br>${esc(R.note)}</div></div>
    <div class="card"><h4>🏠 지금 사는 곳</h4><p>${resTxt}</p>${S.res.type !== 'own' ? `<p class="small">무주택 ${homelessYears()}년차 · 청약 가점 ${gj.total}점</p>` : ''}
      <div class="flow">${f ? `<div><span>지난 반기 수입</span><b>+${won(f.inc)}</b></div><div><span>생활비</span><b>−${won(f.living)}</b></div><div><span>주거비</span><b>−${won(f.housing)}</b></div><div><span>대출 원리금</span><b>−${won(f.loanPay + f.credit)}</b></div>${f.tax ? `<div><span>보유세</span><b>−${won(f.tax)}</b></div>` : ''}<div class="tot"><span>반기 저축</span><b class="${f.net < 0 ? 'neg' : 'pos'}">${f.net >= 0 ? '+' : ''}${won(f.net)}</b></div>` : `<div><span>예상 반기 수입</span><b>+${won(income() / 2)}</b></div><div><span>생활비+월세</span><b>−${won(.171)}</b></div>`}</div></div>
    <div class="card"><h4>${g.ic} 나의 전략: ${g.t}</h4><p class="small">${g.hint}</p>${advice()}</div>
    <div class="card ads"><h4>🎁 광고 보고 받는 도움 <small>(한 판에 각 1회)</small></h4>
      <button class="btn adb" data-ad="report" ${S.adUsed.report ? 'disabled' : ''}>📊 부동산 전문가 분석 리포트 ${S.adUsed.report ? '✓' : ''}</button>
      <button class="btn adb" data-ad="chart" ${S.adUsed.chart ? 'disabled' : ''}>📈 과거 시세 복기 (모든 단지 시세 그래프) ${S.adUsed.chart ? '✓' : ''}</button>
      <button class="btn adb" data-ad="imjang" ${S.adUsed.imjang ? 'disabled' : ''}>🔍 추가 임장 기회 +2 ${S.adUsed.imjang ? '✓' : ''}</button>
      <p class="small">광고로 이미 확정된 손실이나 규제 위반을 없앨 수는 없어요.</p></div>
    <div class="card"><h4>📰 최근 소식</h4><ul class="log">${S.log.slice(0, 8).map(l => `<li><i>${when(l.t)}</i>${esc(l.s)}</li>`).join('')}</ul></div>`;
  document.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => adReward(b.dataset.ad));
}
function advice() {
  const tips = [];
  const cheapest = APTS.filter(a => a.kind === 'buy' && S.avail[a.id]).map(a => [a, buyQuote(a.id, 'live')]).sort((a, b) => a[1].p - b[1].p);
  const ok = cheapest.filter(x => x[1].ok);
  if (!S.props.length) {
    if (ok.length) tips.push(`✅ 지금 자금으로 <b>${ok.length}곳</b>을 실거주 매수할 수 있어요. 가장 비싼 곳: ${ok[ok.length - 1][0].n}`);
    else { const c = cheapest[0]; tips.push(`💡 가장 싼 ${c[0].n}도 현금 ${won(c[1].cashNeed - S.cash - c[1].resBack)}이 더 필요해요. 반기 저축으로 모으거나 청약을 노려 보세요.`); }
  }
  if (S.res.type === 'wolse' && !S.props.length && S.cash > 1.2) tips.push('💡 현금이 꽤 모였어요. 전세로 옮기면 월세가 사라집니다 (내 자산 → 거주지 바꾸기).');
  if (S.credit > 0) tips.push('⚠️ 고금리 신용대출이 있어요. 여유 현금으로 먼저 갚는 게 좋아요.');
  for (const p of S.props) if (p.kind === 'bun') tips.push(`📄 ${aptName(p)} 입주 ${p.mv}년 — 잔금 약 ${won(p.total * .9 - (p.prepaid || 0))}, 대출로 못 채우는 부분은 현금이 필요해요.`);
  for (const p of S.props) if (p.kind === 'ipj') tips.push(`🏗️ ${aptName(p)} — ${STAGES[Math.min(5, p.stage)]} 단계 · 준공 때 분담금 ${won(p.dues)}${p.verified ? '' : ' · ⚠️ 권리 미검증'}`);
  return tips.length ? `<ul class="tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul>` : '';
}

// ---------- 지도 ----------
function tabMap() {
  if (MAPGU) return mapList(MAPGU);
  const cnt = {}; for (const a of APTS) if (S.avail[a.id]) cnt[a.gu] = (cnt[a.gu] || 0) + 1;
  const okGu = {}; for (const a of APTS) if (S.avail[a.id] && a.kind === 'buy' && buyQuote(a.id, 'live').ok) okGu[a.gu] = 1;
  $('#tab').innerHTML = `<div class="card"><h4>🗺️ 서울 25개 구 <small>구를 눌러 매물 보기</small></h4>
    <div class="seoul">${GU.map(g => `<button class="gu t${g.t} ${okGu[g.id] ? 'ok' : ''} ${cnt[g.id] ? '' : 'none'}" style="grid-row:${g.r + 1};grid-column:${g.c + 1}" data-gu="${g.id}">${g.n}${cnt[g.id] ? `<i>${cnt[g.id]}</i>` : ''}</button>`).join('')}<div class="han"></div></div>
    <div class="legend"><span class="t1">1급지</span><span class="t2">2</span><span class="t3">3</span><span class="t4">4</span><span class="t5">5급지</span><span class="okl">초록 테두리 = 지금 살 수 있는 단지 있음</span></div></div>
    <div class="card"><div class="filt">${[['all', '전체'], ['buy', '매매'], ['bun', '분양권'], ['ipj', '입주권']].map(([k, l]) => `<button class="${FILTER === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}<label><input type="checkbox" id="okOnly" ${ONLYOK ? 'checked' : ''}> 살 수 있는 곳만</label></div>
    <div id="alist">${aptRows(APTS.filter(a => S.avail[a.id] && (FILTER === 'all' || a.kind === FILTER)).sort((a, b) => price(a.id) - price(b.id)))}</div></div>`;
  document.querySelectorAll('[data-gu]').forEach(b => b.onclick = () => { MAPGU = b.dataset.gu; tabMap(); });
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { FILTER = b.dataset.f; tabMap(); });
  $('#okOnly').onchange = e => { ONLYOK = e.target.checked; tabMap(); };
  bindRows();
}
function canAfford(a) { if (a.kind === 'buy') return buyQuote(a.id, 'live').ok || (rules().gap && buyQuote(a.id, 'gap').ok); if (a.kind === 'bun') return S.cash >= a.p * .1 + Math.max(0, price(a.id) - a.p) + price(a.id) * .005; return S.cash >= price(a.id) * .72 - ipjLoan(a.id); }
function aptRows(list) {
  if (ONLYOK) list = list.filter(canAfford);
  if (!list.length) return '<p class="small">조건에 맞는 매물이 없어요.</p>';
  return list.map(a => { const c = chg(a.id), mine = S.props.some(p => p.aid === a.id), ok = canAfford(a), deal = S.deal && S.deal.aid === a.id;
    return `<button class="apt ${ok ? 'ok' : ''}" data-a="${a.id}"><div class="an"><b>${a.n}</b>${mine ? '<span class="mine">보유</span>' : ''}${deal ? '<span class="deal">급매</span>' : ''}<small>${GUN[a.gu].n}구 · ${a.sz}${a.y ? ' · ' + a.y + '년' : ''} · ${{ buy: '매매', bun: '분양권', ipj: '입주권' }[a.kind]}</small><span class="tags">${tags(a.tr)}</span></div>
      <div class="ap"><b>${won(price(a.id) * (deal ? 1 - S.deal.disc : 1))}</b><small class="${c >= 0 ? 'up' : 'dn'}">${pct(c)} /1년</small>${S.chart ? spark(S.hist[a.id].slice(-20), 70, 22) : ''}</div></button>`; }).join('');
}
function bindRows() { document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => aptModal(b.dataset.a)); }
function mapList(gu) {
  const g = GUN[gu], list = APTS.filter(a => a.gu === gu && S.avail[a.id]);
  $('#tab').innerHTML = `<div class="card"><button class="btn ghost sm" id="mback">← 서울 지도</button><h4>${g.n}구 <small>${g.t}급지</small></h4>${aptRows(list)}
    ${list.length ? '' : '<p class="small">이 구에는 아직 등록된 단지가 없어요. 업데이트로 단지가 늘어날 예정입니다.</p>'}</div>`;
  $('#mback').onclick = () => { MAPGU = null; tabMap(); };
  bindRows();
}

// ---------- 단지 상세 · 매수 ----------
function imjangNote(a) {
  if (a.kind === 'ipj') return rules().transfer ? '현 규제에서는 조합원 지위 양도가 자유로워요. 권리 승계 문제 없음.' : '이 매물은 10년 보유·5년 거주 요건을 채운 매도인의 "양도 예외" 매물로 확인됐습니다. 권리 승계 가능.';
  if (a.kind === 'bun') return `잔금대출은 입주 시점 시세 기준으로 나옵니다. 지금 기준으로는 최대 ${won(loanLimit(price(a.id)).max)} 정도.`;
  const notes = [];
  if (a.y && a.y < 1995) notes.push('배관이 많이 낡아 누수 가능성이 높아요. 수리비를 따로 잡아 두세요.');
  if (a.tr.rb) notes.push('재건축 추진위 사무실에 들러 보니 사업 속도는 아직 초기입니다. 장기전 각오가 필요해요.');
  if (a.jr < .4) notes.push(`전세가율이 ${Math.round(a.jr * 100)}%로 낮아 전세 끼고 사기엔 현금이 많이 듭니다.`);
  if (a.tr.tr) notes.push('역까지 걸어 보니 정말 가깝습니다. 출퇴근 만족도가 높겠어요.');
  if (a.tr.sc) notes.push('학원가 셔틀이 단지 앞에 섭니다. 아이가 있다면 만족도가 높아요.');
  if (a.tr.bg) notes.push('대단지라 매물과 거래가 많아 팔 때 유리합니다.');
  return notes.join(' ') || '특별한 하자는 보이지 않습니다.';
}
function aptModal(aid) {
  const a = AP[aid], v = price(aid), R = rules(), seen = S.seen[aid];
  const head = `<div class="evcat">${GUN[a.gu].n}구 · ${{ buy: '매매', bun: '분양권', ipj: '입주권' }[a.kind]}</div><h3>${a.n}</h3><p class="small">${a.sz}${a.y ? ` · ${a.y}년 준공` : ''}${a.mv ? ` · ${a.mv}년 입주 예정` : ''}</p><span class="tags">${tags(a.tr)}</span>
    <div class="pbox"><div><small>게임 시세</small><b>${won(v)}</b></div>${a.kind === 'buy' ? `<div><small>전세 시세</small><b>${won(v * a.jr * S.J)}</b></div>` : a.kind === 'bun' ? `<div><small>분양가</small><b>${won(a.p)}</b></div>` : `<div><small>예상 분담금</small><b>${won(v * .3)}</b></div>`}<div><small>1년 변화</small><b class="${chg(aid) >= 0 ? 'up' : 'dn'}">${pct(chg(aid))}</b></div></div>
    ${S.chart ? `<div class="chart">${spark(S.hist[aid], 300, 60)}<small>${when(0)} → 지금</small></div>` : `<p class="small lock">📈 과거 시세 그래프는 홈 → 과거 시세 복기로 열 수 있어요.</p>`}
    <p class="tip">${a.tip}</p>
    <div class="imj">${seen ? `<b>🔍 임장 메모</b><br>${imjangNote(a)}` : `<button class="btn sm" id="bImj" ${S.imjang ? '' : 'disabled'}>🔍 임장 가기 (남은 기회 ${S.imjang})</button>`}</div>`;
  let body = '';
  if (a.kind === 'buy') {
    const q = buyQuote(aid, 'live'), qg = buyQuote(aid, 'gap');
    const owned = S.props.some(p => p.aid === aid);
    body = `<div class="quote"><h5>🏡 실거주 매수 자금 계산</h5>${quoteTable(q)}
      ${q.lim.max > 0 ? `<label class="small">대출 사용액 <b id="lv">${won(q.lim.max)}</b></label><input type="range" id="loanR" min="0" max="${q.lim.max}" step="0.05" value="${q.lim.max}">` : ''}
      <button class="btn pri" id="bLive" ${q.ok ? '' : 'disabled'}>${q.ok ? '실거주로 매수하고 입주' : `자금 부족 · ${won(q.cashNeed - S.cash - q.resBack)} 더 필요`}</button></div>
      ${R.gap ? `<div class="quote"><h5>🎯 전세 끼고 매수 (갭투자)</h5>${quoteTable(qg)}<button class="btn" id="bGap" ${qg.ok ? '' : 'disabled'}>${qg.ok ? '전세 끼고 매수' : `자금 부족 · ${won(qg.cashNeed - S.cash)} 더 필요`}</button><p class="small">2년마다 전세 재계약. 전세가가 떨어지면 차액을 돌려줘야 해요.</p></div>` : `<p class="small warn">🚫 현재 규제(${R.name})에서는 전세 낀 매수가 금지돼 있어요. 사면 2년 실거주해야 합니다.</p>`}
      ${owned ? '<p class="small">이미 보유 중인 단지예요.</p>' : ''}`;
  } else if (a.kind === 'bun') {
    const prem = Math.max(0, v - a.p), cost = a.p * .1 + prem + v * .005;
    body = `<div class="quote"><h5>📄 분양권 매수 (전매)</h5><table class="qt"><tr><td>계약금 (분양가 10%)</td><td>${won(a.p * .1)}</td></tr><tr><td>프리미엄</td><td>${won(prem)}</td></tr><tr><td>중개보수 등</td><td>${won(v * .005)}</td></tr><tr class="tot"><td>지금 필요한 현금</td><td>${won(cost)}</td></tr><tr><td>중도금 (60%)</td><td>집단대출 승계</td></tr><tr><td>잔금 (${a.mv}년)</td><td>${won(a.p * .3)} + 중도금 상환</td></tr></table>
      <button class="btn pri" id="bBun" ${S.cash >= cost ? '' : 'disabled'}>${S.cash >= cost ? '분양권 매수' : `현금 ${won(cost - S.cash)} 부족`}</button><p class="small">이 단지는 10·15 대책 이전 계약분이라 전매가 가능한 분양권입니다. 입주 때 잔금을 못 내면 급매로 넘기거나 계약금을 잃을 수 있어요.</p></div>`;
  } else {
    const cost = v * .72, verifyNeeded = !R.transfer, il = ipjLoan(aid), cn = r2(cost - il);
    body = `<div class="quote"><h5>📜 조합원 입주권 매수</h5><table class="qt"><tr><td>권리가액 + 프리미엄</td><td>${won(cost)}</td></tr><tr><td>이주비 대출 승계 <small>무주택자만</small></td><td>−${won(il)}</td></tr><tr class="tot"><td>지금 필요한 현금</td><td>${won(cn)}</td></tr><tr><td>준공 때 분담금 (예상)</td><td>${won(v * .3)}</td></tr><tr><td>현재 단계</td><td>${STAGES[a.stage]}</td></tr></table>
      ${verifyNeeded ? `<p class="small warn">⚠️ 현 규제에서는 조합원 지위 양도가 원칙적으로 막혀 있어요. 양도 예외 요건을 검증하지 않고 사면 나중에 <b>현금청산</b>될 수 있어요.</p>
        <button class="btn pri" id="bIpjV" ${S.cash >= cn + .03 || (seen && S.cash >= cn) ? '' : 'disabled'}>${seen ? '임장으로 검증 완료 · 매수' : '법무 검토(300만 원) 후 매수'}</button>
        <button class="btn" id="bIpj" ${S.cash >= cn ? '' : 'disabled'}>검증 없이 바로 매수 (위험)</button>` : `<button class="btn pri" id="bIpj" ${S.cash >= cn ? '' : 'disabled'}>입주권 매수</button>`}
      ${S.cash < cn ? `<p class="small">현금 ${won(cn - S.cash)} 부족</p>` : ''}</div>`;
  }
  modal(head + body + '<button class="btn ghost" data-close>닫기</button>', 'wide');
  if ($('#bImj')) $('#bImj').onclick = () => { S.imjang--; S.seen[aid] = 1; save(); aptModal(aid); };
  if ($('#loanR')) $('#loanR').oninput = e => { $('#lv').textContent = won(+e.target.value); };
  if ($('#bLive')) $('#bLive').onclick = () => { const lu = $('#loanR') ? +$('#loanR').value : 0; if (doBuy(aid, 'live', lu)) { closeModal(); save(); toast(`🎉 ${a.n} 매수! 이삿짐을 옮겼습니다.`); celebrate(); renderGame(); } };
  if ($('#bGap')) $('#bGap').onclick = () => { if (doBuy(aid, 'gap')) { closeModal(); save(); toast(`🎯 ${a.n} 전세 끼고 매수 완료`); renderGame(); } };
  if ($('#bBun')) $('#bBun').onclick = () => { if (buyBun(aid)) { closeModal(); save(); toast('📄 분양권을 샀습니다'); renderGame(); } };
  if ($('#bIpjV')) $('#bIpjV').onclick = () => { if (buyIpj(aid, seen ? 'imjang' : 'paid')) { closeModal(); save(); toast('📜 입주권 매수 (권리 검증 완료)'); renderGame(); } };
  if ($('#bIpj')) $('#bIpj').onclick = () => { if (buyIpj(aid, R.transfer ? 'free' : null)) { closeModal(); save(); toast('📜 입주권 매수'); renderGame(); } };
}
function quoteTable(q) {
  return `<table class="qt"><tr><td>매매가</td><td>${won(q.p)}</td></tr><tr><td>취득세</td><td>${won(q.tax)}</td></tr><tr><td>중개보수</td><td>${won(q.fee)}</td></tr>
    ${q.dep ? `<tr><td>전세보증금 (세입자)</td><td>−${won(q.dep)}</td></tr>` : `<tr><td>대출 가능액 <small>${q.lim.why}</small></td><td>−${won(q.lim.max)}</td></tr>`}
    ${q.resBack ? `<tr><td>지금 집 보증금 회수</td><td>+${won(q.resBack)}</td></tr>` : ''}
    <tr class="tot"><td>필요한 내 현금</td><td>${won(q.cashNeed)}</td></tr><tr><td>보유 현금</td><td>${won(S.cash)}</td></tr></table>`;
}
function celebrate() { const c = document.createElement('div'); c.className = 'confetti'; for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = pick(['#ffc94d', '#e5484d', '#3b82f6', '#22c55e', '#a855f7']); s.style.animationDelay = Math.random() * .5 + 's'; c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 2200); }

// ---------- 내 자산 ----------
function tabAssets() {
  const R = rules();
  const props = S.props.map(p => {
    const v = propValue(p), gain = p.kind === 'buy' ? v - p.buyP : 0;
    let info = '', acts = '';
    if (p.kind === 'buy') {
      info = `매수 ${won(p.buyP)} → 시세 <b>${won(v)}</b> <span class="${gain >= 0 ? 'up' : 'dn'}">(${gain >= 0 ? '+' : ''}${won(gain)})</span><br>대출 ${won(p.loan)}${p.tenant ? ` · 세입자 보증금 ${won(p.tenant.dep)} (만기 ${when(p.tenant.until)})` : ''} · ${p.live ? '🏡 실거주' : '🔑 임대 중'}`;
      const liveOk = !R.live || S.t - (p.liveFrom ?? p.buyT) >= 4;
      acts = `<button class="btn sm" data-sell="${p.uid}">매도</button>${p.loan > 0 ? `<button class="btn sm" data-repay="${p.uid}" ${S.cash > .05 ? '' : 'disabled'}>대출 상환</button>` : ''}
        ${p.live && !S.props.some(x => x !== p && x.live) ? `<button class="btn sm" data-rent="${p.uid}" ${liveOk ? '' : 'disabled'}>${liveOk ? '전세 놓고 이사' : '실거주 2년 전'}</button>` : ''}
        ${!p.live && !S.props.some(x => x.live) ? `<button class="btn sm" data-movein="${p.uid}">세입자 내보내고 입주</button>` : ''}`;
    } else if (p.kind === 'bun') {
      info = `분양가 ${won(p.total)} · 분양권 시세 <b>${won(v)}</b><br>입주 ${p.mv}년 · 잔금 약 ${won(p.total * .9 - (p.prepaid || 0))}`;
      const can = p.resaleOk || R.bunResale;
      acts = `<button class="btn sm" data-sell="${p.uid}" ${can ? '' : 'disabled'}>${can ? '분양권 매도' : '전매제한 중'}</button>`;
    } else {
      info = `${STAGES[Math.min(5, p.stage)]} 단계 · 낸 돈 ${won(p.paid)} · 준공 때 분담금 ${won(p.dues)}${p.verified ? ' · ✅ 권리 검증' : ' · ⚠️ 권리 미검증'}${p.slow ? ' · 🐢 지연 중' : ''}`;
      acts = `<button class="btn sm" data-sell="${p.uid}" ${R.transfer ? '' : 'disabled'}>${R.transfer ? '입주권 매도' : '양도 제한 중'}</button>`;
    }
    return `<div class="prop"><b>${{ buy: '🏢', bun: '📄', ipj: '📜' }[p.kind]} ${esc(aptName(p))}</b><p class="small">${info}</p><div class="acts">${acts}</div></div>`;
  }).join('');
  const gj = gajeom();
  $('#tab').innerHTML = `<div class="card"><h4>💼 내 자산</h4><div class="hstats sm"><div><small>현금</small><b>${won(S.cash)}</b></div><div><small>부동산 순자산</small><b>${won(reNW())}</b></div><div><small>총부채</small><b>${won(debtTotal())}</b></div><div><small>DSR</small><b>${Math.round(annualDebtService(0, 0) / income() * 100)}%</b></div></div>
    ${props || '<p class="small">아직 가진 집이 없어요. 지도에서 매물을 찾아보세요.</p>'}</div>
    <div class="card"><h4>🏠 거주지</h4><p>${S.res.type === 'own' ? '자가 거주 중' : S.res.type === 'jeonse' ? `전세 · 보증금 ${won(S.res.dep)} · 전세대출 ${won(S.res.loan)}` : '월세 (보증금 1,000만 · 월 85만)'}</p>
      ${S.res.type !== 'own' ? `<div class="acts">${[['wolse', '월세', 0], ['jeonse', '소형 전세', 2.5], ['jeonse', '중형 전세', 4], ['jeonse', '대형 전세', 6]].map(([t, l, d]) => `<button class="btn sm" data-res="${t}:${d}" ${S.res.type === t && S.res.dep === d ? 'disabled' : ''}>${l}${d ? ` ${d}억` : ''}</button>`).join('')}</div><p class="small">전세대출은 보증금의 80%까지(금리 ${(S.rate + 1.3).toFixed(1)}%), 월세보다 주거비가 싸지만 목돈이 묶여요.</p>` : ''}</div>
    <div class="card"><h4>🎟️ 청약 가점 <small>${isHomeless() ? '무주택' : '유주택 (청약 불가)'}</small></h4><div class="gj"><div><small>무주택 기간</small><b>${gj.h}/32</b></div><div><small>부양가족</small><b>${gj.fam}/35</b></div><div><small>통장 가입</small><b>${gj.acc}/17</b></div><div><small>합계</small><b>${gj.total}/84</b></div></div>${gj.bonus ? `<p class="small">🎟️ 청약 전략 보너스 +${gj.bonus}점 (청약 정보를 꼼꼼히 챙긴 덕분)</p>` : ''}</div>
    ${S.credit > 0 ? `<div class="card"><h4>🏦 신용대출 ${won(S.credit)}</h4><button class="btn sm" id="bCr" ${S.cash > .05 ? '' : 'disabled'}>여유 현금으로 갚기</button></div>` : ''}`;
  document.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => sellModal(+b.dataset.sell));
  document.querySelectorAll('[data-repay]').forEach(b => b.onclick = () => { const p = S.props.find(x => x.uid === +b.dataset.repay); const amt = r2(Math.min(p.loan, S.cash)); p.loan = r2(p.loan - amt); S.cash = r2(S.cash - amt); log(`💳 ${aptName(p)} 대출 ${won(amt)} 상환`); save(); renderGame(); });
  document.querySelectorAll('[data-rent]').forEach(b => b.onclick = () => { const p = S.props.find(x => x.uid === +b.dataset.rent); const dep = r2(propValue(p) * AP[p.aid].jr * S.J); p.live = false; p.tenant = { dep, until: S.t + 4, J0: S.J }; S.cash = r2(S.cash + dep); S.res = { type: 'wolse', dep: 0, loan: 0 }; log(`🔑 ${aptName(p)} 전세 ${won(dep)}에 놓고 월세로 이사`); save(); renderGame(); });
  document.querySelectorAll('[data-movein]').forEach(b => b.onclick = () => { const p = S.props.find(x => x.uid === +b.dataset.movein); if (S.cash + (S.res.dep - S.res.loan) < p.tenant.dep) return toast(`보증금 ${won(p.tenant.dep)}을 돌려줄 현금이 부족해요.`); S.cash = r2(S.cash - p.tenant.dep); moveIntoOwned(p); log(`🏡 ${aptName(p)} 세입자를 내보내고 입주`); save(); renderGame(); });
  document.querySelectorAll('[data-res]').forEach(b => b.onclick = () => changeRes(...b.dataset.res.split(':')));
  if ($('#bCr')) $('#bCr').onclick = () => { const amt = r2(Math.min(S.credit, S.cash)); S.credit = r2(S.credit - amt); S.cash = r2(S.cash - amt); save(); renderGame(); };
}
function changeRes(type, dep) {
  dep = +dep;
  const back = r2(S.res.dep - S.res.loan);
  if (type === 'wolse') { S.cash = r2(S.cash + back - .1); S.res = { type: 'wolse', dep: .1, loan: 0 }; log('📦 월세로 이사'); save(); return renderGame(); }
  const maxLoan = r2(Math.min(dep * .8, S.props.length ? 2 : dep * .8));
  const need = r2(dep - maxLoan + .02);
  if (S.cash + back < need) return toast(`현금 ${won(need - S.cash - back)}이 더 필요해요.`);
  modal(`<h3>🔑 전세 ${dep}억 집으로 이사</h3><table class="qt"><tr><td>보증금</td><td>${won(dep)}</td></tr><tr><td>전세대출 (80%)</td><td>−${won(maxLoan)}</td></tr><tr><td>이사비</td><td>${won(.02)}</td></tr><tr><td>지금 집 보증금 회수</td><td>+${won(back)}</td></tr><tr class="tot"><td>필요한 현금</td><td>${won(need - back)}</td></tr></table>
    <p class="small">전세대출 이자 연 ${(S.rate + 1.3).toFixed(1)}%. 월세 85만 원이 사라집니다.</p><button class="btn pri" id="ok">이사하기</button><button class="btn ghost" data-close>취소</button>`);
  $('#ok').onclick = () => { S.cash = r2(S.cash + back - need); S.res = { type: 'jeonse', dep, loan: maxLoan }; log(`🔑 전세 ${dep}억 집으로 이사`); closeModal(); save(); renderGame(); };
}
function sellModal(uid) {
  const p = S.props.find(x => x.uid === uid), v = propValue(p);
  const snapshot = JSON.stringify(S); const got = sellProp(p); const after = JSON.parse(JSON.stringify(S)); S = JSON.parse(snapshot); void after;
  modal(`<h3>🤝 ${esc(aptName(p))} 매도</h3><p>시세 ${won(v)}에 내놓으면 대출·보증금·세금·수수료를 정리하고 <b>${won(got)}</b>이 손에 들어옵니다.</p>
    ${S.phase === 'down' ? '<p class="small warn">🧊 하락장입니다. 공포에 팔고 나면 반등할 때 후회할 수도 있어요.</p>' : ''}
    ${p.live ? '<p class="small">실거주 집을 팔면 월세로 옮깁니다. 2반기 안에 더 좋은 집을 사면 갈아타기로 기록돼요.</p>' : ''}
    <button class="btn pri" id="ok">팔기</button><button class="btn ghost" data-close>취소</button>`);
  $('#ok').onclick = () => { const q = S.props.find(x => x.uid === uid); sellProp(q); closeModal(); save(); toast('매도 완료'); renderGame(); };
}

// ---------- 도감 ----------
function tabDex() { renderDexInner($('#tab'), false); }
function renderDexPage(back) { $('#app').innerHTML = `<div class="setup fade"><button class="btn ghost sm" id="bk">← 돌아가기</button><div id="dx"></div></div>`; $('#bk').onclick = back; renderDexInner($('#dx'), true); }
function renderDexInner(el) {
  const d = store.get('_dex', {});
  const parts = ['', '🏆 부동산 성공', '🌱 특별한 인생', '♟️ 투자 전략·역전', '💥 실패·위기'];
  let h = `<div class="card"><h4>🎬 엔딩 도감 ${Object.keys(d).length}/40</h4><p class="small">달성하면 이야기가 열립니다. 엔딩을 눌러 보세요.</p>`;
  for (let pt = 1; pt <= 4; pt++) {
    h += `<h5 class="pt">${parts[pt]}</h5><div class="dex">`;
    for (const [k, e] of Object.entries(ENDS).filter(([, e]) => e.p === pt)) h += `<button class="de ${d[k] ? 'got' : ''}" data-e="${k}"><span>${d[k] ? e.ic : '❔'}</span><b>${k.slice(1).padStart(2, '0')}</b><small>${d[k] ? e.t : '???'}</small></button>`;
    h += '</div>';
  }
  h += `</div><div class="card"><h4>🏢 아파트 도감</h4><div class="adex">${APTS.map(a => `<div class="${S && S.seen && S.seen[a.id] ? 'got' : ''}"><b>${a.n}</b><small>${GUN[a.gu].n}구 · ${a.y ? a.y + '년' : a.mv ? a.mv + '년 입주' : ''}</small></div>`).join('')}</div><p class="small">임장하거나 매수한 단지가 표시됩니다.</p></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const k = b.dataset.e, e = ENDS[k]; modal(d[k] ? `<div class="evcat">엔딩 ${k.slice(1)}</div><h3>${e.ic} ${e.t}</h3><p>${e.s}</p><p class="small">조건: ${e.d}<br>달성: ${d[k].name} · ${d[k].mode === 'hist' ? '역사' : '현실'} 모드 · 순자산 ${won(d[k].nw)}</p><button class="btn" data-close>닫기</button>` : `<h3>❔ 엔딩 ${k.slice(1)}</h3><p class="small">힌트: ${e.d}</p><button class="btn" data-close>닫기</button>`); });
}

// ---------- 진행 ----------
function onNext() {
  if (S.res.type !== 'own' && !S.props.some(p => p.live) && S.t === 0 && !S.warned0) { S.warned0 = 1; }
  const r = nextTurn();
  if (r.end) { save(); return renderEnding(); }
  const go = () => { if (r.ev) showEvent(r.ev); else renderGame(); };
  const after = () => { if (S.interAd) { S.interAd = false; showAd(go, true, 'turn_break'); } else go(); };
  renderGame();
  modal(`<div class="evcat">${when()} 결산</div><h3>📅 6개월이 지났습니다</h3><ul class="rep">${r.msgs.map(m => `<li>${esc(m)}</li>`).join('')}${S.lastFlow ? `<li>💰 반기 저축 ${S.lastFlow.net >= 0 ? '+' : ''}${won(S.lastFlow.net)} → 현금 ${won(S.cash)}</li>` : ''}</ul><button class="btn pri" id="ok">확인</button>`);
  $('#ok').onclick = () => { closeModal(); after(); };
}
function showEvent(e) {
  const E = e.run();
  modal(`<div class="evcat">이벤트 · ${E.cat}</div><h3>${esc(E.t)}</h3><p>${esc(E.d)}</p><div class="chs">${E.ch.map((c, i) => { const ok = !c.ok || c.ok(); return `<button class="ch" data-i="${i}" ${ok ? '' : 'disabled'}><b>${esc(c.l)}</b>${c.s ? `<small>${esc(c.s)}</small>` : ''}</button>`; }).join('')}</div>`, 'ev');
  document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const res = E.ch[+b.dataset.i].f(); log(`${E.t}: ${res}`);
    const c2 = crisis(); for (const m of c2) log(m);
    save();
    modal(`<h3>${esc(E.t)}</h3><p>${esc(res)}</p>${c2.map(m => `<p class="small">${esc(m)}</p>`).join('')}<button class="btn pri" id="ok">계속</button>`);
    $('#ok').onclick = () => { closeModal(); if (S.ended) return renderEnding(); if (S.goTab) { TAB = S.goTab; S.goTab = null; } if (S.goApt) { const id = S.goApt; S.goApt = null; TAB = 'map'; renderGame(); return aptModal(id); } renderGame(); };
  });
}

// ---------- 광고 보상 ----------
const ADS = { client: null };
let adOn = false, lastInter = 0;
function adReward(kind) {
  if (S.adUsed[kind]) return;
  showAd(() => {
    S.adUsed[kind] = 1;
    if (kind === 'report') { rollFuture(); const f = S.future.slice(0, 2); const nm = { up: '상승 🔥', flat: '보합 😐', down: '하락 🧊' };
      modal(`<div class="evcat">부동산 전문가 분석 리포트</div><h3>📊 앞으로 1년 전망</h3><ul class="rep"><li>${when(S.t)}: <b>${nm[f[0].ph]}</b></li><li>${when(S.t + 1)}: <b>${nm[f[1].ph]}</b></li></ul><p class="small">${f.some(x => x.ph === 'down') ? '조정이 예상됩니다. 무리한 대출은 피하고 현금을 확보하세요.' : f.every(x => x.ph === 'up') ? '상승 흐름이 이어질 전망입니다. 다만 고점 추격 매수의 위험도 함께 커집니다.' : '방향성이 약한 장입니다. 급매를 노려 볼 만합니다.'}</p><p class="small">게임 속 가상 시나리오 전망입니다.</p><button class="btn" data-close>닫기</button>`); }
    if (kind === 'chart') { S.chart = true; toast('📈 모든 단지의 과거 시세 그래프가 열렸습니다'); }
    if (kind === 'imjang') { S.imjang += 2; toast('🔍 임장 기회 +2'); }
    save(); if (kind !== 'report') renderGame();
  }, false, 'reward_' + kind);
}
function stat(ev, k) { try { const body = JSON.stringify({ g: 'seoul', ev, k: k || '' }); if (navigator.sendBeacon) navigator.sendBeacon('/api/stat', new Blob([body], { type: 'application/json' })); } catch (e) { } }
fetch('/api/config', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(c => { const a = c && c.ads; if (!a || !a.h5 || !a.client) return;
  ADS.client = a.client; const sc = document.createElement('script'); sc.async = true; sc.crossOrigin = 'anonymous'; sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + a.client; sc.setAttribute('data-ad-frequency-hint', '30s'); if (a.test) sc.setAttribute('data-adbreak-test', 'on'); document.head.appendChild(sc);
  window.adsbygoogle = window.adsbygoogle || []; window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); }; adConfig({ preloadAdBreaks: 'on', sound: 'on' }); }).catch(() => { });
function showAd(cb, inter, tag) {
  const real = ADS.client && window.adBreak;
  if (inter) { if (!real || Date.now() - lastInter < 180000) return cb(); lastInter = Date.now(); let done = false; const fin = () => { if (done) return; done = true; adOn = false; cb(); }; setTimeout(fin, 12000); adBreak({ type: 'next', name: tag, beforeAd: () => { adOn = true; }, afterAd: () => { adOn = false; }, adBreakDone: fin }); return; }
  stat('reward_click', tag);
  if (real) { let g = false; adBreak({ type: 'reward', name: tag, beforeReward: s => s(), beforeAd: () => { adOn = true; }, afterAd: () => { adOn = false; }, adViewed: () => { g = true; }, adDismissed: () => toast('광고를 끝까지 보면 혜택을 받을 수 있어요.'), adBreakDone: i => { adOn = false; if (g) { stat('reward_done', tag); cb(); } else if (!i || !['dismissed', 'viewed'].includes(i.breakStatus)) toast('지금은 볼 수 있는 광고가 없어요. 잠시 후 다시 시도해 주세요.'); } }); return; }
  modal(`<div style="text-align:center"><div style="font-size:34px">🎁</div><b>광고 준비 중</b><p class="small">광고가 연결되기 전이라 지금은 무료로 받을 수 있어요.</p></div><button class="btn pri" id="adDone">받기</button><button class="btn ghost" data-close>닫기</button>`);
  $('#adDone').onclick = () => { closeModal(); stat('reward_free', tag); cb(); };
}

// ---------- 엔딩 ----------
function renderEnding() {
  const k = S.ended, e = ENDS[k]; unlockEnding(k); stat('ending', k);
  const d = store.get('_dex', {});
  const homes = S.props.filter(p => p.kind === 'buy');
  $('#app').innerHTML = `<div class="ending fade p${e.p}"><div class="ekick">${['', 'SUCCESS', 'LIFE', 'STRATEGY', 'CRISIS'][e.p]} · 엔딩 ${k.slice(1)}/40</div><div class="eic">${e.ic}</div><h2>${e.t}</h2><p class="story">${e.s}</p>
    <div class="card"><h4>📋 ${esc(S.name)}의 부동산 인생 결산</h4><table class="qt"><tr><td>기간</td><td>${S.startYear}년 → ${yearOf(Math.min(S.t, MAXT - 1))}년 (${Math.ceil(S.t / 2)}년)</td></tr><tr><td>나이</td><td>${ageOf(Math.min(S.t, MAXT - 1))}세</td></tr><tr><td>최종 순자산</td><td><b>${won(nw())}</b></td></tr><tr><td>보유 주택</td><td>${homes.map(p => esc(aptName(p))).join(', ') || '없음'}</td></tr><tr><td>총부채</td><td>${won(debtTotal())}</td></tr><tr><td>행복도</td><td>${S.happy}</td></tr><tr><td>갈아타기 / 청약 당첨</td><td>${S.st.flips}회 / ${S.st.chWin}회</td></tr></table></div>
    <p class="small">엔딩 도감 ${Object.keys(d).length}/40 수집</p>
    <button class="btn pri big" id="again">🔁 인생 다시 살기</button><button class="btn" id="dex">📖 엔딩 도감</button><button class="btn ghost" id="share">📤 결과 공유</button><a class="other" href="/">← aptgame.kr 다른 게임</a></div>`;
  $('#again').onclick = () => { store.set('_save', null); renderSetup(); };
  $('#dex').onclick = () => renderDexPage(renderEnding);
  $('#share').onclick = () => { const t = `나의 첫 번째 서울 아파트 구하기 — 엔딩 ${k.slice(1)} "${e.t}" (순자산 ${won(nw())}) https://aptgame.kr/seoul/`; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else { navigator.clipboard && navigator.clipboard.writeText(t); toast('결과 문구를 복사했어요'); } };
  if (e.p !== 4) celebrate();
}
