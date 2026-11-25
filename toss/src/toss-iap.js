// 토스 미니앱 전용 인앱 결제 — 재건축 조합장 키우기
// 상품(앱인토스 콘솔에 등록된 이름으로 찾음, SKU 하드코딩 없음):
//   광고 제거 + 보상 바로 받기(비소모품) · 스트레스 회복권 5장(소모품) · 엔딩 미리보기권 3장(소모품) · 특별·전설 엔딩 공략집(비소모품)
// 웹(aptgame.kr)에는 이 파일이 없어서 상점이 보이지 않습니다. 게임 본문은 건드리지 않고 함수만 감쌉니다.
import { IAP as T } from '@apps-in-toss/web-framework';

const K = { noads: 'jhIapNoads', stress: 'jhIapStress', peek: 'jhIapPeek', peeked: 'jhIapPeeked', guide: 'jhIapGuide', done: 'jhIapDone' };
const NONCON = ['noads', 'guide'];
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const sup = f => { try { return !!(f && (!f.isSupported || f.isSupported())); } catch (e) { return false; } };
const MATCH = { noads: /광고\s*제거/, stress: /스트레스\s*회복권/, peek: /미리\s*보기권/, guide: /공략집/ };
let items = [];
const kindOf = p => Object.keys(MATCH).find(k => MATCH[k].test((p && (p.displayName || p.name)) || '')) || null;
const prod = k => items.find(x => kindOf(x) === k);
const kindBySku = sku => { const p = items.find(x => x.sku === sku); return p ? kindOf(p) : null; };
const g = n => { try { return (0, eval)(n); } catch (e) { return undefined; } }; // 게임 스크립트의 전역(const 포함) 읽기

// 특별·전설 엔딩 공략 (pickEnding 판정 조건 기준. 위에 있는 엔딩일수록 먼저 판정돼요)
const LEG = 'ⓘ 완주 엔딩은 위에서부터 먼저 맞는 조건이 나와요. 더 높은 엔딩 조건에 걸리지 않게 조절하세요.';
const cx = n => `<b>${n}</b> 단지로 시작해 끝까지 완주하고, 지지율 <b>65 이상</b> · 법적위험 <b>35 미만</b> · 분담금 인상 <b>20% 이하</b> · 투명성 <b>50 이상</b>으로 입주하세요. 분담금 폭탄·소송·해임총회 엔딩 조건을 피해야 해요.`;
const GUIDE = {
  perfect: '지지율 <b>85 이상</b> · 투명성 <b>75 이상</b> · 법적위험 <b>15 이하</b>, 분담금은 <b>처음보다 한 푼도 오르지 않게</b>(0% 이하) 입주까지 가세요. 가장 어려운 엔딩이에요. 회의록·계약서 공개 선택지를 꾸준히 고르고, 공사비 협상에서 버티는 게 핵심이에요.',
  refund: '입주 때 분담금이 처음보다 <b>10% 이상 내려가</b> 있어야 해요. 일반분양가를 올리는 선택, 상가·임대 수익을 늘리는 선택, 공사비 증액 거부가 열쇠예요.',
  lawking: '소송에서 <b>4번 이상 이기고 한 번도 지지 않은</b> 채 완주하세요. 소송 이벤트에서는 변호사 자문·자료 공개 쪽 선택이 승률이 높아요.',
  quizking: '자격시험 퀴즈를 <b>20문제 이상</b> 풀고 정답률 <b>90% 이상</b>으로 완주하세요. 50:50 힌트를 아끼지 마세요.',
  phoenix: '해임총회 시도를 <b>3번 이상</b> 버텨내고, 지지율 <b>50 이상</b>으로 입주하세요. 해임총회 직전에 지지율을 끌어올리는 선택(설명회·자료 공개)이 중요해요.',
  fastest: '<b>8년(96개월) 안에</b> 입주하고 지지율 <b>50 이상</b>을 지키세요. 기간을 늘리는(+개월) 선택을 최대한 피하고, 인허가 단계에서 보완 요청에 빨리 답하세요.',
  legend_daechi: cx('은마아파트'), legend_jamsil: cx('잠실주공5단지'), legend_apgu: cx('압구정 현대아파트'),
  legend_yeouido: cx('여의도 시범아파트'), legend_mokdong: cx('목동신시가지 6단지'), legend_sanggye: cx('상계주공6단지'),
};
const SPECIAL = Object.keys(GUIDE);

function beacon(k) { try { navigator.sendBeacon && navigator.sendBeacon('https://aptgame.kr/api/stat', new Blob([JSON.stringify({ g: 'johapjang', ev: 'iap_grant', k })], { type: 'application/json' })); } catch (e) {} }
function grant(kind, orderId) {
  const done = get(K.done, []);
  if (orderId && done.includes(orderId)) return true;
  if (kind === 'noads') set(K.noads, 1);
  else if (kind === 'stress') set(K.stress, get(K.stress, 0) + 5);
  else if (kind === 'peek') set(K.peek, get(K.peek, 0) + 3);
  else if (kind === 'guide') set(K.guide, 1);
  else return false;
  if (orderId) { done.push(orderId); set(K.done, done.slice(-200)); }
  beacon(kind); return true;
}
function applyNoads() {
  window.adBreak = o => {
    if (o.type === 'reward') { try { o.beforeAd && o.beforeAd(); } catch (e) {} try { o.adViewed && o.adViewed(); } catch (e) {} try { o.afterAd && o.afterAd(); } catch (e) {} try { o.adBreakDone && o.adBreakDone({ breakStatus: 'viewed' }); } catch (e) {} }
    else { try { o.adBreakDone && o.adBreakDone({ breakStatus: 'frequencyCapped' }); } catch (e) {} }
  };
  window.adConfig = () => {};
  try { const A = g('ADS'); if (A) { A.client = A.client || 'toss'; A.h5 = true; A.blocked = false; } } catch (e) {}
}
const toastX = t => { try { g('toast')(t); } catch (e) {} };
const modalX = h => { try { g('modal')(h); } catch (e) {} };
const closeX = () => { try { g('closeModal')(); } catch (e) {} };

let busy = false, cleanup = null;
function buy(kind, onDone) {
  const p = prod(kind);
  if (!p || !sup(T.createOneTimePurchaseOrder)) { toastX('지금은 상점을 열 수 없어요. 토스 앱을 최신 버전으로 업데이트해 주세요.'); return; }
  if (busy) return; busy = true;
  const end = () => { busy = false; try { cleanup && cleanup(); } catch (e) {} cleanup = null; };
  try {
    cleanup = T.createOneTimePurchaseOrder({
      options: { sku: p.sku, processProductGrant: ({ orderId }) => grant(kind, orderId) },
      onEvent: e => { end(); if (e && e.type === 'success') { if (kind === 'noads') applyNoads(); try { onDone && onDone(); } catch (x) {} } },
      onError: () => { end(); toastX('결제가 완료되지 않았어요. 결제됐다면 다음 실행 때 자동으로 지급돼요.'); },
    });
  } catch (e) { end(); toastX('결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
}

const IAPJ = {
  on: () => items.length > 0, has: k => !!prod(k), price: k => { const p = prod(k); return p ? (p.displayAmount || '') : ''; },
  noads: () => !!get(K.noads, 0), stressT: () => get(K.stress, 0), peekT: () => get(K.peek, 0), guide: () => !!get(K.guide, 0),
  peeked: k => get(K.peeked, []).includes(k) || (!!get(K.guide, 0) && !!GUIDE[k]),
  usePeek: k => { const n = get(K.peek, 0); if (n <= 0) return false; set(K.peek, n - 1); const a = get(K.peeked, []); if (!a.includes(k)) a.push(k); set(K.peeked, a); return true; },
  useStress: () => { const n = get(K.stress, 0); if (n <= 0) return false; set(K.stress, n - 1); return true; },
};
window.IAPJ = IAPJ;

// ----- 상점 -----
const DONE = { noads: '✨ 광고가 제거됐어요. 보상은 이제 바로 받아요!', stress: '🎫 스트레스 회복권 5장이 들어왔어요!', peek: '🔓 엔딩 미리보기권 3장이 들어왔어요! 엔딩 도감에서 써 보세요.', guide: '👑 특별·전설 엔딩 12종이 열렸어요! 엔딩 도감에서 공략을 확인하세요.' };
function shop() {
  const card = k => { const p = prod(k); if (!p) return '';
    const own = NONCON.includes(k) && !!get(K[k], 0);
    const sub = { guide: '👑 숨은 특별 엔딩 6종 + 단지별 전설 엔딩 6종의 결말을 전부 열고, 정확한 달성 조건과 공략까지 알려줘요.',
      peek: `아직 못 본 엔딩 하나의 결말 이야기를 몰래 열어봐요. 엔딩 도감에서 써요. (보유 ${IAPJ.peekT()}장)`,
      noads: '전면 광고 없이 플레이하고, 힌트·휴가·되돌리기 같은 광고 보상은 광고 없이 바로 받아요. 한 번 사면 계속 적용돼요.',
      stress: `1장 쓸 때마다 스트레스 -25. 챕터 제한 없이 써요. (보유 ${IAPJ.stressT()}장)` }[k];
    return `<div style="display:flex;gap:12px;align-items:center;text-align:left;padding:12px;border:1px solid #e5ddd0;border-radius:14px;margin:10px 0;background:#fff">${p.iconUrl ? `<img src="${p.iconUrl}" alt="" style="width:56px;height:56px;border-radius:12px">` : ''}<div style="flex:1"><b>${p.displayName}</b><div class="small" style="margin-top:4px">${sub}</div></div>${own ? '<span class="small"><b>구매 완료</b></span>' : `<button class="btn gold" data-buy="${k}" style="width:auto;padding:10px 12px;margin:0;white-space:nowrap">${p.displayAmount || '구매'}</button>`}</div>`; };
  const body = card('guide') + card('peek') + card('noads') + card('stress');
  modalX(`<h3 style="margin:0 0 4px">🛒 상점</h3>${body || '<p class="small">판매 중인 상품을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>'}<div class="small">결제는 토스에서 안전하게 진행돼요. 게임 진행에 꼭 필요한 상품은 아니에요.</div><button class="btn center" id="mClose">닫기</button>`);
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy, () => { toastX(DONE[b.dataset.buy]); shop(); }));
}
IAPJ.shop = shop;

// ----- 게임 함수 감싸기 -----
function hook() {
  // 1) 첫 화면 상점 버튼
  const rt = g('renderTitle');
  if (rt && !rt.__iap) { const f = function () { rt.apply(this, arguments); const m = document.querySelector('.tp-mid'); if (m && IAPJ.on() && !document.getElementById('shopBtn')) { m.insertAdjacentHTML('beforeend', '<button class="tp-btn ghost" id="shopBtn">🛒 상점</button>'); document.getElementById('shopBtn').onclick = shop; } }; f.__iap = 1; window.renderTitle = f; }
  // 2) 스트레스 회복권 (광고 휴가 줄에 추가)
  const ar = g('adRow');
  if (ar && !ar.__iap) { const f = function () { let h = ar.apply(this, arguments); const S = g('S'); if (!IAPJ.on() || !S) return h;
      const btn = IAPJ.stressT() > 0 && S.stress >= 20 ? `<button class="btn" id="iapStress" style="background:#e9f7ef;border:2px solid #3fa36a;color:#1d5c35">🎫 회복권 쓰기<br><span style="font-weight:400;font-size:11px">스트레스 -25 · 남은 ${IAPJ.stressT()}장</span></button>`
        : S.stress >= 60 && IAPJ.has('stress') ? `<button class="btn" id="iapStressBuy" style="background:#e9f7ef;border:2px solid #3fa36a;color:#1d5c35">🎫 스트레스 회복권 5장<br><span style="font-weight:400;font-size:11px">${IAPJ.price('stress')} · 1장당 -25</span></button>` : '';
      return btn ? h.replace(/<\/div>\s*$/, btn + '</div>') : h; }; f.__iap = 1; window.adRow = f; }
  const rd = g('render');
  if (rd && !rd.__iap) { const f = function () { rd.apply(this, arguments);
      const u = document.getElementById('iapStress'); if (u) u.onclick = () => { const S = g('S'); if (!S || !IAPJ.useStress()) return; try { g('apply')({ stress: -25 }); g('addLog')('🎫 스트레스 회복권 사용'); g('save')(); } catch (e) { S.stress = Math.max(0, S.stress - 25); } toastX(`🎫 스트레스 -25! 남은 회복권 ${IAPJ.stressT()}장`); window.render(); };
      const bb = document.getElementById('iapStressBuy'); if (bb) bb.onclick = () => buy('stress', () => { toastX(DONE.stress); window.render(); });
    }; f.__iap = 1; window.render = f; }
  // 3) 엔딩 도감: 잠긴 엔딩 몰래 열어보기 + 공략
  const dh = g('dexHTML');
  if (dh && !dh.__iap) { const f = function (cur) { let h = dh.apply(this, arguments); if (!IAPJ.on()) return h; const E = g('ENDINGS');
      return h.replace(/<button class="ed" data-hint="(\w+)">[\s\S]*?<\/button>/g, (m, k) => IAPJ.peeked(k) && E[k] ? `<button class="ed" data-hint="${k}" style="outline:2px dashed #9b4de0;outline-offset:-2px"><span>${E[k].ic}</span>${E[k].t} <em>👁 미리보기</em></button>` : m); }; f.__iap = 1; window.dexHTML = f; }
  const bd = g('bindDex');
  if (bd && !bd.__iap) { const f = function () { bd.apply(this, arguments); if (!IAPJ.on()) return; document.querySelectorAll('[data-hint]').forEach(b => { const orig = b.onclick; b.onclick = () => lockedModal(b.dataset.hint, orig ? () => orig.call(b) : null); }); }; f.__iap = 1; window.bindDex = f; }
  // 4) 엔딩 화면: 못 본 엔딩 몰래 열어보기 버튼
  const re = g('renderEnding');
  if (re && !re.__iap) { const f = function () { re.apply(this, arguments); if (!IAPJ.on() || !IAPJ.has('peek')) return; const ed = document.querySelector('.edex'); if (!ed || document.getElementById('peekUp')) return;
      const E = g('ENDINGS'), n = Object.keys(E).length - Object.keys(g('dexData')() || {}).filter(k => E[k]).length;
      ed.insertAdjacentHTML('afterend', `<button class="btn center" id="peekUp" style="border:2px dashed #9b4de0;color:#6b2fb3;background:#fff">🔓 아직 못 본 엔딩 ${n}개, 몰래 열어보기 ›</button>`);
      document.getElementById('peekUp').onclick = () => g('showDex')(); }; f.__iap = 1; window.renderEnding = f; }
}
function lockedModal(k, hintFn) {
  const E = g('ENDINGS'), v = E[k], H = g('HINTS') || {}, sp = SPECIAL.includes(k), pk = IAPJ.peeked(k), op = (g('openedHints') || (() => ({})))()[k];
  const guide = IAPJ.guide() && GUIDE[k] ? `<div class="small" style="text-align:left;background:#fff8e6;border:1px solid #f3d6a8;border-radius:12px;padding:10px 12px;margin:8px 0;line-height:1.6">👑 <b>공략</b><br>${GUIDE[k]}<br><span style="color:#8a7a60">${LEG}</span></div>` : '';
  const top = pk ? `<div style="font-size:42px">${v.ic}</div><div class="small" style="color:#6b2fb3;font-weight:800">👁 미리보기 · 아직 달성 전</div><h3 style="margin:4px 0">${v.t}</h3><p style="line-height:1.6;color:#4a433b">${v.d.replace(/은하아파트/g, '우리 아파트')}</p>`
    : `<div style="font-size:42px">❓</div><h3 style="margin:4px 0">아직 못 본 엔딩</h3><p class="small">${op ? (H[k] || '') : '결말과 그림이 궁금하다면 몰래 열어볼 수 있어요.'}</p>`;
  const b1 = !pk ? (IAPJ.peekT() > 0 ? `<button class="btn gold center" id="pkUse">🔓 미리보기권으로 몰래 열어보기 (보유 ${IAPJ.peekT()}장)</button>` : IAPJ.has('peek') ? `<button class="btn gold center" id="pkBuy">🔓 몰래 열어보기 · 미리보기권 3장 ${IAPJ.price('peek')}</button>` : '') : '';
  const b2 = sp && !IAPJ.guide() && IAPJ.has('guide') ? `<button class="btn center" id="gdBuy" style="background:linear-gradient(135deg,#f5c542,#e09b12);color:#3a2500">👑 특별·전설 12종 전부 열기 + 공략 ${IAPJ.price('guide')}</button>` : '';
  const b3 = !op && hintFn && !(IAPJ.guide() && GUIDE[k]) ? '<button class="btn ghost center" id="hintFree">📺 광고 보고 힌트만 보기</button>' : '';
  modalX(`<div style="text-align:center">${top}</div>${guide}${b1}${b2}${b3}<button class="btn center" id="mClose">닫기</button>`);
  const hf = document.getElementById('hintFree'); if (hf) hf.onclick = () => hintFn();
  const reopen = () => { closeX(); g('showDex')(); setTimeout(() => lockedModal(k, hintFn), 30); };
  const u = document.getElementById('pkUse'); if (u) u.onclick = () => { if (IAPJ.usePeek(k)) { toastX('🔓 엔딩을 몰래 열었어요!'); reopen(); } };
  const pb = document.getElementById('pkBuy'); if (pb) pb.onclick = () => buy('peek', () => { toastX(DONE.peek); lockedModal(k, hintFn); });
  const gb = document.getElementById('gdBuy'); if (gb) gb.onclick = () => buy('guide', () => { toastX(DONE.guide); reopen(); });
}

async function init() {
  if (get(K.noads, 0)) applyNoads();
  hook();
  if (!sup(T.getProductItemList)) return;
  try { const r = await T.getProductItemList(); items = (r && r.products) || []; } catch (e) { items = []; }
  if (sup(T.getPendingOrders)) try {
    const r = await T.getPendingOrders();
    for (const o of (r && r.orders) || []) { if (grant(kindBySku(o.sku), o.orderId)) await T.completeProductGrant({ params: { orderId: o.orderId } }); }
  } catch (e) {}
  if (sup(T.getCompletedOrRefundedOrders)) try {
    let key = null; const has = {};
    for (let i = 0; i < 20; i++) {
      const pg = await T.getCompletedOrRefundedOrders(key ? { key } : undefined); if (!pg) break;
      for (const o of pg.orders || []) { const k = kindBySku(o.sku); if (NONCON.includes(k)) has[k] = o.status === 'COMPLETED' || has[k] === true; }
      if (!pg.hasNext) break; key = pg.nextKey;
    }
    for (const k of NONCON) if (k in has) set(K[k], has[k] ? 1 : 0);
  } catch (e) {}
  if (IAPJ.noads()) applyNoads();
  try { const S = g('S'); if (!S && document.querySelector('.tp-mid')) window.renderTitle(); else if (S && !S.ending) window.render(); } catch (e) {}
}
window.__IAPJ_TEST = { grant, hook, lockedModal, shop, setItems: a => { items = a; }, GUIDE };
window.addEventListener('pagehide', () => { try { cleanup && cleanup(); } catch (e) {} });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
