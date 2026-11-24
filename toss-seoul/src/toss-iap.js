// 토스 미니앱 전용 인앱 결제: '광고 제거 + 보상 바로 받기'(비소모품), '체력 회복권 5장'(소모품)
// 상품은 앱인토스 콘솔에 등록된 이름으로 찾습니다(SKU 하드코딩 없음). 웹(aptgame.kr)에는 이 파일이 없어서 상점이 보이지 않습니다.
import { IAP as T } from '@apps-in-toss/web-framework';

const K = { noads: 'tossIapNoads', hp: 'tossIapHp', done: 'tossIapDone', peek: 'tossIapPeek', peeked: 'tossIapPeeked', guide: 'tossIapGuide' };
const NONCON = ['noads', 'guide'];
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const sup = f => { try { return !!(f && (!f.isSupported || f.isSupported())); } catch (e) { return false; } };
const MATCH = { noads: /광고\s*제거/, hp: /체력\s*회복권/, peek: /미리\s*보기권/, guide: /공략집/ };
// 전설·히든 엔딩 공략 (turn.js 판정 조건 기준)
const GUIDE = {
  e10: '반포 <b>아크로리버파크</b>(한강뷰 최고) 또는 <b>한남3구역</b> 입주권(입주 후 한강뷰)을 <b>실거주</b>로 갖고 엔딩을 맞으세요. 행복 70 이상이 필요해요. 처음부터 사기엔 비싸니, 분양권·갭투자로 자산을 키운 뒤 갈아타기로 올라가는 게 정석이에요.',
  e14: '창업 이벤트가 오면 <b>창업</b>을 고르고, 사업을 <b>3단계까지</b> 키우세요. 서울에 내 집도 있어야 해요. 사업 초반엔 체력이 많이 깎이니 휴식을 챙기세요.',
  e15: '순자산 <b>25억 원</b> 이상, <b>주식+현금 8억 원</b> 이상, 부채는 <b>부동산 가치의 20% 이하</b>. 후반에는 대출을 갚고 배당·주식 비중을 늘려 두세요.',
  e18: '한 번에 <b>주식 수익 5억 원</b> 이상을 낸 기록이 필요하고, 엔딩 때 <b>강남·서초·송파</b> 아파트를 갖고 있어야 해요. 금융위기 폭락장에서 저점 매수하는 게 가장 빠른 길이에요.',
  e40: '순자산 <b>18억 원</b> 이상 · 체력 <b>80</b> 이상 · 행복 <b>88</b> 이상 · <b>결혼하고 자녀</b>가 있어야 해요. 부채는 <b>부동산 가치의 15% 이하</b>, 한 번도 <b>강제 매각</b>이나 위기를 겪지 않고 과로 경고 없이 마무리해야 열려요. 가장 어려운 엔딩이에요.',
};
let items = [];
const kindOf = p => Object.keys(MATCH).find(k => MATCH[k].test((p && (p.displayName || p.name)) || '')) || null;
const skuOf = k => { const p = items.find(x => kindOf(x) === k); return p ? p.sku : null; };
const kindBySku = sku => { const p = items.find(x => x.sku === sku); return p ? kindOf(p) : null; };

function grant(kind, orderId) { // 같은 주문을 두 번 지급하지 않음
  const done = get(K.done, []);
  if (orderId && done.includes(orderId)) return true;
  if (kind === 'noads') set(K.noads, 1);
  else if (kind === 'hp') set(K.hp, get(K.hp, 0) + 5);
  else if (kind === 'peek') set(K.peek, get(K.peek, 0) + 3);
  else if (kind === 'guide') set(K.guide, 1);
  else return false;
  if (orderId) { done.push(orderId); set(K.done, done.slice(-200)); }
  try { navigator.sendBeacon && navigator.sendBeacon('https://aptgame.kr/api/stat', new Blob([JSON.stringify({ g: 'seoul', ev: 'iap_grant', k: kind })], { type: 'application/json' })); } catch (e) {}
  return true;
}

async function init() {
  if (get(K.noads, 0)) applyNoads();
  if (!sup(T.getProductItemList)) return;
  try { const r = await T.getProductItemList(); items = (r && r.products) || []; } catch (e) { items = []; }
  // 결제는 됐는데 지급이 안 된 주문 복원
  if (sup(T.getPendingOrders)) try {
    const r = await T.getPendingOrders();
    for (const o of (r && r.orders) || []) { if (grant(kindBySku(o.sku), o.orderId)) await T.completeProductGrant({ params: { orderId: o.orderId } }); }
  } catch (e) {}
  // 비소모품(광고 제거) 복원 — 기기를 바꿔도 유지, 환불되면 회수
  if (sup(T.getCompletedOrRefundedOrders)) try {
    let key = null; const has = {};
    for (let i = 0; i < 20; i++) {
      const pg = await T.getCompletedOrRefundedOrders(key ? { key } : undefined); if (!pg) break;
      for (const o of pg.orders || []) { const k = kindBySku(o.sku); if (NONCON.includes(k)) has[k] = o.status === 'COMPLETED' || has[k] === true; }
      if (!pg.hasNext) break; key = pg.nextKey;
    }
    for (const k of NONCON) if (k in has) set(K[k], has[k] ? 1 : 0);
  } catch (e) {}
  if (window.IAP.noads()) applyNoads();
  try { if (document.querySelector('.title2') && typeof renderTitle === 'function') renderTitle(); } catch (e) {}
}

function applyNoads() { // 전면 광고 생략, 보상형 광고는 바로 보상
  window.adBreak = o => {
    if (o.type === 'reward') { try { o.adViewed && o.adViewed(); } catch (e) {} try { o.adBreakDone && o.adBreakDone({ breakStatus: 'viewed' }); } catch (e) {} }
    else { try { o.adBreakDone && o.adBreakDone({ breakStatus: 'frequencyCapped' }); } catch (e) {} }
  };
  window.adConfig = () => {};
  try { if (typeof ADS !== 'undefined') { ADS.client = ADS.client || 'toss'; ADS.h5 = true; ADS.blocked = false; } } catch (e) {}
}

let busy = false, cleanup = null;
function buy(kind, onDone) {
  const sku = skuOf(kind);
  if (!sku || !sup(T.createOneTimePurchaseOrder)) { toast('지금은 상점을 열 수 없어요. 토스 앱을 최신 버전으로 업데이트해 주세요.'); return; }
  if (busy) return; busy = true;
  const end = () => { busy = false; try { cleanup && cleanup(); } catch (e) {} cleanup = null; };
  try {
    cleanup = T.createOneTimePurchaseOrder({
      options: { sku, processProductGrant: ({ orderId }) => grant(kind, orderId) },
      onEvent: e => { end(); if (e && e.type === 'success') { if (kind === 'noads') applyNoads(); try { onDone && onDone(); } catch (x) {} } },
      onError: () => { end(); toast('결제가 완료되지 않았어요. 결제됐다면 다음 실행 때 자동으로 지급돼요.'); },
    });
  } catch (e) { end(); toast('결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
}

const DONE = { noads: '✨ 광고가 제거됐어요. 보상은 이제 바로 받아요!', hp: '🎫 체력 회복권 5장이 들어왔어요!', peek: '🔓 엔딩 미리보기권 3장이 들어왔어요! 엔딩 도감에서 써 보세요.', guide: '👑 전설·히든 엔딩 공략집이 열렸어요! 엔딩 도감에서 확인하세요.' };
function shop() {
  const card = k => { const p = items.find(x => kindOf(x) === k); if (!p) return '';
    const own = NONCON.includes(k) && !!get(K[k], 0);
    const sub = { noads: '전면 광고 없이 플레이하고, 체력·성과급·힌트 보상은 광고 없이 바로 받아요. 한 번 사면 계속 적용돼요.',
      hp: `1장 쓸 때마다 체력 +30. 광고 횟수 제한 없이 반기 결과 화면에서 써요. (보유 ${window.IAP.hpT()}장)`,
      peek: `아직 못 본 엔딩 하나의 그림과 결말 이야기를 몰래 열어봐요. 엔딩 도감에서 써요. (보유 ${window.IAP.peekT()}장)`,
      guide: '👑 전설 4종 + 🔒 히든 엔딩의 그림·결말을 전부 열고, 정확한 달성 조건과 공략 루트까지 알려줘요.' }[k];
    return `<div style="display:flex;gap:12px;align-items:center;text-align:left;padding:12px;border:1px solid #e5e8eb;border-radius:14px;margin:10px 0">${p.iconUrl ? `<img src="${p.iconUrl}" alt="" style="width:56px;height:56px;border-radius:12px">` : ''}<div style="flex:1"><b>${p.displayName}</b><p class="small" style="margin:4px 0 0">${sub}</p></div>${own ? '<span class="small"><b>구매 완료</b></span>' : `<button class="btn pri" data-buy="${k}" style="width:auto;padding:10px 14px;margin:0">${p.displayAmount || '구매'}</button>`}</div>`; };
  const body = card('guide') + card('peek') + card('noads') + card('hp');
  modal(`<h3>🛒 상점</h3>${body || '<p class="small">판매 중인 상품을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>'}<p class="small">결제는 토스에서 안전하게 진행돼요. 게임 진행에 꼭 필요한 상품은 아니에요.</p><button class="btn" data-close>닫기</button>`);
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy, () => { toast(DONE[b.dataset.buy]); shop(); }));
}

window.IAP = {
  on: () => items.length > 0,
  noads: () => !!get(K.noads, 0),
  hpT: () => get(K.hp, 0),
  useHp: () => { const n = get(K.hp, 0); if (n <= 0) return false; set(K.hp, n - 1); return true; },
  has: k => items.some(x => kindOf(x) === k),
  price: k => { const p = items.find(x => kindOf(x) === k); return p ? (p.displayAmount || '') : ''; },
  peekT: () => get(K.peek, 0),
  guide: () => !!get(K.guide, 0),
  guideText: k => GUIDE[k] || '',
  peeked: k => get(K.peeked, []).includes(k) || (!!get(K.guide, 0) && !!GUIDE[k]),
  usePeek: k => { const n = get(K.peek, 0); if (n <= 0) return false; set(K.peek, n - 1); const a = get(K.peeked, []); if (!a.includes(k)) a.push(k); set(K.peeked, a); return true; },
  buy, shop,
};
window.addEventListener('pagehide', () => { try { cleanup && cleanup(); } catch (e) {} });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
