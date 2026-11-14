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
  const cont = sv && !sv.ended;
  $('#app').innerHTML = `<div class="title2 fade">
    <h1 class="sr">나의 첫 번째 서울 아파트 구하기 — 월급쟁이로 시작해 서울에 내 집 한 채, 40가지 인생</h1>
    <img class="tt" src="img/title_top.webp" alt="나의 첫 번째 서울 아파트 구하기. 서울 25개 구, 실존 단지 30곳, 4가지 전략, 엔딩 40종">
    <div class="tmid">
      ${cont ? `<button class="tbtn gold" id="bCont"><span>▶ 이어하기</span><small>${esc(sv.name)} · ${sv.startYear + Math.floor(sv.t / 2)}년 ${sv.t % 2 ? '하반기' : '상반기'} (CH ${Math.min(10, Math.floor(sv.t / 4) + 1)}/10)</small></button>` : ''}
      <button class="tbtn ${cont ? 'sub2' : 'gold'}" id="bNew"><span>🏠 ${cont ? '새 인생 시작' : '지금, 나만의 서울 아파트 인생을 시작하세요!'} ▶</span></button>
      <button class="tbtn glass" id="bDex"><span>📖 엔딩 도감 (${Object.keys(dex).filter(k => ENDS[k]).length}/40) ›</span></button>
    </div>
    <img class="tb" src="img/title_bot.webp" alt="갭투자, 분양권, 입주권, 구축 투자 — 실제 아파트 기반 시뮬레이션, 현실적인 이벤트와 위기, 총 40가지 엔딩">
    <div class="tfoot"><p>게임 속 시세·수익률은 실제 공개 자료를 참고한 <b>게임용 시뮬레이션 수치</b>이며 미래 시세 예측이나 투자 권유가 아닙니다. 단지 이름은 실제 장소, 그 외 인물·사건은 가상입니다.</p><a href="/">← aptgame.kr 다른 부동산 게임</a></div>
  </div>`;
  if ($('#bCont')) $('#bCont').onclick = () => { S = sv; migrate(); renderGame(); };
  $('#bNew').onclick = () => { renderSetup(); };
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
  let mode = 'hist', diff = 'd5';
  const DIC = { d3: '🪙', d5: '💵', d10: '💴', d30: '💰' };
  const draw = () => {
    const nm = $('#nm') ? $('#nm').value : '';
    $('#app').innerHTML = `<div class="setup2 fade">
      <img class="st" src="img/setup_top.webp" alt="2026년, 서울에 첫 집을 얻었습니다!">
      <div class="scard">
        <div class="shead"><span class="hi">🏠</span><div>당신의 프로필을 설정하고<br><b><mark>서울 아파트 인생</mark>을 시작하세요!</b></div></div>
        <div class="prof"><div class="pav">🧑‍💼</div><div><b>29세 · 무주택 · 서울 거주</b><small>💼 연봉 4,800만 원 · 📦 월세 85만 원 · ❤️ 체력 90 · 🎟️ 청약통장 5년</small></div></div>
        <label class="lbl">이름</label>
        <div class="inp"><span>👤</span><input id="nm" maxlength="8" placeholder="닉네임을 입력하세요 (예: 건축학도고니)" value="${esc(nm)}"></div>
        <label class="lbl">시작 모드</label>
        <button class="mopt ${mode === 'real' ? 'on' : ''}" data-m="real"><span class="mi">🏢</span><span class="mt"><b>2026 현실 모드</b><small>지금의 10·15 대책 규제 속에서 시작하는 하드코어 모드 (LTV 40%·갭투자 금지)</small></span>${mode === 'real' ? '<i class="ck">✓</i>' : ''}</button>
        <button class="mopt ${mode === 'hist' ? 'on' : ''}" data-m="hist"><span class="mi">🏆</span><span class="mt"><b>2015 인생 모드 <em>추천</em></b><small>2015년 29세로 시작해 2034년까지. 상승장·팬데믹·금리 인상·가상 금융위기를 차례로 겪어요</small></span>${mode === 'hist' ? '<i class="ck">✓</i>' : ''}</button>
        <label class="lbl">시작 자금 (보유 현금)</label>
        <div class="dgrid">${Object.entries(DIFFS).map(([k, d]) => `<button class="dopt ${diff === k ? 'on' : ''}" data-d="${k}"><b>${DIC[k]} ${d.n}</b><small>(${d.d.replace('현금 ', '')})</small>${diff === k ? '<i class="ck">✓</i>' : ''}</button>`).join('')}</div>
        <button class="gobtn" id="go">▶ 다음: 첫 번째 선택 →</button>
        <button class="backbtn" id="back">← 이전으로</button>
      </div>
      <img class="sb" src="img/setup_bot.webp" alt="실제 서울 시세 반영 · 실존 단지·지역 선택 · 다양한 투자 시나리오 · 총 40가지 엔딩">
    </div>`;
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { diff = b.dataset.d; draw(); });
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
      <ul class="tut"><li>💼 매 반기 <b>어떻게 벌지</b> 고르세요. 투잡·쓰리잡은 돈을 빨리 모으지만 체력이 깎이고, 본업에 집중하면 승진 확률이 올라요.</li><li>🏠 <b>노려볼 아파트 3곳</b>을 눌러 얼마가 부족한지 확인하세요. 돈이 모이면 바로 매수!</li><li>📈 주식으로 불릴 수도 있지만 금융위기에는 반토막 날 수 있어요.</li><li>⏭️ <b>다음 반기</b>를 누르면 6개월이 흐릅니다. 10개 챕터(20년) 뒤 40가지 엔딩 중 하나가 나와요.</li></ul>
      <p class="small">현재 규제: ${rules().name} — ${rules().note}</p><button class="btn pri" data-close>시작하기</button>`);
  });
}

// ---------- 게임 화면 ----------
function bar(v, cls) { return `<i class="hb ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></i>`; }
function hud() {
  const n = nw(), hpc = S.hp < 25 ? 'bad' : S.hp < 50 ? 'mid' : '';
  return `<div class="hud"><div class="hrow"><b class="when">${when()}</b><span>${esc(S.name)} · ${ageOf()}세${S.biz ? ' · 사장님' : ''}${S.married >= 0 ? ' · 기혼' : ''}${S.kids.length ? ' · 자녀 ' + S.kids.length : ''}</span><span class="tn">CH ${chapterOf() + 1}/10</span></div>
    <div class="hstats"><div><small>현금</small><b class="${S.cash < 0 ? 'neg' : ''}">${wonS(S.cash)}</b></div><div><small>순자산</small><b>${wonS(n)}</b></div><div><small>${term('체력')}</small><b class="${hpc ? 'neg' : ''}">${S.hp}</b>${bar(S.hp, 'hp ' + hpc)}</div><div><small>행복</small><b>${S.happy}</b>${bar(S.happy)}</div></div>
    <div class="prog"><i style="width:${S.t / MAXT * 100}%"></i></div></div>`;
}
function renderGame() {
  if (S.ended) return renderEnding();
  migrate();
  $('#app').innerHTML = `${hud()}<div id="tab" class="fade"></div>
    <nav class="bnav"><button data-t="home" class="${TAB === 'home' ? 'on' : ''}">🏠<span>이번 반기</span></button><button data-t="map" class="${TAB === 'map' ? 'on' : ''}">🗺️<span>서울 지도</span></button><button data-t="assets" class="${TAB === 'assets' ? 'on' : ''}">💼<span>자산</span></button><button data-t="dex" class="${TAB === 'dex' ? 'on' : ''}">📖<span>기록</span></button>
    <button class="next" id="bNext">다음 반기 ⏭️</button></nav>`;
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { TAB = b.dataset.t; MAPGU = null; renderGame(); });
  $('#bNext').onclick = onNext;
  ({ home: tabHome, map: tabMap, assets: tabAssets, dex: tabDex })[TAB]();
}
function storyHead() {
  const c = chapterOf(), own = S.props.some(p => p.kind === 'buy');
  if (S.biz) return [`사장님이 된 지 ${Math.floor((S.t - S.biz.t) / 2) + 1}년째`, `'${BIZ_N[S.biz.lv]}'를 키워 서울 집까지 갈 수 있을까?`];
  if (S.hp < 30) return ['몸이 보내는 위험 신호', '이대로 계속 달려도 괜찮을까? 집보다 내가 먼저 무너질 것 같다.'];
  if (S.crisisLeft > 0) return ['모두가 공포에 질린 시장', '누군가에겐 공포, 누군가에겐 기회. 통장에 현금이 있는 사람은 웃는다.'];
  if (own) return [['', '', '드디어 내 집이 생겼다!', '대출 이자가 빠져나가는 날', '갈아탈까, 버틸까?', '아이 방 하나 더 있었으면', '한 칸 위 동네가 보인다', '흔들리는 시장', '자산을 굳힐 시간', '20년의 끝이 보인다'][c] || '내 집에서 맞는 반기', ['', '', '“이제 대출을 갚으며 다음 목표를 세워 볼까?”', '“그래도 내 집이라 버틸 만하다.”', '“집값 뉴스가 자꾸 눈에 들어온다.”', '“가족이 늘면 집도 커져야 할까?”', '“더 좋은 동네로 갈아탈 수 있을까?”', '“지킬 것인가, 움직일 것인가.”', '“이제는 지키는 게 버는 거다.”', '“마지막 결정을 내릴 때다.”'][c] || ''];
  return [['친구가 서울 아파트 청약을 추천했다!', '종잣돈이 조금씩 쌓인다', '부동산 앱을 켜는 시간이 늘었다', '집값이 또 올랐다', '인생의 갈림길이 한꺼번에', '가족이 늘면 집이 더 절실하다', '아직 무주택, 하지만 포기는 이르다', '위기는 기회와 함께 온다', '마지막 승부를 걸까?', '20년의 끝이 보인다'][c], ['“지금 집을 사는 게 좋을까? 아니면 돈을 더 모을까?”', '“선배는 투잡을, 친구는 주식을 권한다. 나는?”', '“이번엔 진짜 첫 집에 도전해 볼까?”', '“기다릴수록 멀어지는 기분이다.”', '“결혼, 이직, 투자… 무엇부터 해야 할까?”', '“아이 방이 있는 집에서 살고 싶다.”', '“청약, 급매, 재개발… 아직 길은 있다.”', '“모두가 팔 때 살 용기가 있을까?”', '“남은 시간이 많지 않다.”', '“결과는 곧 나온다.”'][c]];
}
function scene(mood) { // 간단한 장면 일러스트 (SVG)
  const c = chapterOf(), own = S.props.some(p => p.kind === 'buy');
  const sky = S.crisisLeft > 0 ? ['#5b6478', '#a3a9b8'] : S.hp < 30 ? ['#3c4467', '#7b84a8'] : [['#8ec5e8', '#d9f0fb'], ['#f6b26b', '#ffe3b3'], ['#9b8cff', '#ffc8e1']][c % 3];
  const face = mood || (S.hp < 30 ? '😫' : S.crisisLeft > 0 ? '😰' : S.biz ? '😎' : own ? '😊' : S.happy < 35 ? '😔' : '🤔');
  const prop = S.biz ? '📦' : own ? '🏡' : S.plan.work === 'two' || S.plan.work === 'three' ? '🛵' : '🐷';
  let b = ''; const hs = [70, 110, 85, 140, 95, 125, 80, 150, 100, 118];
  hs.forEach((h, i) => { const x = 150 + i * 25; b += `<rect x="${x}" y="${190 - h}" width="22" height="${h}" rx="2" fill="${i % 2 ? '#e9eef7' : '#cfd9ea'}" stroke="#7d8aa5" stroke-width="1.2"/>`; for (let y = 200 - h; y < 182; y += 14) b += `<rect x="${x + 4}" y="${y}" width="5" height="7" fill="#7d8aa5" opacity=".55"/><rect x="${x + 13}" y="${y}" width="5" height="7" fill="#7d8aa5" opacity=".55"/>`; });
  return `<svg class="scn" viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="400" height="190" fill="url(#sk)"/>
    <ellipse cx="330" cy="40" rx="34" ry="12" fill="#fff" opacity=".8"/><ellipse cx="300" cy="46" rx="22" ry="9" fill="#fff" opacity=".7"/>${b}
    <rect x="0" y="0" width="140" height="190" fill="#f7efe2"/><rect x="132" y="0" width="12" height="190" fill="#3d5a73"/>
    <text x="70" y="150" font-size="110" text-anchor="middle">${face}</text><text x="350" y="182" font-size="46" text-anchor="middle">${prop}</text></svg>`;
}
function tabHome() {
  const own = S.props.some(p => p.kind === 'buy'), gap = firstHomeGap(), live = liveHome();
  let goal;
  const pill = own ? '1주택자' : '무주택자';
  if (own) goal = `<div class="card goal3"><div class="g3h"><span>🏡 내 집에서 다음 목표로!</span><em class="pill">${pill}</em></div><b class="g3b">${esc(aptName(live || S.props.find(p => p.kind === 'buy')))}</b><div class="g3f"><span>부동산 순자산 ${won(reNW())}</span><span>대출 ${won(debtTotal())}</span></div></div>`;
  else if (gap.short <= 0) goal = `<div class="card goal3 ok"><div class="g3h"><span>🏠 첫 집 마련 도전!</span><em class="pill">${pill}</em></div><b class="g3b">지금 바로 첫 집을 살 수 있어요!</b><div class="gbar"><i style="width:100%"></i></div><div class="g3f"><span>아래 추천 단지를 눌러 보세요</span></div></div>`;
  else { const have = S.cash + (S.res.type !== 'own' ? S.res.dep - S.res.loan : 0); const need = have + gap.short; goal = `<div class="card goal3"><div class="g3h"><span>🏠 첫 집 마련 도전!</span><em class="pill">${pill}</em></div><b class="g3b">첫 집 진입까지 ${won(gap.short)} 부족!</b><div class="gbar"><i style="width:${clamp(have / need * 100, 2, 100)}%"></i></div><div class="g3f"><span>내 현금 ${won(have)}</span><span>필요 자금 ${won(need)}</span></div></div>`; }
  const [sh, sq] = storyHead();
  const opts = workOptions();
  if (!opts.includes(S.plan.work)) S.plan.work = opts[0];
  const TAGW = { main: '안정', two: '도전', three: '위험', rest: '회복', biz: '모험', bizrun: '도전', bizlite: '안정', rejoin: '정리' };
  const wcards = opts.map((k, idx) => { const w = WORK[k], pv = workPreview(k), on = S.plan.work === k;
    const inc = k === 'main' ? '월급만' : k.startsWith('biz') && k !== 'biz' ? '사업 수익' : pv.inc ? (pv.inc > 0 ? '+' : '') + wonS(pv.inc) : '—';
    const risk = S.hp + pv.hp <= 0 ? ' danger' : S.hp + pv.hp < 25 ? ' warnc' : '';
    return `<button class="wopt ${on ? 'on' : ''}${risk}" data-w="${k}"><span class="wt"><span class="wi">${w.ic}</span><b>${idx + 1}. ${w.t}</b><em class="pill t-${TAGW[k]}">${on ? '✓ 선택' : TAGW[k]}</em></span><small>${w.d}</small><span class="wfx"><em class="${pv.inc > 0 ? 'pos' : pv.inc < 0 ? 'neg' : ''}">${inc}</em><em class="${pv.hp < 0 ? 'neg' : 'pos'}">체력 ${pv.hp > 0 ? '+' : ''}${pv.hp}</em><em class="${pv.hap < 0 ? 'neg' : 'pos'}">행복 ${pv.hap > 0 ? '+' : ''}${pv.hap}</em></span></button>`; }).join('');
  const pk = picks3();
  const pcards = pk.map(x => { const a = x.a, kind = { buy: ['구축·매매', '실거주 매수'], bun: ['분양권', '계약금 + 프리미엄'], ipj: ['재개발 입주권', '권리가액 − 이주비 대출'] }[a.kind];
    return `<button class="pick ${x.short <= 0 ? 'ok' : ''}" data-a="${a.id}"><span class="pk">${a.kind === 'buy' ? '🏢' : a.kind === 'bun' ? '📄' : '🏗️'} ${kind[0]}</span><b>${esc(a.n)}</b><small>${GUN[a.gu].n}구 · 시세 ${wonS(price(a.id))}</small><span class="pneed">${x.short <= 0 ? '✅ 지금 매수 가능' : `${wonS(x.short)} 부족`}</span></button>`; }).join('');
  const sv = stockValue(), si = stockIn(), sg = r2(sv - si);
  const hint = !own && gap.short > 0 ? (S.hp >= 60 && !S.biz ? '💡 부족한 돈은 <b>투잡</b>으로 빨리 모으거나, <b>주식</b>으로 불리거나, <b>청약</b>을 노려 보세요.' : S.hp < 40 ? '💡 체력이 낮아요. 이번 반기는 <b>휴식</b>을 고르는 게 안전해요.' : '💡 꾸준한 저축이 가장 확실한 길이에요.') : '';
  $('#tab').innerHTML = `
    <div class="chk2"><span>${yearOf()}년 ${S.t % 2 ? '가을' : '봄'} · ${ageOf()}세</span><span>CHAPTER ${chapterOf() + 1} / 10</span></div>
    ${goal}
    <div class="sech"><b>오늘의 이야기</b><small>${when()}</small></div>
    <div class="story3"><div class="scnw">${scene()}<span class="stag">${CHAPTERS[chapterOf()]}</span></div><b>${esc(sh)}</b><p>${esc(sq)}</p></div>
    <div class="sech"><b>이번 반기, 어떻게 할까요?</b><small>체력 ${S.hp}/100</small></div>
    <div class="wlist">${wcards}</div>${S.overwarn ? `<p class="owarn">🚑 과로 경고 ${S.overwarn}/2 — 한 번 더 쓰러지면 위험해요.</p>` : ''}
    <div class="sech"><b>지금 노려볼 서울 아파트</b><small>눌러서 자금 계산</small></div><div class="card flat"><div class="pgrid">${pcards}</div><button class="btn sm ghost" data-goto="map">🗺️ 서울 지도에서 더 찾아보기</button>${hint ? `<p class="small">${hint}</p>` : ''}</div>
    <div class="card"><h4>📈 주식 계좌 <small>종잣돈 불리기 · 선택</small></h4>${sv > 0 ? `<div class="stkrow"><b>${won(sv)}</b><span class="${sg >= 0 ? 'up' : 'dn'}">${sg >= 0 ? '+' : ''}${won(sg)} (${si ? pct(sg / si * 100) : '0%'})</span></div><p class="small">${Object.keys(STK).filter(k => S.stk[k] > 0).map(k => `${STK[k].ic} ${STK[k].t} ${wonS(S.stk[k])}`).join(' · ')}</p>` : '<p class="small">아직 투자하지 않았어요. 오르면 계약금이 빨리 모이지만, 위기 때 반토막 날 수도 있어요.</p>'}<button class="btn sm" id="bStk">📈 사고팔기</button></div>
    ${isHomeless() ? `<div class="card"><h4>🎟️ 청약 <small>내 ${term('가점')} ${gajeom().total}점</small></h4><label class="tgl"><input type="checkbox" id="chk" ${S.plan.ch ? 'checked' : ''}> 다음 반기에 청약 넣기</label><p class="small">당첨되면 계약금 10%를 바로 내야 해요. 무주택 기간과 가족이 늘수록 가점이 올라요.</p></div>` : ''}
    <div class="card mk"><div class="mrow"><div><small>집값 분위기</small><b class="ph ${S.phase}">${{ up: '🔥 상승장', flat: '😐 보합', down: '🧊 하락장' }[S.phase]}</b></div><div><small>기준금리</small><b>${S.rate.toFixed(2)}%</b></div><div><small>서울 지수</small><b>${Math.round(S.G * 100)}</b></div></div><div class="rule"><b>📜 ${esc(rules().name)}</b><br>${esc(rules().note).replace('LTV', term('LTV')).replace('갭투자', term('갭투자'))}</div></div>
    ${!own && gap.short > 0 && S.t >= 4 ? `<details class="card ads"><summary>🆘 막혔을 때 힌트 받기 <small>광고 · 한 판에 각 1회</small></summary>
      <button class="btn adb" data-ad="report" ${S.adUsed.report ? 'disabled' : ''}>📊 앞으로 1년 집값 전망 ${S.adUsed.report ? '✓' : ''}</button>
      <button class="btn adb" data-ad="chart" ${S.adUsed.chart ? 'disabled' : ''}>📈 모든 단지 과거 시세 그래프 ${S.adUsed.chart ? '✓' : ''}</button>
      <button class="btn adb" data-ad="imjang" ${S.adUsed.imjang ? 'disabled' : ''}>🔍 임장 기회 +2 ${S.adUsed.imjang ? '✓' : ''}</button></details>` : ''}
    <details class="card"><summary>📰 지난 소식</summary><ul class="log">${S.log.slice(0, 10).map(l => `<li><i>${when(l.t)}</i>${esc(l.s)}</li>`).join('')}</ul></details>`;
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const k = b.dataset.w;
    if (k === 'biz') return modal(`<h3>🚀 퇴사하고 창업할까요?</h3><p>월급이 끊기고 초기 비용 500만 원이 듭니다. 사업이 커지면 월급보다 훨씬 많이 벌 수 있지만, 망하면 사업 빚이 남아요.</p><p class="small">사업 중에는 '올인 / 적당히 / 정리·재취업' 중에서 고르게 됩니다. 소득이 불안정하면 대출 한도도 줄어요.</p><button class="btn pri" id="ok">창업하기로 정했다</button><button class="btn ghost" data-close>다시 생각해 볼게요</button>`) || ($('#ok').onclick = () => { S.plan.work = 'biz'; closeModal(); save(); tabHome(); });
    S.plan.work = k; save(); tabHome(); });
  document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => aptModal(b.dataset.a));
  document.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => { TAB = b.dataset.goto; renderGame(); });
  document.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => adReward(b.dataset.ad));
  $('#bStk').onclick = stockModal;
  if ($('#chk')) $('#chk').onchange = e => { S.plan.ch = e.target.checked; save(); };
}
function stockModal() {
  let k = 'blue';
  const draw = () => {
    const have = S.stk[k], max = Math.max(0, S.cash);
    modal(`<div class="evcat">주식 계좌 · 게임용 가상 시장</div><h3>📈 종잣돈 불리기</h3>
      <div class="stabs">${Object.entries(STK).map(([kk, v]) => `<button class="${k === kk ? 'on' : ''}" data-k="${kk}">${v.ic} ${v.t}</button>`).join('')}</div>
      <p class="small">${STK[k].d}${k === 'lev' ? ` — ${term('레버리지')}` : ''}</p>
      <table class="qt"><tr><td>보유 평가금</td><td>${won(have)}</td></tr><tr><td>투자 원금</td><td>${won(S.stkIn[k])}</td></tr><tr><td>보유 현금</td><td>${won(S.cash)}</td></tr></table>
      <label class="small">금액 <b id="sv">${won(Math.min(max, .1))}</b></label><input type="range" id="sr" min="0" max="${Math.max(max, have, .01)}" step="0.01" value="${Math.min(max, .1)}">
      <button class="btn pri" id="sb" ${max > 0 ? '' : 'disabled'}>사기</button><button class="btn" id="ss" ${have > 0 ? '' : 'disabled'}>팔기</button>
      <p class="small">수익률은 실제 시세가 아닌 게임용 가상 시나리오예요. 금융위기가 오면 우량주 −33%, 성장주 −50%, 코인 −65%까지 빠질 수 있어요.</p><button class="btn ghost" id="sx">닫기</button>`, 'wide');
    $('#sx').onclick = () => { closeModal(); renderGame(); };
    document.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { k = b.dataset.k; draw(); });
    $('#sr').oninput = e => { $('#sv').textContent = won(+e.target.value); };
    $('#sb').onclick = () => { const v = Math.min(+$('#sr').value, S.cash); if (v <= 0) return; buyStock(k, v); save(); toast(`${STK[k].ic} ${won(v)} 매수`); draw(); };
    $('#ss').onclick = () => { const v = Math.min(+$('#sr').value, S.stk[k]); if (v <= 0) return; sellStock(k, v); save(); toast(`${won(v)} 매도`); draw(); };
  };
  draw();
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
  const cnt = {}; for (const k in d) if (ENDS[k]) cnt[ENDS[k].r] = (cnt[ENDS[k].r] || 0) + 1;
  const tot = {}; for (const e of Object.values(ENDS)) tot[e.r] = (tot[e.r] || 0) + 1;
  let h = `<div class="card"><h4>🎬 엔딩 도감 ${Object.keys(d).filter(k => ENDS[k]).length}/40</h4><div class="rar">${Object.entries(RARE).map(([k, [n, c]]) => `<span style="border-color:${c};color:${c}">${n} ${cnt[k] || 0}/${tot[k]}</span>`).join('')}</div><p class="small">엔딩은 집·자산·부채·체력·행복·인생의 사건으로 결정돼요. 엔딩을 눌러 보세요.</p>`;
  for (let pt = 1; pt <= 5; pt++) {
    h += `<h5 class="pt">${PARTS[pt]}</h5><div class="dex">`;
    for (const [k, e] of Object.entries(ENDS).filter(([, e]) => e.p === pt)) h += `<button class="de ${d[k] ? 'got' : ''}" data-e="${k}" style="--rc:${RARE[e.r][1]}"><span>${d[k] ? e.ic : '❔'}</span><b>${k.slice(1).padStart(2, '0')}</b><small>${d[k] ? e.t : RARE[e.r][0]}</small></button>`;
    h += '</div>';
  }
  h += `</div><div class="card"><h4>🏢 아파트 도감</h4><div class="adex">${APTS.map(a => `<div class="${S && S.seen && S.seen[a.id] ? 'got' : ''}"><b>${a.n}</b><small>${GUN[a.gu].n}구 · ${a.y ? a.y + '년' : a.mv ? a.mv + '년 입주' : ''}</small></div>`).join('')}</div><p class="small">임장하거나 매수한 단지가 표시됩니다.</p></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const k = b.dataset.e, e = ENDS[k], rr = RARE[e.r];
    modal(d[k] ? `<div class="evcat" style="color:${rr[1]}">${rr[0]} · 엔딩 ${k.slice(1)}</div><h3>${e.ic} ${e.t}</h3><p>${e.s}</p><p class="small">조건: ${k === 'e40' ? E40_HINT : e.d}<br>달성: ${esc(d[k].name)} · ${d[k].mode === 'hist' ? '2015' : '2026'} 모드 · 순자산 ${won(d[k].nw)}</p><button class="btn" data-close>닫기</button>` : `<div class="evcat" style="color:${rr[1]}">${rr[0]}</div><h3>❔ 엔딩 ${k.slice(1)}</h3><p class="small">힌트: ${e.d}</p><button class="btn" data-close>닫기</button>`); });
}

// ---------- 진행 ----------
function onNext() {
  const r = nextTurn();
  if (r.end) { save(); if (r.R && r.R.work && r.R.work.lines.length && S.ended === 'e16') { renderGame(); return modal(`<h3>🚑</h3><ul class="rep">${r.R.work.lines.map(m => `<li>${esc(m)}</li>`).join('')}</ul><button class="btn pri" id="ok">…</button>`) || ($('#ok').onclick = () => { closeModal(); renderEnding(); }); } return renderEnding(); }
  const R = r.R, go = () => { if (R.crisis) return crisisModal(R.crisis, () => r.ev ? showEvent(r.ev) : renderGame()); if (r.ev) showEvent(r.ev); else renderGame(); };
  const after = () => { if (S.interAd) { S.interAd = false; showAd(go, true, 'turn_break'); } else go(); };
  renderGame();
  const W = WORK[R.work.k], d = r2(R.nw1 - R.nw0), dc = r2(R.cash1 - R.cash0);
  const newCh = S.t % 4 === 0, gp = firstHomeGap(), own = S.props.some(p => p.kind === 'buy');
  const mood = S.hp < 25 ? '😫' : d >= .3 ? '🤩' : d >= 0 ? '😊' : d > -.3 ? '😕' : '😱';
  const head = S.hp < 25 ? '몸이 버티지 못하고 있어요' : d >= .5 ? '자산이 크게 불었어요!' : d >= 0 ? '조금씩 나아가고 있어요' : '이번 반기는 쉽지 않았어요';
  modal(`<div class="evcat">${when(S.t - 1)} 결과${newCh ? ` · 📖 CHAPTER ${chapterOf() + 1} 시작` : ''}</div><h3>${mood} ${head}</h3>
    <div class="scnw sm">${scene(mood)}</div>
    <div class="tbl"><div><span>${W.ic} ${W.t}</span><b class="${dc >= 0 ? 'pos' : 'neg'}">현금 ${dc >= 0 ? '+' : ''}${won(dc)}</b></div><div><span>🏠 서울 집값</span><b class="${R.g >= 0 ? 'up' : 'dn'}">${pct(R.g)}</b></div><div><span>📊 순자산</span><b class="${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '+' : ''}${won(d)}</b></div><div><span>❤️ 체력 · 행복</span><b>${S.hp} · ${S.happy}</b></div>${!own ? `<div><span>현재 보유 현금</span><b>${won(S.cash)}</b></div><div><span>첫 집까지 부족한 금액</span><b class="${gp.short > 0 ? 'neg' : 'pos'}">${gp.short > 0 ? won(gp.short) : '없음! 지금 살 수 있어요'}</b></div>` : ''}</div>
    <details class="more"><summary>자세한 소식 ${[...R.work.lines, ...r.msgs].length}건</summary><ul class="rep">${[...R.work.lines, ...r.msgs].map(m => `<li>${esc(m)}</li>`).join('')}${S.lastFlow ? `<li>💰 월급 ${won(S.lastFlow.inc)} − 생활비·주거비·이자 ${won(S.lastFlow.inc - S.lastFlow.net)}</li>` : ''}</ul></details>
    <p class="nextq"><b>다음 선택:</b> ${!own && gp.short <= 0 ? '드디어 첫 집! 아파트를 보러 갈까?' : S.hp < 30 ? '이번엔 쉬어야 하지 않을까?' : !own ? '더 벌까, 불릴까, 청약을 넣을까?' : '버틸까, 갈아탈까?'}</p>
    <button class="btn pri" id="ok">${r.ev || R.crisis ? '다음 이야기 ▶' : '확인'}</button>`);
  $('#ok').onclick = () => { closeModal(); after(); };
}
function crisisModal(c, next) {
  modal(`<div class="evcat breaking">긴급 속보</div><h3>💥 ${esc(c.t)}</h3><p>${esc(c.d)}</p>
    <div class="res3"><div><small>주식</small><b class="dn">최대 −65%</b></div><div><small>서울 아파트</small><b class="dn">약 −13%</b></div><div><small>대출 한도</small><b class="dn">LTV −10%p</b></div></div>
    <p class="small">💡 위기에서 기회가 생깁니다. 현금을 지킨 사람에게는 급매 아파트가 기다리고 있어요. 서울 지도에서 <b>급매</b> 표시를 찾아보세요.</p><button class="btn pri" id="ok">계속</button>`, 'ev');
  $('#ok').onclick = () => { closeModal(); next(); };
}
function showEvent(e) {
  const E = e.run();
  modal(`<div class="evcat">이벤트 · ${E.cat}</div><h3>${esc(E.t)}</h3><p>${esc(E.d)}</p><div class="chs">${E.ch.map((c, i) => { const ok = !c.ok || c.ok(); return `<button class="ch" data-i="${i}" ${ok ? '' : 'disabled'}><b>${esc(c.l)}</b>${c.s ? `<small>${esc(c.s)}</small>` : ''}</button>`; }).join('')}</div>`, 'ev');
  document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const res = E.ch[+b.dataset.i].f(); log(`${E.t}: ${res}`);
    const c2 = crisis(); for (const m of c2) log(m);
    save();
    modal(`<h3>${esc(E.t)}</h3><p>${esc(res)}</p>${c2.map(m => `<p class="small">${esc(m)}</p>`).join('')}<button class="btn pri" id="ok">계속</button>`);
    $('#ok').onclick = () => { closeModal(); if (S.ended) return renderEnding(); if (S.chPend) return cheongWinModal(); if (S.goTab) { TAB = S.goTab; S.goTab = null; } if (S.goApt) { const id = S.goApt; S.goApt = null; TAB = 'map'; renderGame(); return aptModal(id); } renderGame(); };
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
  $('#app').innerHTML = `<div class="ending fade p${e.p}"><div class="ekick"><span class="rbadge" style="background:${RARE[e.r][1]}">${RARE[e.r][0]}</span> ${PARTS[e.p].slice(2)} · 엔딩 ${k.slice(1)}/40</div><div class="eic">${e.ic}</div><h2>${e.t}</h2><p class="story">${e.s}</p>
    <div class="card"><h4>📋 ${esc(S.name)}의 부동산 인생 결산</h4><table class="qt"><tr><td>기간</td><td>${S.startYear}년 → ${yearOf(Math.min(S.t, MAXT - 1))}년 (${Math.max(1, Math.ceil(S.t / 2))}년)</td></tr><tr><td>나이</td><td>${ageOf(Math.min(S.t, MAXT - 1))}세</td></tr><tr><td>최종 순자산</td><td><b>${won(nw())}</b></td></tr><tr><td>보유 주택</td><td>${homes.map(p => esc(aptName(p))).join(', ') || '없음'}</td></tr><tr><td>총부채</td><td>${won(debtTotal())}</td></tr><tr><td>체력 / 행복</td><td>${S.hp} / ${S.happy}</td></tr><tr><td>투잡 / 쓰리잡 / 승진</td><td>${S.w.two}번 / ${S.w.three}번 / ${S.promos}번</td></tr><tr><td>주식 (평가금)</td><td>${won(stockValue())}</td></tr><tr><td>갈아타기 / 청약 당첨</td><td>${S.st.flips}회 / ${S.st.chWin}회</td></tr></table></div>
    <p class="small">엔딩 도감 ${Object.keys(d).length}/40 수집</p>
    <button class="btn pri big" id="again">🔁 인생 다시 살기</button><button class="btn" id="dex">📖 엔딩 도감</button><button class="btn ghost" id="share">📤 결과 공유</button><a class="other" href="/">← aptgame.kr 다른 게임</a></div>`;
  if (window.APT && !S.rankSent) { S.rankSent = 1; save(); APT.endCard('seoul', Math.round(nw() * 10) / 10, `엔딩 ${k.slice(1)} ${e.t}`, '#again'); }
  $('#again').onclick = () => { store.set('_save', null); renderSetup(); };
  $('#dex').onclick = () => renderDexPage(renderEnding);
  $('#share').onclick = () => { const t = `나의 첫 번째 서울 아파트 구하기 — 엔딩 ${k.slice(1)} "${e.t}" (순자산 ${won(nw())}) https://aptgame.kr/seoul/`; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else { navigator.clipboard && navigator.clipboard.writeText(t); toast('결과 문구를 복사했어요'); } };
  if (e.p !== 4 && k !== 'e16' && k !== 'e17' && k !== 'e21' && k !== 'e22' && k !== 'e24') celebrate();
}

function cheongWinModal() {
  const c = S.chPend, dep = r2(c.p * .1), short = r2(dep - S.cash), room = r2(Math.max(0, Math.min(1.5, income() * 1.2) - S.credit));
  const stock = stockValue();
  modal(`<div class="evcat">청약 결과</div><h3>🎉 축하합니다! 청약에 당첨됐어요!</h3><div class="scnw sm">${scene('🤩').replace('🐷', '📱')}</div>
    <p><b>${esc(c.n)}</b>에 당첨될 기회가 찾아왔습니다. 하지만 계약하려면 돈이 더 필요해요.</p>
    <div class="tbl"><div><span>계약에 필요한 돈 (계약금 10%)</span><b>${won(dep)}</b></div><div><span>현재 보유 현금</span><b>${won(S.cash)}</b></div><div><span>부족한 금액</span><b class="neg">${won(short)}</b></div></div>
    <p class="nextq"><b>다음 선택:</b> 계약금을 마련할까, 기회를 포기할까?</p>
    <div class="chs">
      ${stock >= short ? `<button class="ch" data-c="stk"><b>📈 주식을 팔아 마련한다</b><small>주식 ${won(short)} 매도</small></button>` : ''}
      <button class="ch" data-c="cr" ${room >= short ? '' : 'disabled'}><b>🏦 신용대출로 마련한다</b><small>${room >= short ? `금리 ${(S.rate + 4).toFixed(1)}% · 이자 부담` : '신용대출 한도 부족'}</small></button>
      <button class="ch" data-c="pa" ${S.flags.parentsLoan ? 'disabled' : ''}><b>👪 부모님께 손을 벌린다</b><small>${S.flags.parentsLoan ? '이미 한 번 도움을 받았어요' : '50% 확률 · 행복 −5'}</small></button>
      <button class="ch" data-c="no"><b>😢 기회를 포기한다</b><small>당첨 기록은 남고 청약통장은 다시 못 써요</small></button></div>`, 'ev');
  const done = (msg, ok) => { if (ok) winBun(c); else S.flags.chGiveUp = true; S.chPend = null; log(msg); save(); modal(`<h3>${ok ? '🖊️ 계약 완료!' : '😢 포기'}</h3><p>${esc(msg)}</p><button class="btn pri" id="ok">계속</button>`); $('#ok').onclick = () => { closeModal(); renderGame(); }; };
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    const k = b.dataset.c;
    if (k === 'stk') { for (const kk of ['coin', 'lev', 'growth', 'blue']) { const need = r2(dep - S.cash); if (need <= 0) break; if (S.stk[kk] > 0) sellStock(kk, Math.min(S.stk[kk], need + .001)); } return done(`주식을 팔아 계약금 ${won(dep)}을 냈습니다. ${yearOf() + 3}년 입주 예정!`, S.cash >= dep); }
    if (k === 'cr') { S.credit = r2(S.credit + short + .001); S.cash = r2(S.cash + short + .001); return done(`신용대출 ${won(short)}을 받아 계약했습니다. ${yearOf() + 3}년 입주 예정!`, true); }
    if (k === 'pa') { S.flags.parentsLoan = true; S.happy = clamp(S.happy - 5, 0, 100); if (Math.random() < .5) { S.cash = r2(S.cash + short + .001); return done('부모님이 노후 자금을 보태 주셨습니다. 꼭 갚겠다고 약속하고 계약했습니다.', true); } return done('부모님도 여유가 없으셨습니다. 결국 계약을 포기했습니다.', false); }
    done('눈물을 머금고 계약을 포기했습니다.', false);
  });
}
