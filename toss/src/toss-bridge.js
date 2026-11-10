// 토스 미니앱 전용: Google H5 광고 API(adBreak) 자리를 앱인토스 광고(loadFullScreenAd/showFullScreenAd)로 대신합니다.
// ads.json 에 콘솔에서 발급받은 광고 그룹 ID가 있으면 두 게임 모두 실제 토스 광고를 쓰고, 비어 있으면 각 게임의 기본 동작(무료 지급 등)을 유지합니다.
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import cfg from '../ads.json';

const ids = { inter: cfg.interstitial || '', reward: cfg.rewarded || '' };
const ready = { inter: false, reward: false };
const ok = () => { try { return !!(loadFullScreenAd.isSupported && loadFullScreenAd.isSupported()); } catch (e) { return false; } };
function load(k) {
  if (!ids[k] || !ok()) return;
  try { loadFullScreenAd({ options: { adGroupId: ids[k] }, onEvent: e => { if (e.type === 'loaded') ready[k] = true; }, onError: () => { ready[k] = false; } }); } catch (e) {}
}
function adBreak(o) {
  const k = o.type === 'reward' ? 'reward' : 'inter';
  if (!ready[k]) { load(k); if (!window.realRewarded || k === 'inter') o.adBreakDone && o.adBreakDone({ breakStatus: 'notReady' }); return; }
  ready[k] = false;
  let earned = false, done = false;
  const end = status => { if (done) return; done = true; try { o.afterAd && o.afterAd(); } catch (e) {} try { o.adBreakDone && o.adBreakDone({ breakStatus: status }); } catch (e) {} load(k); };
  const go = () => {
    try { o.beforeAd && o.beforeAd(); } catch (e) {}
    try {
      showFullScreenAd({ options: { adGroupId: ids[k] },
        onEvent: e => {
          if (e.type === 'userEarnedReward') { earned = true; try { o.adViewed && o.adViewed(); } catch (x) {} }
          if (e.type === 'dismissed') { if (k === 'reward' && !earned) { try { o.adDismissed && o.adDismissed(); } catch (x) {} } end(k === 'reward' && !earned ? 'dismissed' : 'viewed'); }
          if (e.type === 'failedToShow') end('error');
        },
        onError: () => end('error') });
    } catch (e) { end('error'); }
  };
  if (k === 'reward' && o.beforeReward) o.beforeReward(go); else go();
}
function enable() {
  if (!(ids.reward || ids.inter) || !ok()) return;
  load('inter'); load('reward');
  window.adBreak = adBreak; window.adConfig = () => {};
  try { if (typeof ADS !== 'undefined') { ADS.client = 'toss'; ADS.h5 = true; ADS.blocked = false; ADS.bannerSlot = ''; } } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enable); else enable();
