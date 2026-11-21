/* 쿠팡 파트너스 다이나믹 배너 (수익화팀 관리)
   <div class="cpb" data-sub="위치이름"></div> 자리에 대가성 문구 + 배너를 넣는다.
   aptgame.kr 웹에서만 동작 (앱인토스·MS 스토어 앱 안에서는 표시 안 함). 화면에 보일 때만 불러온다. */
(function () {
  if (!/(^|\.)aptgame\.kr$/.test(location.hostname)) return;
  var ID = 1052856, TC = 'AF9575128';
  function mount(el) {
    if (el.dataset.on) return; el.dataset.on = 1;
    var sub = (el.dataset.sub || 'web').replace(/[^a-z0-9]/gi, '').slice(0, 20);
    var w = Math.min(320, el.clientWidth || 320);
    el.innerHTML = '<p style="font-size:11px;color:#8a8f98;margin:0 0 4px;line-height:1.4">이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>' +
      '<iframe src="https://ads-partners.coupang.com/widgets.html?id=' + ID + '&template=carousel&trackingCode=' + TC + '&subId=' + sub + '&width=' + w + '&height=100&tsource=" width="' + w + '" height="100" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" loading="lazy" title="쿠팡 추천 상품"></iframe>';
  }
  function scan() {
    var els = document.querySelectorAll('.cpb:not([data-on])');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(mount); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } }); }, { rootMargin: '200px' });
    els.forEach(function (el) { io.observe(el); });
  }
  window.cpScan = scan;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
