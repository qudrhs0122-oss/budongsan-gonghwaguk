// ===================== 오늘의 이야기: 매 반기 바뀌는 이야기 카드 =====================
// h: 제목 ([키워드]는 강조), q: 속마음, img: 그림(없으면 움직이는 장면), c: 강조 색, cta: 바로 할 수 있는 행동
const STORIES = [
  { id: 'cheong1', img: 'cheong', c: 'blue', w: () => isHomeless() ? 3 : 0, h: '친구가 서울 아파트 [청약]을 추천했다!', q: '지금 집을 사는 게 좋을까? 아니면 돈을 더 모을까?', cta: ['🎟️ 청약 넣기', 'ch'] },
  { id: 'cheong2', img: 'cheong', c: 'blue', w: () => isHomeless() && S.st.chTry > 0 ? 3 : 0, h: '이번 [청약] 발표, 이번엔 될까?', q: '떨어져도 무주택 기간은 쌓인다. 다시 넣어 볼까?', cta: ['🎟️ 다시 청약 넣기', 'ch'] },
  { id: 'cheong3', img: 'cheong', c: 'blue', w: () => isHomeless() && gajeom().total >= 40 ? 4 : 0, h: '내 [청약 가점]이 꽤 올랐다!', q: () => `어느새 ${gajeom().total}점. 인기 단지도 노려볼 만할까?`, cta: ['🎟️ 청약 넣기', 'ch'] },
  { id: 'promo1', img: 'promo', c: 'purple', w: () => !S.biz && S.career >= 1 ? 3 : !S.biz ? 1 : 0, h: '직장에서 [승진] 기회가 왔다!', q: '지금 더 열심히 해서 연봉을 올려볼까?', cta: ['🏢 본업에 집중', 'w:main'] },
  { id: 'promo2', img: 'promo', c: 'purple', w: () => !S.biz && S.promos > 0 ? 2 : 0, h: '[연봉]이 올랐다, 이제 뭘 할까?', q: () => `연봉 ${won(S.salary)}. 늘어난 월급, 모을까 굴릴까?`, cta: ['📈 주식 계좌 보기', 'stk'] },
  { id: 'promo3', img: 'promo', c: 'purple', w: () => !S.biz && S.w.two + S.w.three >= 3 ? 2 : 0, h: '팀장님이 [본업]에 집중하라고 했다', q: '부업 때문에 회사 일에 소홀했나? 승진이 멀어지는 걸까.', cta: ['🏢 본업에 집중', 'w:main'] },
  { id: 'side1', img: 'side', c: 'orange', w: () => !S.biz && S.hp >= 50 ? 3 : 0, h: '부업으로 [추가 수입]을 만들 수 있을까?', q: '퇴근 후에도 조금 더 벌어볼까?', cta: ['🛵 투잡 뛰기', 'w:two'] },
  { id: 'side2', img: 'side', c: 'orange', w: () => S.passive > 0 ? 3 : 0, h: '[블로그 수익]이 통장에 들어왔다!', q: '자는 동안에도 돈이 들어온다니. 더 키워볼까?', cta: null },
  { id: 'side3', img: 'side', c: 'orange', w: () => !S.biz && S.t >= 6 && S.cash >= .3 ? 1.5 : 0, h: '내 [사업]을 해 볼까?', q: '월급만으로는 서울 집이 너무 멀다. 퇴사하고 도전해 볼까?', cta: ['🚀 창업 알아보기', 'w:biz'] },
  { id: 'stock1', img: 'stock', c: 'red', w: () => stockValue() < .05 && S.cash > .2 ? 3 : 0, h: '[주식]에 투자할까?', q: '요즘 주식이 오른다는데… 지금이 기회일까, 아니면 위험할까?', cta: ['📈 주식 계좌 열기', 'stk'] },
  { id: 'stock2', img: 'stock', c: 'red', w: () => stockValue() > .05 && stockValue() > stockIn() ? 3 : 0, h: '내 [주식]이 빨갛게 올랐다!', q: '지금 팔아서 계약금에 보탤까, 더 기다릴까?', cta: ['📈 계좌 확인', 'stk'] },
  { id: 'stock3', img: 'stock', c: 'red', w: () => stockValue() > .05 && stockValue() < stockIn() * .85 ? 3 : 0, h: '내 [계좌]가 파랗게 질렸다', q: '손절할까, 버틸까. 이 돈이 계약금이었는데…', cta: ['📈 계좌 확인', 'stk'] },
  { id: 'bun1', img: 'bun', c: 'blue', w: () => isHomeless() ? 2.5 : 0, h: '서울 신축 아파트 [분양] 기회가 떴다!', q: '초기 자금은 부족하지만… 지금 도전해볼까?', cta: ['🎟️ 청약 넣기', 'ch'] },
  { id: 'bun2', img: 'bun', c: 'blue', w: () => S.props.some(p => p.kind === 'bun') ? 4 : 0, h: '내 [분양권] 아파트가 올라가고 있다', q: '입주 때 잔금은 어떻게 마련하지? 미리 계산해 두자.', cta: ['💼 내 자산 보기', 'assets'] },
  { id: 'bun3', img: 'bun', c: 'blue', w: () => S.props.some(p => p.kind === 'ipj') || S.goal === 're' ? 3 : 0, h: '우리 구역 [재개발] 소식이 들려온다', q: '분담금이 또 오른다는데… 끝까지 버틸 수 있을까?', cta: ['🗺️ 지도 보기', 'map'] },
  { id: 'buy1', img: 'buy', c: 'purple', w: () => isHomeless() && firstHomeGap().short <= .3 ? 5 : 0, h: '지금이 [내 집 마련]의 최적기일까?', q: '대출도 가능하고, 집값도 조금 조정됐는데… 지금 사도 괜찮을까?', cta: ['🏠 살 수 있는 집 보기', 'pick'] },
  { id: 'buy2', img: 'buy', c: 'purple', w: () => isHomeless() && firstHomeGap().short > .3 ? 2 : 0, h: '[첫 집]까지 얼마나 남았을까?', q: () => `아직 ${won(firstHomeGap().short)}이 부족하다. 더 벌까, 불릴까?`, cta: ['🛵 투잡 뛰기', 'w:two'] },
  { id: 'buy3', img: 'buy', c: 'purple', w: () => !isHomeless() && S.st.homeTurns >= 4 ? 2.5 : 0, h: '더 좋은 동네로 [갈아탈까]?', q: '실거주 2년을 채웠다. 한 칸 위 동네가 자꾸 눈에 들어온다.', cta: ['🗺️ 상급지 찾아보기', 'map'] },
  { id: 'own1', img: 'buy', c: 'green', w: () => S.firstHome && S.t - S.firstHome.t <= 2 ? 8 : 0, h: '드디어 [내 집]이 생겼다!', q: '현관문 비밀번호를 내 마음대로 바꿨다. 이게 행복이구나.', cta: null },
  // 그림 없이 움직이는 장면으로 보여 주는 이야기
  { id: 'rent', c: 'orange', w: () => S.res.type === 'wolse' && S.t >= 3 ? 1.5 : 0, h: '집주인이 [월세]를 올린다고 한다', q: '매달 나가는 돈이 아깝다. 전세로 옮길까, 아예 사 버릴까?', cta: ['💼 거주지 바꾸기', 'assets'] },
  { id: 'jeonse', c: 'orange', w: () => S.res.type === 'jeonse' ? 1.5 : 0, h: '[전세 만기]가 다가온다', q: '보증금은 무사히 돌려받을 수 있을까?', cta: null },
  { id: 'hp', c: 'red', w: () => S.hp < 35 ? 9 : 0, h: '몸이 보내는 [위험 신호]', q: '이대로 계속 달려도 괜찮을까? 집보다 내가 먼저 무너질 것 같다.', cta: ['🛌 이번엔 쉬기', 'w:rest'] },
  { id: 'biz', c: 'orange', w: () => S.biz ? 6 : 0, h: () => `사장님이 된 지 [${Math.floor((S.t - S.biz.t) / 2) + 1}년째]`, q: () => `'${BIZ_N[S.biz.lv]}'를 키워 서울 집까지 갈 수 있을까?`, cta: ['📦 사업에 올인', 'w:bizrun'] },
  { id: 'crisis', c: 'red', w: () => S.crisisLeft > 0 ? 10 : 0, h: '모두가 [공포]에 질린 시장', q: '누군가에겐 공포, 누군가에겐 기회. 급매가 나왔다는데…', cta: ['🗺️ 급매 찾기', 'map'] },
  { id: 'up', c: 'red', w: () => S.phase === 'up' ? 2 : 0, h: '서울 집값이 또 [올랐다]', q: '기다릴수록 멀어지는 기분이다. 영끌이라도 해야 할까?', cta: ['🏠 살 수 있는 집 보기', 'pick'] },
  { id: 'down', c: 'blue', w: () => S.phase === 'down' ? 2.5 : 0, h: '[하락장], 기회일까 함정일까?', q: '집값이 떨어지고 있다. 지금 사면 바닥일까?', cta: ['🏠 매물 보기', 'pick'] },
  { id: 'rate', c: 'red', w: () => S.rate >= 3 ? 2 : 0, h: '[금리]가 또 오른다는 뉴스', q: () => `기준금리 ${S.rate.toFixed(2)}%. 대출 이자가 무섭다.`, cta: null },
  { id: 'single', c: 'purple', w: () => S.married < 0 && ageOf() >= 33 ? 1.5 : 0, h: '부모님이 [결혼]은 언제 하냐고 물으신다', q: '집도 없는데 결혼은 무슨… 아니, 둘이면 더 빨리 살 수 있을까?', cta: null },
  { id: 'couple', c: 'purple', w: () => S.married >= 0 && isHomeless() ? 3 : 0, h: '둘이 함께 그리는 [우리 집]', q: '맞벌이 소득이면 대출이 더 나올까? 신혼부부 특별공급도 있다던데.', cta: ['🎟️ 청약 넣기', 'ch'] },
  { id: 'kids', c: 'green', w: () => S.kids.length > 0 ? 2 : 0, h: '아이 방이 있는 [넓은 집]', q: '아이가 크면서 집이 점점 좁아진다.', cta: ['🗺️ 넓은 집 찾기', 'map'] },
  { id: 'debt', c: 'red', w: () => !isHomeless() && debtTotal() > income() * 3 ? 2 : 0, h: '[대출 이자]가 빠져나가는 날', q: '그래도 내 집이라 버틸 만하다. 조금씩 갚아 볼까?', cta: ['💼 대출 갚기', 'assets'] },
  { id: 'tired', c: 'orange', w: () => S.w.two + S.w.three >= 4 && S.hp < 60 ? 3 : 0, h: () => `부업 [${S.w.two + S.w.three}번째], 이대로 괜찮을까?`, q: '통장은 불어나는데 거울 속 얼굴은 점점 지쳐 간다.', cta: ['🛌 한 번 쉬기', 'w:rest'] },
  { id: 'late', c: 'purple', w: () => S.t >= MAXT - 8 ? 3 : 0, h: () => `20년의 끝까지 [${Math.ceil((MAXT - S.t) / 2)}년]`, q: '마지막 승부를 걸까, 지금을 지킬까?', cta: null },
  { id: 'save', c: 'green', w: () => .8, h: '통장 잔고가 [조금씩] 늘고 있다', q: '티끌 모아 태산. 오늘도 커피 대신 텀블러.', cta: null },
];
function pickStory() {
  if (S.story && S.story.t === S.t && STORIES.find(x => x.id === S.story.id)) return STORIES.find(x => x.id === S.story.id);
  S.storyHist = S.storyHist || [];
  const recent = S.storyHist.slice(-6);
  let pool = STORIES.map(s => ({ s, w: (s.w() || 0) * (recent.includes(s.id) ? .08 : 1) })).filter(x => x.w > 0);
  let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), pick = pool[0].s;
  for (const x of pool) { r -= x.w; if (r <= 0) { pick = x.s; break; } }
  S.story = { id: pick.id, t: S.t }; S.storyN = (S.storyN || 0) + 1; S.storyHist.push(pick.id); if (S.storyHist.length > 20) S.storyHist.shift();
  save();
  return pick;
}
function storyCard() {
  const st = pickStory(), v = f => typeof f === 'function' ? f() : f;
  const h = esc(v(st.h)).replace(/\[(.+?)\]/, `<mark class="kw ${st.c}">$1</mark>`);
  const art = st.img ? `<img src="img/st_${st.img}.webp" alt="">` : sceneLive().svg;
  return `<div class="sty ${st.c}"><div class="stx"><span class="slab">📖 오늘의 이야기 ${S.storyN || 1}</span><b>${h}</b><p>“${esc(v(st.q))}”</p>${st.cta ? `<button class="scta" data-cta="${st.cta[1]}">${st.cta[0]} ›</button>` : ''}</div><div class="sart ${st.img ? 'pic' : 'anim'}">${art}</div></div>`;
}
function storyAction(a) {
  if (a === 'ch') { S.plan.ch = true; save(); toast('🎟️ 다음 반기에 청약을 넣어요'); return tabHome(); }
  if (a === 'stk') return stockModal();
  if (a === 'map' || a === 'assets') { TAB = a; return renderGame(); }
  if (a === 'pick') { const p = picks3()[0]; return p ? aptModal(p.a.id) : (TAB = 'map', renderGame()); }
  if (a.startsWith('w:')) { const k = a.slice(2); if (!workOptions().includes(k)) return toast('지금은 고를 수 없어요'); if (k === 'biz') return document.querySelector('[data-w="biz"]').click(); S.plan.work = k; save(); toast(`${WORK[k].ic} ${WORK[k].t}로 정했어요`); tabHome(); }
}
