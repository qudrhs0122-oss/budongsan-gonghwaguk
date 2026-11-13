/* aptgame.kr 카카오 로그인 · 계정 랭킹 (모든 게임 공통) */
(function () {
  if (window.APT) return;
  const BASE = location.hostname.endsWith('aptgame.kr') || location.hostname === 'localhost' ? '' : 'https://aptgame.kr';
  const PK = 'apt_pending_score';
  const GAME_NAME = { bluemarble: '부동산 부루마블', johapjang: '조합장 키우기', seoul: '서울 아파트 구하기' };
  const KAKAO_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#000" d="M12 3C6.48 3 2 6.53 2 10.88c0 2.8 1.86 5.25 4.66 6.64l-.95 3.48c-.08.3.26.54.52.37l4.15-2.74c.53.06 1.07.1 1.62.1 5.52 0 10-3.53 10-7.85C22 6.53 17.52 3 12 3z"/></svg>';
  let meP = null;
  const css = `.apt-rank{margin:12px auto;max-width:520px;background:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 4px 16px rgba(0,0,0,.12);font-family:inherit;text-align:center;color:#2a2116;line-height:1.5}
.apt-rank h4{margin:0 0 6px;font-size:16px;color:#1f2547}.apt-rank p{margin:4px 0;font-size:14px;color:#4a4436}.apt-rank .big{font-size:22px;font-weight:900;color:#e8553d}
.apt-kakao{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#FEE500;color:rgba(0,0,0,.85);font-weight:800;font-size:15px;border:0;border-radius:12px;padding:12px 18px;text-decoration:none;cursor:pointer;margin:6px 0}
.apt-link{display:inline-block;margin-top:6px;font-weight:800;color:#1f2547;font-size:14px}
.apt-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1f2547;color:#fff;padding:10px 16px;border-radius:14px;font-size:14px;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.3);max-width:90vw;text-align:center}
.apt-chip{font-size:13px;font-weight:800;border-radius:10px;padding:4px 10px;text-decoration:none;white-space:nowrap}.apt-chip.out{background:#FEE500;color:#191919}.apt-chip.in{background:#f5efe4;color:#3a2e1e}`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, unit) => unit === '억' ? (Math.abs(s) >= 1 ? (Math.round(s * 10) / 10).toLocaleString() + '억' : Math.round(s * 10000).toLocaleString() + '만') : (Math.round(s * 10) / 10) + unit;
  function toast(t) { const d = document.createElement('div'); d.className = 'apt-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
  function me(force) { if (!meP || force) meP = fetch(BASE + '/api/me', { credentials: 'include', cache: 'no-store' }).then(r => r.json()).catch(() => ({ ready: false, user: null })); return meP; }
  const loginUrl = next => BASE + '/auth/kakao?next=' + encodeURIComponent(next || (location.pathname + location.search).replace(/[?&]login=1/, ''));
  function post(g, s, label) {
    return fetch(BASE + '/api/score', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ g, s, label }) }).then(r => r.json()).catch(() => ({ ok: false }));
  }
  function resultHTML(g, r) {
    return `<h4>🏆 ${esc(GAME_NAME[g])} 랭킹</h4>${r.weekRank ? `<p>이번 주 <span class="big">${r.weekRank}위</span> / ${r.weekTotal}명</p>` : ''}${r.newBest ? '<p>🎉 내 최고 기록을 새로 세웠어요!</p>' : ''}<a class="apt-link" href="/ranking.html?g=${g}">전체 랭킹 보기 ›</a>`;
  }
  // 게임 종료 화면에 랭킹 카드 붙이기
  async function endCard(g, s, label, target) {
    if (typeof s !== 'number' || !isFinite(s)) return;
    const box = document.createElement('div'); box.className = 'apt-rank'; box.innerHTML = '<p>랭킹 확인 중…</p>';
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (host && /^(BUTTON|A)$/.test(host.tagName)) host.parentNode.insertBefore(box, host); else (host || document.body).appendChild(box);
    const m = await me();
    if (m.user) {
      const r = await post(g, s, label);
      box.innerHTML = r.ok ? resultHTML(g, r) : `<h4>🏆 랭킹</h4><p>기록을 올리지 못했어요. 잠시 후 다시 시도해 주세요.</p><a class="apt-link" href="/ranking.html?g=${g}">랭킹 보기 ›</a>`;
      return;
    }
    try { localStorage.setItem(PK, JSON.stringify({ g, s, label, t: Date.now() })); } catch (e) {}
    box.innerHTML = m.ready
      ? `<h4>🏆 내 기록을 랭킹에 올려 보세요</h4><p>카카오 로그인 한 번이면 이번 판 기록이 바로 등록돼요.</p><a class="apt-kakao" href="${loginUrl()}">${KAKAO_SVG}카카오로 로그인</a><br><a class="apt-link" href="/ranking.html?g=${g}">랭킹 구경하기 ›</a>`
      : `<h4>🏆 계정 랭킹 준비 중</h4><p>곧 카카오 로그인으로 기록을 저장할 수 있어요.</p>`;
  }
  // 로그인하고 돌아왔을 때, 로그인 전에 끝낸 판 기록 올리기
  async function flushPending() {
    let p = null; try { p = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e) {}
    const back = /[?&]login=1/.test(location.search);
    if (back) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]login=1/, '').replace(/^&/, '?') + location.hash);
    const m = await me();
    if (back && m.user) toast(`${m.user.nick}님, 로그인했어요`);
    if (!p || !m.user) return;
    localStorage.removeItem(PK);
    if (Date.now() - p.t > 3 * 3600e3) return;
    const r = await post(p.g, p.s, p.label);
    if (r.ok) {
      toast(`🏆 ${GAME_NAME[p.g]} 기록 등록! 이번 주 ${r.weekRank}위`);
      document.querySelectorAll('.apt-rank').forEach(b => { b.innerHTML = resultHTML(p.g, r); });
    }
  }
  // 콘텐츠 페이지 상단에 로그인 상태 표시
  async function headerChip() {
    const nav = document.querySelector('header.top nav'); if (!nav) return;
    const m = await me(); if (!m.ready && !m.user) return;
    const a = document.createElement('a');
    if (m.user) { a.className = 'apt-chip in'; a.href = '/ranking.html'; a.textContent = '👤 ' + m.user.nick; }
    else { a.className = 'apt-chip out'; a.href = loginUrl(); a.textContent = '카카오 로그인'; }
    nav.appendChild(a);
  }
  window.APT = { me, endCard, loginUrl, toast, fmt, esc, GAME_NAME };
  const go = () => { flushPending(); headerChip(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
