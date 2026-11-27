'use strict';
// =====================================================================
//  사신학당 — 첫 30분 데모
// =====================================================================
const WEAPONS = {
  sword: { n: '법검', ic: '🗡️', d: '근접 참격 · 한 번에 넓게 벤다', dmg: 13, cd: .36 },
  talisman: { n: '부적', ic: '📜', d: '원거리 · 날아가는 부적으로 봉인', dmg: 9, cd: .3 },
  fan: { n: '법선', ic: '🪭', d: '부채 바람 · 넓게 밀쳐낸다', dmg: 8, cd: .48 },
  bell: { n: '신령방울', ic: '🔔', d: '유도 영혼구 · 맞히면 체력 회복', dmg: 10, cd: .5 },
};
const SPELLS = {
  baekho: [{ id: 'baek', n: '백아참', ic: '⚔️', mp: 15, cd: 4, d: '앞으로 돌진하며 벤다' }, { id: 'geum', n: '금강신체', ic: '🛡️', mp: 20, cd: 12, d: '6초간 받는 피해 60% 감소' }],
  cheongryong: [{ id: 'roe', n: '청뢰격', ic: '⚡', mp: 18, cd: 5, d: '가까운 요괴 3마리에 번개' }, { id: 'pung', n: '풍인술', ic: '🌪️', mp: 12, cd: 3, d: '바람 칼날 다섯 갈래' }],
  hyeonmu: [{ id: 'bing', n: '빙결진', ic: '❄️', mp: 18, cd: 6, d: '주변을 얼려 묶는다' }, { id: 'sam', n: '치유의 샘', ic: '💧', mp: 22, cd: 12, d: '5초간 체력 회복' }],
  jujak: [{ id: 'hwa', n: '화염구', ic: '🔥', mp: 15, cd: 3.5, d: '터지는 불덩이 · 화상' }, { id: 'jang', n: '화염장막', ic: '🌋', mp: 20, cd: 9, d: '4초간 몸 주위에 불꽃 고리' }],
};
const SFX = { baek: 'tigerdash', geum: 'roar', roe: 'bolt', pung: 'wind', bing: 'ice', sam: 'spring', hwa: 'fireball', jang: 'hongryeon' };
const BEAST = {
  jujak: { n: '아기 주작', ic: '🔥', call: 'jujak', el: 'fire', ult: { n: '주작강림', fx: 'phoenix', el: 'fire' } },
  baekho: { n: '아기 백호', ic: '🐯', call: 'tigerdash', el: null, ult: { n: '백호천참', fx: 'tigerult', el: null } },
  cheongryong: { n: '아기 청룡', ic: '🐉', call: 'dragonbolt', el: 'shock', ult: { n: '창룡천뢰', fx: 'dragon', el: 'shock' } },
  hyeonmu: { n: '아기 현무', ic: '🐢', call: 'turtle', el: 'ice', ult: { n: '현무신벽', fx: 'turtle', el: 'ice' } },
};
const FOE_IC = { wisp: '🔥', imp: '👺', egg: '🥚', tiger: '🐅', king: '👹' };
const FOE = {
  wisp: { n: '도깨비불', hp: 30, sp: 1.6, r: .4, xp: 8, coin: 2, dmg: 8 },
  imp: { n: '꼬마 도깨비', hp: 42, sp: 2.6, r: .42, xp: 10, coin: 3, dmg: 9 },
  egg: { n: '달걀귀신', hp: 48, sp: 1.8, r: .42, xp: 14, coin: 4, dmg: 11 },
  tiger: { n: '장산범', hp: 200, sp: 3.2, r: .7, xp: 60, coin: 20, dmg: 14, elite: 1 },
  king: { n: '도깨비왕', hp: 950, sp: 2.2, r: 1.1, xp: 200, coin: 100, dmg: 20, boss: 1 },
};

// ----- 이미지 -----
const IMG = {};
['m_down','m_up','m_side','m_walk0','m_walk1','m_walk2','m_walk3','f_down','f_up','f_side','f_walk0','f_walk1','f_walk2','f_walk3','m_port','f_port','talisman',
 'fx_fireball','fx_hongryeon','fx_jujak','fx_moon','fx_tigerdash','fx_roar','fx_wind','fx_bolt','fx_ice','fx_spring','fx_dome','fx_phoenix','fx_tigerult','fx_dragon','fx_turtle','fx_dragonbolt'].forEach(n => { const i = new Image(); i.src = 'img/' + n + '.png'; IMG[n] = i; });
const ok = i => i && i.complete && i.naturalWidth;
let fxs = [];
function fx(n, x, y, w, life, o) { fxs.push(Object.assign({ n, x, y, w, life, ml: life, follow: 0, flip: 0, rot: 0 }, o || {})); }
// ----- 상태 -----
let G = null;            // 저장되는 진행 상태
let M = null, ground = null, solidG = null;
let P = null, ents = [], foes = [], shots = [], areas = [], parts = [], nums = [];
let state = 'title', now = 0, last = performance.now(), shake = 0, exitMsgT = 0, scriptBusy = false, hitstop = 0;
const CD = { atk: 0, dodge: 0, s0: 0, s1: 0, r: 0, f: 0 };

function newG(name, gender) {
  return { name, gender, house: null, weapon: null, lv: 1, xp: 0, mhp: 100, hp: 100, mmp: 60, mp: 60, coin: 0, potion: 0, herb: 0, kills: 0, sg: 0, dex: {}, sub: 0, flags: {}, scene: 'village', t0: Date.now(), play: 0 };
}
function save() { if (G) { G.play += 0; store.set('save', G); } }
const F = k => !!(G && G.flags[k]);
const setF = (k, v) => { G.flags[k] = v === undefined ? 1 : v; save(); };

function bgGround(m) {
  const c = document.createElement('canvas'); c.width = m.W * T; c.height = m.H * T; const g = c.getContext('2d');
  const im = IMG[m.bg] || (IMG[m.bg] = Object.assign(new Image(), { src: 'img/' + m.bg + '.webp' }));
  const paint = () => { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height); if (mini && M === m) buildMini(); };
  if (ok(im)) paint(); else { g.fillStyle = '#1a1626'; g.fillRect(0, 0, c.width, c.height); im.addEventListener('load', paint, { once: true }); }
  return c;
}
['map_palace', 'map_shrine'].forEach(n => { const i = new Image(); i.src = 'img/' + n + '.webp'; IMG[n] = i; });
// ----- 채팅 로그 -----
function log(type, who, text) { const l = $('#log'); if (!l) return; const d = document.createElement('div'); d.className = type; d.innerHTML = `<em>${who}</em>${String(text).replace(/<[^>]+>/g, '')}`; l.appendChild(d); while (l.children.length > 40) l.firstChild.remove(); }
const _toast = toast; toast = (h, ms) => { _toast(h, ms); log('sys', '시스템', h); };
document.querySelectorAll('.tabs b').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs b').forEach(x => x.classList.toggle('on', x === b)); $('#log').className = 'f-' + b.dataset.t; });
// ----- 지도 불러오기 -----
function loadScene(id, at) {
  M = MAPS[id](); G.scene = id; save();
  solidG = new Uint8Array(M.W * M.H);
  for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) if (TILE_SOLID.has(M.t[y][x])) solidG[y * M.W + x] = 1;
  for (const o of M.objs) for (const s of [o.solid, o.sol2]) if (s) for (let y = s[1]; y < s[1] + s[3]; y++) for (let x = s[0]; x < s[0] + s[2]; x++) if (x >= 0 && y >= 0 && x < M.W && y < M.H) solidG[y * M.W + x] = 1;
  ground = M.bg ? bgGround(M) : drawGround(M); buildMini();
  P = { x: (at || M.start).x, y: (at || M.start).y, dir: 'up', f: 0, step: 0, moving: false, r: .32, inv: 0, roll: 0, rvx: 0, rvy: 0, atkAnim: 0, guard: 0, ring: 0, spring: 0, flash: 0 };
  ents = (M.npcs || []).map(n => Object.assign({ dir: 'down', f: 0, step: 0, home: { x: n.x, y: n.y }, wt: 0 }, n));
  foes = []; shots = []; areas = []; parts = []; nums = []; fxs = [];
  if (!F('killed_' + id)) for (const f of (M.foes || [])) spawnFoe(f.k, f.x, f.y);
  // 진행에 따라 보이는 것
  for (const o of M.objs) {
    if (o.k === 'portal' && o.forest) o.hidden = !F('trained');
    if (o.chest && F(`chest_${id}_${o.x}_${o.y}`)) o.open = 1;
    if (o.herb && F(`herb_${id}_${o.x}_${o.y}`)) o.got = 1;
    if (o.dummy) { o.hp = 40; if (F('trained')) o.down = 1; }
    if (o.house && G.house === o.house) o.mine = 1;
  }
  if (id === 'village' && F('gateOpen')) { M.objs.push({ k: 'portal', x: 15, y: 3, w: 4, h: 2, rgb: '255,220,140', light: 1 }); const h = ents.find(e => e.id === 'halmi'); if (h) h.hidden = 0; }
  if (id === 'forest' && F('tigerDown')) foes = foes.filter(f => f.k !== 'tiger');
  music(M.music);
  updateHUD(); updatePad();
  setTimeout(() => onEnter(id), 60);
}
const solidAt = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return true; return !!solidG[ty * M.W + tx]; };
function moveEnt(e, dx, dy, r) {
  const nx = e.x + dx; if (!solidAt(nx + Math.sign(dx) * r, e.y - r * .7) && !solidAt(nx + Math.sign(dx) * r, e.y + r * .7)) e.x = nx;
  const ny = e.y + dy; if (!solidAt(e.x - r * .7, ny + Math.sign(dy) * r) && !solidAt(e.x + r * .7, ny + Math.sign(dy) * r)) e.y = ny;
}
const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
function losClear(ax, ay, bx, by) { const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d * 3); for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; } return true; }

// ----- 대화 -----
let dlgRes = null, dlgFull = '', dlgShown = 0, dlgTyping = false, choiceRes = null;
function say(who, text) {
  return new Promise(res => {
    state = 'talk'; dlgRes = res; dlgFull = text.replace(/\{name\}/g, G ? G.name : ''); dlgShown = 0; dlgTyping = true;
    $('#dWho').textContent = who; { const pt = $('#dPort'), me = G && who === G.name; pt.classList.toggle('hide', !me); if (me) pt.src = 'img/' + (G.gender === 'f' ? 'f' : 'm') + '_port.png'; $('#dlg').classList.toggle('wp', !!me); } $('#dTxt').textContent = ''; $('#dlg').classList.remove('hide'); pluck(392, 0, .03); log(who === G.name ? 'q' : 'np', who, dlgFull.replace(/\n/g, ' ').slice(0, 60) + (dlgFull.length > 60 ? '…' : ''));
  });
}
function advanceDlg() {
  if (choiceRes) return;
  if (dlgTyping) { dlgShown = dlgFull.length; dlgTyping = false; $('#dTxt').textContent = dlgFull; return; }
  $('#dlg').classList.add('hide'); const r = dlgRes; dlgRes = null; state = 'play'; r && r();
}
$('#dlg').addEventListener('pointerdown', e => { e.stopPropagation(); advanceDlg(); });
function choose(opts) {
  return new Promise(res => {
    state = 'talk'; choiceRes = res; const c = $('#choice');
    c.innerHTML = opts.map((o, i) => `<button data-i="${i}" ${o.dis ? 'disabled style="opacity:.45"' : ''}>${o.t}${o.s ? `<small>${o.s}</small>` : ''}</button>`).join(''); c.classList.remove('hide');
    c.querySelectorAll('button').forEach(b => b.onpointerdown = e => { e.stopPropagation(); if (b.disabled) return; c.classList.add('hide'); choiceRes = null; state = 'play'; pluck(523, 0, .04); res(+b.dataset.i); });
  });
}
async function talk(lines) { scriptBusy = true; for (const [w, t] of lines) await say(w, t); scriptBusy = false; state = 'play'; }
function quest(t) { if (t && t !== G.quest) log('q', '퀘스트', '메인 퀘스트 갱신: ' + t); G.quest = t; save(); updateHUD(); }
function questTarget() {
  const s = G.scene;
  if (s === 'village') { if (!F('mom')) return ents.find(e => e.id === 'mom'); return { x: 17, y: F('gateOpen') ? 4 : 7 }; }
  if (s === 'market') { if (!G.weapon) return { x: 8.5, y: 8.5 }; return { x: 15, y: 2.5 }; }
  if (s === 'palace') { const mr = M.objs.find(o => o.k === 'mirror'), pt = M.objs.find(o => o.forest); if (!G.house) return F('metHun') ? { x: mr.x + 1, y: mr.y + 1.5 } : ents.find(e => e.id === 'hun'); if (!F('trained')) { const d = M.objs.find(o => o.dummy && !o.down); return d ? { x: d.x + .5, y: d.y + .5 } : ents.find(e => e.id === 'hun'); } return { x: pt.x + pt.w / 2, y: pt.y + 1 }; }
  if (s === 'forest') { if (!F('tigerDown')) { const tg = foes.find(f => f.k === 'tiger'); return tg || { x: 30, y: 6 }; } return { x: 29.5, y: 2.5 }; }
  return null;
}

// ----- 장면 대본 -----
async function onEnter(id) {
  if (id === 'village' && !F('intro')) {
    banner('PROLOGUE', '까치가 물고 온 편지', '정월대보름 밤 · 달골 마을');
    await wait(2400);
    const mg = { id: 'magpie', k: 'magpie', x: P.x + 9, y: P.y - 8 }; ents.push(mg);
    await flyTo(mg, P.x + 1, P.y - 1.2, 1.6);
    await talk([['까치', '깍깍! 네가 {name}(이)지? 달이 이렇게 밝은 밤엔 꼭 편지가 오는 법이야!'],
      ['📜 입학첩', '“그대의 눈에 보이는 세상이 전부가 아니니,\n달이 가장 높이 뜨는 밤 오래된 당산나무를 찾아오라.”\n— 사신궁(四神宮)'],
      ['까치', '난 깍순이! 오늘부터 네 길잡이야. 노란 화살표 보이지? 그쪽으로만 가면 돼.'],
      ['까치', '아, 떠나기 전에 어머니께 인사는 하고 가야지!']]);
    mg.follow = 1; setF('intro'); quest('어머니께 인사드리기'); stat('start');
  } else if (id === 'village') { ents.push({ id: 'magpie', k: 'magpie', x: P.x + 1, y: P.y - 1, follow: 1 }); }
  if (id === 'market') {
    ents.push({ id: 'magpie', k: 'magpie', x: P.x + 1, y: P.y - 1, follow: 1 });
    if (!F('marketIn')) { banner('도깨비 장터', '자정에만 열리는 시장', '인간계와 신령계 사이'); await wait(2200);
      await talk([['까치', '여기가 그 유명한 도깨비 장터야! 자정에만 열리고, 해 뜨면 감쪽같이 사라지지.'], ['까치', '맨손으로 사신궁에 갈 순 없어. 왼쪽 위 뚝딱이 노점에서 법구부터 사자!']]);
      setF('marketIn'); quest('뚝딱이 노점에서 법구 고르기'); }
  }
  if (id === 'palace') {
    ents.push({ id: 'magpie', k: 'magpie', x: P.x + 1, y: P.y - 1, follow: 1 });
    if (!F('palaceIn')) { state = 'talk'; await showArt('world', '구름 위의 사신궁', '인간계 위, 구름 사이에 떠 있는 네 학당의 섬들. 역사가 기록하지 않은 또 하나의 조선.', false); state = 'play'; banner('CHAPTER 1', '신수의 선택', '사신궁 · 네 학당이 모이는 곳'); await wait(2400);
      await talk([['까치', '와아… 저게 사신궁이야. 백호·청룡·현무·주작, 네 신수가 지키는 학당이 모여 있어.'], ['까치', '저기 갓 쓴 분이 청송 훈장님. 인사부터 드리자!']]);
      setF('palaceIn'); quest('청송 훈장님께 인사하기'); }
    else if (G.house && !F('trained')) quest('동쪽 수련장: 허수아비 쓰러뜨리기');
    else if (F('trained')) quest('남쪽 초록 문으로 금단의 숲에 가기');
  }
  if (id === 'forest') {
    ents.push({ id: 'magpie', k: 'magpie', x: P.x + 1, y: P.y - 1, follow: 1 });
    if (!F('forestIn')) { banner('CHAPTER 2', '금단의 숲', '도깨비왕이 숨은 곳'); await wait(2400);
      await talk([['까치', '…조심해. 여긴 요괴들 소굴이야. 도깨비불, 꼬마 도깨비, 그리고 얼굴 없는 달걀귀신까지.'], ['까치', '숲 제일 깊은 곳 붉은 문 너머에 도깨비왕이 있어. 문 앞은 하얀 짐승, 장산범이 지키고 있대.'], ['까치', '위험하면 회피! 구르는 순간엔 아무것도 너를 못 건드려.']]);
      setF('forestIn'); }
    quest(F('tigerDown') ? '붉은 문으로 들어가 도깨비왕과 맞서기' : '숲 깊은 곳 붉은 문을 찾아라 (장산범 주의)');
  }
  if (id === 'boss') {
    quest('도깨비왕을 쓰러뜨려라');
    const k = foes.find(f => f.k === 'king'); if (k) k.sleep = 1;
    await wait(500);
    await talk([['도깨비왕', '흐흐흐… 어디서 인간 냄새가 나나 했더니, 사신궁 병아리로구나!'], ['도깨비왕', '내 금방망이 한 번이면 금도 나오고 은도 나오지. 너 같은 꼬마는 납작해지고! 금 나와라, 뚝딱!'], [G.name, '(신수님… 힘을 빌려주세요!)']]);
    if (k) k.sleep = 0; banner('BOSS', '도깨비왕', '금방망이의 주인');
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
function flyTo(e, x, y, sec) { return new Promise(res => { const sx = e.x, sy = e.y, st = performance.now(); e.flying = 1; const step = () => { const k = Math.min(1, (performance.now() - st) / (sec * 1000)); e.x = sx + (x - sx) * k; e.y = sy + (y - sy) * k - Math.sin(k * Math.PI) * 1.5; if (k < 1) requestAnimationFrame(step); else { e.flying = 0; res(); } }; step(); }); }

// ----- NPC 대화 -----
async function interact(e) {
  if (e.k === 'npc_obj') return;
  e.dir = dirOf(P.x - e.x, P.y - e.y);
  switch (e.id) {
    case 'mom':
      if (!F('mom')) { await talk([['어머니', '{name}아, 이 밤에 어딜 그리 서두르니? …까치가 편지를 물고 왔다고?'], ['어머니', '(한참 편지를 보다가) …네 할아버지도 이런 편지를 받았었지. 돌아오지 않을 줄 알았는데, 웃으며 돌아오셨단다.'], ['어머니', '이거 받아라. 엽전 50냥. 그리고 부럼도 하나. 액운은 다 깨물어 버리고 오너라.']]);
        G.coin += 50; setF('mom'); toast('🪙 엽전 50냥을 받았다'); quest('북쪽 오래된 당산나무로 가기'); }
      else await talk([['어머니', '몸조심하고, 배고프면 꼭 뭐라도 사 먹고.']]);
      break;
    case 'kid': await talk([['동네 꼬마', '형아, 아까 당산나무가 반짝반짝 빛났어! 진짜야! 할머니가 그러는데 거긴 도깨비 문이래!']]); break;
    case 'halmi': await talk([['당산할미', '허허, 또 한 아이가 왔구나. 이 나무는 오백 년 동안 두 세상을 이어왔단다.']]); break;
    case 'ttuk':
      if (!G.weapon) {
        await talk([['뚝딱이', '어서 옵쇼! 인간 손님은 백 년 만이네? 법구 하나에 30냥! 깎아주는 건 없어, 대신 손님 운을 보고 골라줄 수는 있지.']]);
        const keys = Object.keys(WEAPONS), i = await choose(keys.map(k => ({ t: `${WEAPONS[k].ic} ${WEAPONS[k].n} — 30냥`, s: WEAPONS[k].d, dis: G.coin < 30 })).concat([{ t: '다음에 올게요' }]));
        if (i < keys.length) { G.coin -= 30; G.weapon = keys[i]; save(); for (let j = 0; j < 20; j++) part(P.x, P.y - .5, rnd(-3, 3), rnd(-4, -1), '#ffd977', .6, 3); pluck(523, 0, .06); pluck(784, .1, .05);
          await talk([['뚝딱이', `나와라 뚝딱! ${WEAPONS[G.weapon].n}! 좋은 눈이야. 손에 착 붙지?`], ['까치', `${isTouch ? '오른쪽 아래 빨간 「공격」 버튼' : 'J 키'}로 휘둘러 봐! 이제 북쪽 빛나는 문으로 가자.`]]);
          quest('북쪽 빛나는 문으로 사신궁에 가기'); updatePad(); stat('weapon', G.weapon); }
      } else await talk([['뚝딱이', '그 법구 아껴 쓰라고! 부서지면 고쳐는 줄게. 공짜는 아니지만, 흐흐.']]);
      break;
    case 'yak': {
      await talk([['약장수 도깨비', '영약 사시오, 영약! 한 병이면 죽다가도 벌떡! 한 병 10냥!']]);
      const i = await choose([{ t: '🧪 영약 1병 — 10냥', s: '체력이 30% 아래로 떨어지면 자동으로 마셔요', dis: G.coin < 10 }, { t: '괜찮아요' }]);
      if (i === 0) { G.coin -= 10; G.potion++; save(); toast('🧪 영약 +1'); updateHUD(); }
      break; }
    case 'ssir': await talk([['씨름꾼 도깨비', '나랑 씨름 한 판? …아냐, 인간은 약해서 재미없어. 사신궁 다녀오면 그때 붙자고!']]); break;
    case 'egg': await talk([['알 파는 도깨비', '신수의 알이 궁금해? 이건 학당 학생만 받을 수 있는 물건이야. 아무나 품으면 알이 안 깨거든.']]); break;
    case 'hun':
      if (!F('metHun')) { await talk([['청송 훈장', '허허, 달골 마을 {name}이로구나. 까치가 제대로 찾아왔군.'], ['청송 훈장', '이곳 사신궁에는 네 학당이 있다. 서쪽 백호, 동쪽 청룡, 북쪽 현무, 남쪽 주작.'], ['청송 훈장', '학당은 네가 고르는 것이 아니라, 신수가 너를 고른다. 가운데 신수의 거울 앞에 서 보거라.']]); setF('metHun'); quest('가운데 「신수의 거울」 앞에 서기'); }
      else if (G.house && !F('trained')) await talk([['청송 훈장', '동쪽 수련장의 허수아비들을 쓰러뜨려 보아라. 술법도 꼭 써 보고.']]);
      else if (F('trained')) await talk([['청송 훈장', '금단의 숲에서 도깨비왕이 날뛰고 있다. 요괴들을 몰고 마을까지 내려올 기세야. 조심하거라.']]);
      else await talk([['청송 훈장', '거울 앞에 서 보거라.']]);
      break;
    case 'sun': await talk([['주작학당 선배', '신입생이구나? 학당 대항전에서 만나면 안 봐준다! …그래도 길 모르면 물어봐.']]); break;
    case 'kid2': await talk([['백호학당 교관', F('trained') ? '허수아비를 다 쓰러뜨렸다고? 신입생치곤 손이 맵구나!' : '수련장은 이쪽이다. 허수아비는 맞아도 아파하지 않으니 마음껏 쳐라!']]); break;
    case 'mate': await talk([['해솔', G.house ? `너 ${HOUSE[G.house].n}이야? 나랑 다르네! 그래도 같이 살아남자.` : '나도 오늘 왔어. 거울 앞에 서는 거… 좀 무섭지 않아?']]); break;
  }
}
async function mirrorScene() {
  if (G.house) { await talk([['신수의 거울', `거울 속 ${HOUSE[G.house].ic}가 조용히 너를 바라본다.`]]); return; }
  scriptBusy = true;
  await say('신수의 거울', '거울 표면이 물결치더니, 네 개의 빛이 너를 둘러싼다.\n“답하라. 너는 어떤 사람이냐.”');
  const a = await choose([{ t: '앞장서서 지키는 사람', s: '두려워도 먼저 나선다' }, { t: '멀리 보고 판단하는 사람', s: '바람처럼 자유롭게' }, { t: '곁을 돌보는 사람', s: '다친 이를 그냥 못 지나친다' }, { t: '뜨겁게 부딪히는 사람', s: '하고 싶은 건 해야 한다' }]);
  const rec = ['baekho', 'cheongryong', 'hyeonmu', 'jujak'][a];
  await say('신수의 거울', `${HOUSE[rec].ic} ${HOUSE[rec].n}의 신수가 가장 먼저 고개를 든다.\n…하지만 마지막 선택은 네 몫이다.`);
  const order = ['baekho', 'cheongryong', 'hyeonmu', 'jujak'];
  let pickH = null;
  while (!pickH) {
    const i = await choose(order.map(h => ({ t: `${HOUSE[h].ic} ${HOUSE[h].n} ${HOUSE[h].h}${h === rec ? ' · 추천' : ''}`, s: SPELLS[h].map(s => `${s.ic}${s.n}`).join(' · ') + ' — ' + { baekho: '근접·돌진·방어', cheongryong: '번개·바람·원거리', hyeonmu: '얼음·결계·치유', jujak: '화염·폭발·지속 피해' }[h] })));
    const h = order[i]; const ok = await showArt(h, `${HOUSE[h].n} ${HOUSE[h].h}`, { baekho: '서방 · 금 · 가을 — 설산과 절벽의 학당. 법검과 신체 강화.', cheongryong: '동방 · 목 · 봄 — 폭포와 구름 사이의 학당. 번개와 바람.', hyeonmu: '북방 · 수 · 겨울 — 깊은 호수와 지하 궁전. 얼음과 치유.', jujak: '남방 · 화 · 여름 — 붉은 산과 영력의 불꽃. 화염과 폭발.' }[h], true);
    if (ok) pickH = h;
  }
  G.house = pickH; save(); setF('house');
  for (const o of M.objs) if (o.house === pickH) o.mine = 1;
  const mr0 = M.objs.find(o => o.k === 'mirror'); for (let j = 0; j < 50; j++) part(mr0.x + 1, mr0.y, rnd(-5, 5), rnd(-6, -1), HOUSE[pickH].c, 1, 4);
  pluck(392, 0, .06); pluck(523, .15, .06); pluck(659, .3, .06); pluck(784, .45, .07);
  banner('입학', `${HOUSE[pickH].ic} ${HOUSE[pickH].n}`, `첫 술법: ${SPELLS[pickH].map(s => s.n).join(' · ')}`);
  await wait(2200);
  await talk([['청송 훈장', `${HOUSE[pickH].n}이라… 잘 어울리는구나. 오늘부터 너는 사신학당의 학생이다.`], ['청송 훈장', `첫 수업이다. 동쪽 수련장의 허수아비 넷을 쓰러뜨려라. ${isTouch ? '오른쪽 동그란 술법 버튼' : 'K · L 키'}로 술법을, ${isTouch ? '「회피」' : 'Space'}로 구르기를 연습하거라.`]]);
  scriptBusy = false; quest('동쪽 수련장: 허수아비 4개 쓰러뜨리기'); updatePad(); updateHUD(); stat('house', pickH);
}
function showArt(h, title, sub, ask) {
  return new Promise(res => {
    const d = document.createElement('div'); d.className = 'scr on'; d.style.zIndex = 45; d.style.padding = '16px'; d.style.background = 'rgba(5,4,10,.94)';
    d.innerHTML = `<div class="box" style="max-width:720px"><img src="img/key_${h}.webp" alt="" style="width:100%;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.6)"><h2 style="margin-top:14px">${title}</h2><p>${sub}</p>${ask ? '<button class="btn" id="artOk">이 학당으로 입학하기</button><button class="btn g" id="artNo">다시 고르기</button>' : '<button class="btn" id="artOk">계속</button>'}</div>`;
    document.body.appendChild(d);
    d.querySelector('#artOk').onclick = () => { d.remove(); res(true); };
    const no = d.querySelector('#artNo'); if (no) no.onclick = () => { d.remove(); res(false); };
  });
}

// ----- 적 -----
function spawnFoe(k, x, y) { const b = FOE[k]; const f = { k, x, y, hp: b.hp, mhp: b.hp, dir: 'down', f: 0, step: 0, t: rnd(0, 2), cd: rnd(.5, 2), st: 'idle', fz: 0, burn: 0, shock: 0, flash: 0, kb: [0, 0] }; foes.push(f); return f; }
function hurtFoe(f, dmg, el, kx, ky) {
  if (f.dead || f.fake && (f.dead = 1)) { if (f.fake) { poof(f.x, f.y, '#c9a0ff'); toast('환영이었다!'); } return; }
  let txt = '', col = '#fff';
  if (f.fz > 0 && el !== 'ice') { dmg *= 2.2; f.fz = 0; txt = '빙결 파쇄! '; col = '#bfe8ff'; for (let i = 0; i < 10; i++) part(f.x, f.y - .4, rnd(-4, 4), rnd(-4, 1), '#dff4ff', .5, 3); }
  if (f.burn > 0 && el === 'wind') { dmg *= 1.8; txt = '화염 회오리! '; col = '#ffb070'; areas.push({ x: f.x, y: f.y, r: 1.6, t: 0, delay: 0, life: .8, dmg: 10, owner: 'p', el: 'fire', kind: 'vortex' }); }
  if (f.shock > 0 && el === 'ice') { dmg *= 1.5; txt = '감전 결빙! '; col = '#aef'; }
  if (G.house === 'baekho' && P.guard > 0) dmg *= 1.1;
  dmg = Math.round(dmg * (1 + (G.lv - 1) * .08));
  if (G.house) G.sg = Math.min(100, (G.sg || 0) + dmg * .3);
  f.hp -= dmg; f.flash = .12; nums.push({ x: f.x, y: f.y - 1, t: txt + dmg, c: col, life: .9, big: !!txt });
  if (el === 'fire') f.burn = 3; if (el === 'ice') f.fz = Math.max(f.fz, el === 'ice' ? 2.2 : 0); if (el === 'shock') f.shock = .7;
  if (!FOE[f.k].boss) { const kb = el === 'wind' ? 6 : 3; f.kb = [(kx || 0) * kb, (ky || 0) * kb]; }
  noise(.06, .06, 1500); hitstop = Math.max(hitstop, txt ? .08 : .03);
  if (f.hp <= 0) killFoe(f);
}
function killFoe(f) {
  f.dead = 1; const b = FOE[f.k]; poof(f.x, f.y, f.k === 'wisp' ? '#8fd0ff' : '#ffd977');
  if (!f.minion && !f.fake) { G.dex[f.k] = (G.dex[f.k] || 0) + 1; if (F('trained') && G.sub < 5) { G.sub++; if (G.sub === 5) { G.potion += 2; G.coin += 50; banner('서브 퀘스트 완료', '요괴의 잔해 수집', '보상: 영약 2 · 엽전 50냥'); log('q', '퀘스트', '서브 퀘스트 완료! 영약 2 · 엽전 50냥'); } } }
  if (!f.minion) { gainXP(b.xp); G.coin += b.coin; G.kills++; if (b.coin) nums.push({ x: f.x, y: f.y - .6, t: `🪙+${b.coin}`, c: '#ffd977', life: 1 }); }
  if (f.k === 'tiger') { setF('tigerDown'); banner('정예 토벌', '장산범', '붉은 문이 열렸다'); quest('붉은 문으로 들어가 도깨비왕과 맞서기'); setTimeout(() => talk([['까치', '해냈다! 붉은 문이 열렸어. 그 너머가 도깨비왕의 터야… 준비되면 가자!']]), 1200); }
  if (f.k === 'king') victory();
  save(); updateHUD();
}
function gainXP(n) {
  G.xp += n; let up = false;
  while (G.xp >= G.lv * 30) { G.xp -= G.lv * 30; G.lv++; G.mhp += 15; G.mmp += 8; G.hp = G.mhp; G.mp = G.mmp; up = true; }
  if (up) { banner('LEVEL UP', `Lv.${G.lv}`, '체력·영력이 올랐다'); pluck(523, 0, .07); pluck(659, .1, .07); pluck(784, .2, .07); pluck(1046, .3, .07); }
}
function poof(x, y, c) { for (let i = 0; i < 16; i++) part(x, y - .4, rnd(-3, 3), rnd(-4, 1), c, .6, 3); }
function part(x, y, vx, vy, c, life, s) { parts.push({ x, y, vx, vy, c, life, ml: life, s: s || 2 }); }

function hurtPlayer(dmg, from) {
  if (P.inv > 0 || P.roll > 0 || state !== 'play') return;
  if (P.guard > 0) dmg *= .4;
  dmg = Math.round(dmg); G.hp -= dmg; P.inv = .8; P.flash = .2; shake = .6; nums.push({ x: P.x, y: P.y - 1, t: '-' + dmg, c: '#ff6b6b', life: .9 });
  beep(120, .25, 'sawtooth', .08); if (navigator.vibrate) navigator.vibrate(40);
  if (from) { const d = Math.hypot(P.x - from.x, P.y - from.y) || 1; moveEnt(P, (P.x - from.x) / d * .5, (P.y - from.y) / d * .5, P.r); }
  if (G.hp > 0 && G.hp < G.mhp * .3 && G.potion > 0) { G.potion--; G.hp = Math.min(G.mhp, G.hp + Math.round(G.mhp * .5)); toast('🧪 영약을 마셨다! 체력 회복'); pluck(659, 0, .05); }
  if (G.hp <= 0) dieP();
  updateHUD();
}
async function dieP() {
  state = 'dead'; G.hp = 0; updateHUD(); stat('die', G.scene);
  await wait(900);
  const d = document.createElement('div'); d.className = 'scr on'; d.innerHTML = `<div class="box"><h2>쓰러졌다…</h2><p>까치가 부리로 이마를 콕콕 쫀다.<br>“일어나! 아직 끝난 거 아니야!”</p><button class="btn" id="rv">다시 일어나기</button></div>`; document.body.appendChild(d);
  d.querySelector('#rv').onclick = () => { d.remove(); G.hp = G.mhp; G.mp = G.mmp; save(); state = 'play'; loadScene(G.scene); };
}

// ----- 공격·술법 -----
function facing() { return [Math.cos(ANG[P.dir]), Math.sin(ANG[P.dir])]; }
function aimDir() { // 가까운 적 쪽으로 살짝 보정
  let best = null, bd = 6; for (const f of foes) { if (f.dead) continue; const d = dist(f, P); if (d < bd) { bd = d; best = f; } }
  if (best) { const dx = best.x - P.x, dy = best.y - P.y, l = Math.hypot(dx, dy) || 1; const [fx, fy] = facing(); if ((dx * fx + dy * fy) / l > .2 || bd < 2) { P.dir = dirOf(dx, dy); return [dx / l, dy / l]; } }
  return facing();
}
function basicAttack() {
  if (!G.weapon) { toast('맨손으로는 요괴를 이길 수 없다. 법구가 필요해!'); return; }
  const w = WEAPONS[G.weapon]; if (CD.atk > 0) return; CD.atk = w.cd; P.atkAnim = .18;
  const [dx, dy] = aimDir();
  if (G.weapon === 'sword') { fx('fx_moon', P.x + dx * 1.1, P.y - .5 + dy * .6, 3.2, .22, { flip: dx < -.3, rot: Math.abs(dy) > .7 ? (dy > 0 ? 1.2 : -1.2) * (dx < -.3 ? -1 : 1) : 0 }); slash(P.x + dx * .9, P.y + dy * .9, 1.35, w.dmg, null, dx, dy); beep(300, .08, 'triangle', .05, 600); }
  else if (G.weapon === 'talisman') { shots.push({ x: P.x + dx * .5, y: P.y - .3 + dy * .5, vx: dx * 11, vy: dy * 11, r: .3, dmg: w.dmg, owner: 'p', life: .7, kind: 'tal' }); beep(800, .06, 'square', .03, 500); }
  else if (G.weapon === 'fan') { for (let i = -2; i <= 2; i++) { const a = Math.atan2(dy, dx) + i * .22; shots.push({ x: P.x, y: P.y - .3, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, r: .35, dmg: w.dmg * .45, owner: 'p', life: .28, kind: 'wind', el: 'wind', pierce: 1 }); } noise(.15, .05, 2500); }
  else { shots.push({ x: P.x, y: P.y - .4, vx: dx * 6, vy: dy * 6, r: .35, dmg: w.dmg, owner: 'p', life: 1.4, kind: 'orb', home: 1, heal: 2 }); pluck(880, 0, .04); }
  // 허수아비
  for (const o of M.objs) if (o.dummy && !o.down && Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y) < (G.weapon === 'sword' ? 2 : 1.6)) hitDummy(o, w.dmg);
}
function slash(x, y, r, dmg, el, dx, dy) {
  areas.push({ x, y, r, t: 0, delay: 0, life: .15, kind: 'slash', a: Math.atan2(dy, dx), owner: 'fx' });
  for (const f of foes) if (!f.dead && Math.hypot(f.x - x, f.y - y) < r + FOE[f.k].r) hurtFoe(f, dmg, el, dx, dy);
}
function hitDummy(o, dmg) { o.hp -= dmg; o.flash = .12; nums.push({ x: o.x + .5, y: o.y - .6, t: Math.round(dmg), c: '#fff', life: .7 }); noise(.05, .05, 1200); if (o.hp <= 0 && !o.down) { o.down = 1; poof(o.x + .5, o.y, '#d9c08a'); gainXP(6); checkTraining(); } }
async function checkTraining() {
  const left = M.objs.filter(o => o.dummy && !o.down).length;
  if (left) { toast(`허수아비 ${left}개 남음`); return; }
  setF('trained'); const pt = M.objs.find(o => o.forest); if (pt) pt.hidden = 0;
  await talk([['청송 훈장', '허허, 첫날치고는 제법이로구나!'], ['청송 훈장', '…헌데 큰일이 났다. 금단의 숲에서 도깨비왕이 날뛰고 있어. 내기에 진 도깨비들의 방망이를 몽땅 빼앗고, 요괴들까지 깨웠다.'], ['청송 훈장', '사신궁 학생이라면 피할 수 없는 일이지. 남쪽 초록 문으로 가거라. 깍순이가 길을 알 게다.'], ['까치', '맡겨만 주세요! 깍깍!']]);
  quest('남쪽 초록 문으로 금단의 숲에 가기');
}
function castSpell(i) {
  if (!G.house) { if (G.weapon) toast('술법은 학당에 들어가야 배울 수 있다'); return; }
  const s = SPELLS[G.house][i]; if (CD['s' + i] > 0) return; if (G.mp < s.mp) { toast('영력이 부족하다'); return; }
  G.mp -= s.mp; CD['s' + i] = s.cd; const [dx, dy] = aimDir();
  nums.push({ x: P.x, y: P.y - 1.4, t: s.n, c: HOUSE[G.house].c, life: .9, big: 1 });
  const hitD = r => { for (const o of M.objs) if (o.dummy && !o.down && Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y) < r) hitDummy(o, 25); };
  switch (s.id) {
    case 'baek': { fx('fx_tigerdash', P.x + dx * 2, P.y - .6, 6, .5, { flip: dx < 0 }); P.roll = .28; P.inv = .4; P.rvx = dx * 16; P.rvy = dy * 16; for (let k = 1; k <= 4; k++) setTimeout(() => slash(P.x, P.y, 1.3, 9, null, dx, dy), k * 60); hitD(3); noise(.2, .07, 1800); break; }
    case 'geum': { fx('fx_roar', P.x, P.y - 1.2, 5, .9); fx('fx_dome', P.x, P.y - .9, 3.6, 6, { follow: 1, alpha: .55 }); P.guard = 6; for (let j = 0; j < 20; j++) part(P.x, P.y - .4, rnd(-2, 2), rnd(-3, 0), '#e8e8f0', .7, 3); beep(220, .4, 'triangle', .06, 440); break; }
    case 'roe': { const tg = foes.filter(f => !f.dead && dist(f, P) < 7).sort((a, b) => dist(a, P) - dist(b, P)).slice(0, 3);
      for (const f of tg) { fx('fx_bolt', f.x, f.y - 1.6, 3.4, .45); hurtFoe(f, 26, 'shock'); }
      if (!tg.length) fx('fx_bolt', P.x + dx * 3, P.y + dy * 3 - 1.6, 3.4, .45); hitD(7); noise(.3, .09, 3000); beep(1200, .2, 'sawtooth', .04, 200); break; }
    case 'pung': { fx('fx_wind', P.x + dx * 1.5, P.y - .8, 4, .6); for (let k = -2; k <= 2; k++) { const a = Math.atan2(dy, dx) + k * .28; shots.push({ x: P.x, y: P.y - .3, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12, r: .4, dmg: 14, owner: 'p', life: .5, kind: 'wind', el: 'wind', pierce: 1 }); } hitD(4); noise(.25, .06, 2500); break; }
    case 'bing': { fx('fx_ice', P.x, P.y - .9, 6.5, .8); areas.push({ x: P.x, y: P.y, r: 3, t: 0, delay: 0, life: .5, kind: 'ice', owner: 'fx' }); for (const f of foes) if (!f.dead && dist(f, P) < 3 + FOE[f.k].r) hurtFoe(f, 12, 'ice'); hitD(3.2); beep(1500, .3, 'sine', .05, 600); break; }
    case 'sam': { fx('fx_spring', P.x, P.y - .8, 4, 5, { follow: 1, alpha: .8 }); P.spring = 5; areas.push({ x: P.x, y: P.y, r: 1.8, t: 0, delay: 0, life: 5, kind: 'spring', owner: 'fx' }); pluck(659, 0, .05); pluck(880, .1, .05); break; }
    case 'hwa': { shots.push({ x: P.x, y: P.y - .4, vx: dx * 9, vy: dy * 9, r: .4, dmg: 18, owner: 'p', life: .8, kind: 'fire', el: 'fire', boom: 1.8 }); beep(200, .2, 'sawtooth', .05, 90); break; }
    case 'jang': { fx('fx_jujak', P.x, P.y - 1.6, 6, 1); fx('fx_hongryeon', P.x, P.y - 1.1, 4.4, 4, { follow: 1, alpha: .6 }); P.ring = 4; noise(.4, .05, 600); break; }
  }
  updateHUD();
}

function talismanSkill() {
  if (!G.weapon) { toast('부적은 법구를 얻은 뒤에 쓸 수 있다'); return; } if (CD.f > 0) return; CD.f = 2.5; const [dx, dy] = aimDir(), a0 = Math.atan2(dy, dx);
  for (let k = -1; k <= 1; k++) { const a = a0 + k * .25; shots.push({ x: P.x, y: P.y - .4, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, r: .3, dmg: 8, owner: 'p', life: .8, kind: 'tal' }); }
  beep(800, .06, 'square', .03, 500); P.atkAnim = .18;
}
function beastCall() {
  if (!G.house) { toast('신수가 아직 잠들어 있다 — 학당에 입학하면 깨어난다'); return; } if (CD.r > 0) return;
  if (G.sg < 40) { toast('신수 게이지가 부족하다 (40 필요) — 요괴를 공격해 채우자'); return; }
  G.sg -= 40; CD.r = 6; const [dx, dy] = aimDir(), B = BEAST[G.house];
  nums.push({ x: P.x, y: P.y - 1.6, t: B.n + ' 호출!', c: HOUSE[G.house].c, life: 1, big: 1 });
  if (G.house === 'hyeonmu') { fx('fx_turtle', P.x, P.y - 1.3, 5.5, 1.3); G.hp = Math.min(G.mhp, G.hp + Math.round(G.mhp * .25)); P.guard = Math.max(P.guard, 3); for (const f of foes) if (!f.dead && dist(f, P) < 3.5 + FOE[f.k].r) hurtFoe(f, 30, 'ice'); }
  else fxs.push({ n: 'fx_' + B.call, x: P.x - dx * 2.5, y: P.y - .8 - dy * 2.5, w: 5, life: .75, ml: .75, flip: dx < 0, rot: 0, vx: dx * 15, vy: dy * 15, hit: new Set(), dmg: 38, el: B.el });
  shake = .5; noise(.3, .08, 900); beep(180, .4, 'sawtooth', .05, 500); updateHUD();
}
function ultimate() {
  if (!G.house) { toast('궁극기는 신수와 계약한 뒤에 쓸 수 있다'); return; }
  if (G.sg < 100) { toast('신수 게이지가 가득 차야 궁극기를 쓸 수 있다'); return; }
  G.sg = 0; const U = BEAST[G.house].ult;
  fx('fx_' + U.fx, P.x, P.y - 1.8, 10, 1.6); banner('궁극기', U.n, HOUSE[G.house].n + '의 신수가 강림한다'); shake = 1.2; hitstop = .15;
  for (let i = 0; i < 40; i++) part(P.x + rnd(-5, 5), P.y + rnd(-4, 3), rnd(-3, 3), rnd(-6, -1), HOUSE[G.house].c, 1, 4);
  setTimeout(() => { for (const f of foes) if (!f.dead && dist(f, P) < 7.5) hurtFoe(f, 90, U.el, 0, 0); if (G.house === 'hyeonmu') { G.hp = G.mhp; P.guard = 5; } if (G.house === 'baekho') P.guard = 4; updateHUD(); }, 350);
  noise(.6, .12, 400); beep(110, .8, 'sawtooth', .07, 330); pluck(523, .2, .07); pluck(784, .35, .07);
}
// ----- 메뉴 -----
function openMenu(m) {
  if (state !== 'play') return; state = 'menu'; const B = G.house ? BEAST[G.house] : null; let t = '', h = '';
  const row = (ic, b, sm, bg) => `<div class="mrow"><div class="ic" ${bg ? `style="background-image:url(img/${bg}.png)"` : ''}>${bg ? '' : ic}</div><div><b>${b}</b><small>${sm}</small></div></div>`;
  if (m === 'bag') { t = '🎒 가방'; h = row(G.weapon ? WEAPONS[G.weapon].ic : '✋', G.weapon ? WEAPONS[G.weapon].n : '맨손', G.weapon ? WEAPONS[G.weapon].d : '도깨비 장터에서 법구를 사자') + row('🪙', `엽전 ${G.coin}냥`, '장터에서 영약·법구를 살 수 있다') + row('🧪', `영약 ${G.potion}병`, '체력이 30% 아래로 떨어지면 자동으로 마신다') + row('🌿', `약초 ${G.herb}개`, '주우면 체력 +20') + row('📜', '사신궁 입학첩', '까치가 물고 온 편지. “달이 가장 높이 뜨는 밤…”'); }
  if (m === 'spell') { t = '📖 술법'; h = G.house ? SPELLS[G.house].map((s, i) => row(s.ic, `[${'QE'[i]}] ${s.n} · 영력 ${s.mp}`, `${s.d} · 재사용 ${s.cd}초`, 'fx_' + SFX[s.id])).join('') : row('🔒', '학당 술법', '사신궁에서 학당에 입학하면 배운다');
    h += row('', '[F] 부적 던지기', '영력 없이 부적 세 장을 부채꼴로 던진다 · 재사용 2.5초', 'talisman') + row('🐾', `[R] 신수 호출 · 게이지 40`, B ? `${B.n}가 달려나가 앞의 요괴를 휩쓴다` : '학당 입학 후 해금', B ? 'fx_' + B.call : '') + row('✨', `[T] 궁극기 · 게이지 100`, B ? `${B.ult.n} — 주변 모든 요괴에게 큰 피해` : '학당 입학 후 해금', B ? 'fx_' + B.ult.fx : ''); }
  if (m === 'beast') { t = '🦊 신수'; h = B ? `<img src="img/key_${G.house}.webp" style="width:100%;border-radius:10px;margin-bottom:8px">` + row(B.ic, `${HOUSE[G.house].n}의 ${B.n}`, `신수 게이지 ${Math.floor(G.sg)}/100 — 요괴를 공격하면 차오른다.<br>R: 신수 호출(40) · T: ${B.ult.n}(100)${F('cleared') ? '<br>도깨비왕이 건넨 알에서 태어나 어깨 위에 함께 있다.' : ''}`, 'fx_' + B.ult.fx) : row('🥚', '아직 신수가 없다', '사신궁 「신수의 거울」 앞에 서면 신수가 너를 고른다.'); }
  if (m === 'dex') { t = '📜 요괴 도감'; h = '<div class="mgrid">' + Object.keys(FOE).map(k => { const n = G.dex[k] || 0; return `<div class="${n ? '' : 'no'}"><span>${n ? FOE_IC[k] : '❔'}</span>${n ? FOE[k].n : '???'}<br><small>${n ? n + '마리 토벌' : '미발견'}</small></div>`; }).join('') + '</div>'; }
  if (m === 'set') { t = '⚙️ 설정'; const on = !store.get('mute', 0); h = `<button class="mbtn" id="mSnd">소리: ${on ? '켜짐 🔊' : '꺼짐 🔇'}</button>` + row('⌨️', '조작법', 'PC: WASD 이동 · J/클릭 공격 · Space 회피 · E 상호작용<br>Q·E 술법 · F 부적 · R 신수 호출 · T 궁극기<br>I 가방 · K 술법 · L 신수 · N 도감 · Esc 설정<br>모바일: 화면 왼쪽을 끌어 이동, 오른쪽 버튼') + `<button class="mbtn" id="mReset">처음부터 다시 하기</button>`; }
  $('#mpTitle').textContent = t; $('#mpBody').innerHTML = h; $('#menuP').classList.remove('hide');
  const sb = $('#mSnd'); if (sb) sb.onclick = () => { const mu = !store.get('mute', 0); store.set('mute', mu ? 1 : 0); applyMute(); closeMenu(); openMenu('set'); };
  const rb = $('#mReset'); if (rb) rb.onclick = () => { if (rb.dataset.ok) { store.set('save', null); location.reload(); } else { rb.dataset.ok = 1; rb.textContent = '정말요? 한 번 더 누르면 처음부터 시작합니다'; } };
}
function closeMenu() { $('#menuP').classList.add('hide'); if (state === 'menu') state = 'play'; clearPress(); }
function applyMute() { try { ac(); if (master) master.gain.value = store.get('mute', 0) ? 0 : .6; } catch (e) {} }
$('#mpX').onclick = closeMenu; $('#menuP').addEventListener('pointerdown', e => { if (e.target.id === 'menuP') closeMenu(); });
document.querySelectorAll('.menu button').forEach(b => b.onclick = () => openMenu(b.dataset.m));
// ----- 미니맵 -----
let mini = null, mmTick = 0;
const MMC = { G: '#3f6e3c', F: '#24442c', D: '#7d6c4c', P: '#8c867a', N: '#6e6a66', S: '#a39380', W: '#2c5a8c', B: '#5c4a38', X: '#1a1a1a' };
function buildMini() {
  mini = document.createElement('canvas'); mini.width = M.W * 4; mini.height = M.H * 4; const g = mini.getContext('2d');
  if (M.bg) { const im = IMG[M.bg]; if (ok(im)) g.drawImage(im, 0, 0, mini.width, mini.height); else { g.fillStyle = '#333'; g.fillRect(0, 0, mini.width, mini.height); } return; }
  for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) { g.fillStyle = MMC[M.t[y][x]] || '#444'; g.fillRect(x * 4, y * 4, 4, 4); }
  for (const o of M.objs) { if (o.k === 'portal' || o.herb) continue; const s = o.solid; if (!s) continue; g.fillStyle = (o.k === 'pine' || o.k === 'tree') ? '#152a18' : '#2a2030'; g.fillRect(s[0] * 4, s[1] * 4, s[2] * 4, s[3] * 4); }
}
function drawMini() {
  const c = $('#mm'); if (!c || !mini || !P) return; const sz = c.clientWidth || 88; if (c.width !== sz * DPR) { c.width = c.height = sz * DPR; }
  const g = c.getContext('2d'), sc = sz / 34 * DPR; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b1410'; g.fillRect(0, 0, c.width, c.height);
  g.setTransform(sc, 0, 0, sc, c.width / 2 - P.x * sc, c.height / 2 - P.y * sc); g.imageSmoothingEnabled = false; g.drawImage(mini, 0, 0, M.W, M.H);
  const dot = (x, y, col, r) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  for (const o of M.objs) if (o.k === 'portal' && !o.hidden) dot(o.x + o.w / 2, o.y + o.h / 2, '#7ad0ff', .9);
  for (const e of ents) if (!e.hidden && e.k !== 'magpie') dot(e.x, e.y, '#ffd977', .55);
  for (const f of foes) if (!f.dead) dot(f.x, f.y, FOE[f.k].boss || FOE[f.k].elite ? '#ff3a3a' : '#ff7a6a', FOE[f.k].boss ? 1.2 : .45);
  const tg = questTarget(); if (tg) { g.fillStyle = '#ffe14a'; g.font = '2.2px sans-serif'; g.textAlign = 'center'; g.fillText('★', tg.x, tg.y + .8); }
  g.save(); g.translate(P.x, P.y); g.rotate(ANG[P.dir] + Math.PI / 2); g.fillStyle = '#ffe14a'; g.strokeStyle = '#000'; g.lineWidth = .2; g.beginPath(); g.moveTo(0, -1.1); g.lineTo(.8, .8); g.lineTo(0, .4); g.lineTo(-.8, .8); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function questProg() {
  const s = G.scene;
  if (s === 'palace' && G.house && !F('trained')) { const d = M.objs.filter(o => o.dummy), n = d.filter(o => o.down).length; return `☐ 허수아비 쓰러뜨리기 (${n}/${d.length || 4})`; }
  if (s === 'forest') return F('tigerDown') ? '☑ 장산범 토벌 (1/1)<br>☐ 붉은 문 너머로' : '☐ 장산범 토벌 (0/1)';
  if (s === 'boss') { const k = foes.find(f => f.k === 'king'); return k ? `☐ 도깨비왕 처치 · 남은 체력 ${Math.max(0, Math.round(k.hp / k.mhp * 100))}%` : '☑ 도깨비왕 처치'; }
  if (s === 'market' && !G.weapon) return '☐ 법구 구입 (엽전 30냥)';
  return '';
}
// ----- 업데이트 -----
function update(dt) {
  now += dt;
  if (hitstop > 0) { hitstop -= dt; return; }
  for (const k in CD) CD[k] = Math.max(0, CD[k] - dt);
  G.mp = Math.min(G.mmp, G.mp + dt * 4);
  if (P.spring > 0) { P.spring -= dt; G.hp = Math.min(G.mhp, G.hp + dt * 9); }
  P.inv = Math.max(0, P.inv - dt); P.flash = Math.max(0, P.flash - dt); P.atkAnim = Math.max(0, P.atkAnim - dt); P.guard = Math.max(0, P.guard - dt);
  // 이동
  const [mx, my] = state === 'play' ? moveVec() : [0, 0];
  if (P.roll > 0) { P.roll -= dt; moveEnt(P, P.rvx * dt, P.rvy * dt, P.r); }
  else if (mx || my) { const sp = 4.3; moveEnt(P, mx * sp * dt, my * sp * dt, P.r); P.dir = dirOf(mx, my); P.moving = true; P.step += dt * 8; } else P.moving = false;
  P.f = P.moving ? Math.floor(P.step) % 2 : 0;
  if (state === 'play' && !scriptBusy) {
    // 상호작용 대상
    const near = nearInteract();
    if (took('j') || took('click') || took('enter')) { if (near) doInteract(near); else basicAttack(); }
    if (took('e')) { if (near) doInteract(near); else castSpell(1); }
    if (took('q')) castSpell(0); if (took('r')) beastCall(); if (took('f')) talismanSkill(); if (took('t')) ultimate();
    for (const [k, m] of [['i', 'bag'], ['k', 'spell'], ['l', 'beast'], ['n', 'dex'], ['escape', 'set']]) if (took(k)) openMenu(m);
    if (took(' ') && CD.dodge <= 0 && !P.roll) { const [dx, dy] = (mx || my) ? [mx, my] : facing(); const l = Math.hypot(dx, dy) || 1; P.roll = .24; P.inv = .3; P.rvx = dx / l * 12; P.rvy = dy / l * 12; CD.dodge = .6; noise(.12, .04, 900); }
  } else clearPress();
  // 화염장막
  if (P.ring > 0) { P.ring -= dt; if (Math.random() < dt * 30) part(P.x + Math.cos(now * 8) * 1.6, P.y + Math.sin(now * 8) * 1.6, 0, -1, '#ff8a3a', .4, 3); for (const f of foes) if (!f.dead && dist(f, P) < 1.9 + FOE[f.k].r && (f.ringT = (f.ringT || 0) - dt) <= 0) { f.ringT = .35; hurtFoe(f, 9, 'fire'); } }
  // NPC
  for (const e of ents) {
    if (e.k === 'magpie') { if (e.follow && !e.flying) { const tx = P.x + 1.1, ty = P.y - 1.4 + Math.sin(now * 3) * .2; e.x += (tx - e.x) * Math.min(1, dt * 3); e.y += (ty - e.y) * Math.min(1, dt * 3); } continue; }
    if (e.wander && state === 'play') { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1.5, 3.5); e.tx = e.home.x + rnd(-2, 2); e.ty = e.home.y + rnd(-1.5, 1.5); } if (e.tx != null) { const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy); if (d > .1) { moveEnt(e, dx / d * 1.2 * dt, dy / d * 1.2 * dt, .3); e.dir = dirOf(dx, dy); e.step += dt * 6; e.f = Math.floor(e.step) % 2; } else e.f = 0; } }
  }
  // 적
  for (const f of foes) if (!f.dead) foeAI(f, dt);
  foes = foes.filter(f => !f.dead || f.k === 'king' && false);
  // 투사체
  for (const s of shots) {
    s.life -= dt; if (s.home) { const tg = nearestFoe(s, 5); if (tg) { const dx = tg.x - s.x, dy = tg.y - s.y, l = Math.hypot(dx, dy) || 1; s.vx += dx / l * 30 * dt; s.vy += dy / l * 30 * dt; const sp = Math.hypot(s.vx, s.vy); if (sp > 8) { s.vx *= 8 / sp; s.vy *= 8 / sp; } } }
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (solidAt(s.x, s.y + .3)) { s.life = 0; if (s.boom) boom(s); }
    if (s.owner === 'p') { for (const f of foes) { if (f.dead || (s.hit && s.hit.has(f))) continue; if (Math.hypot(f.x - s.x, f.y - .3 - s.y) < s.r + FOE[f.k].r) { const l = Math.hypot(s.vx, s.vy) || 1; if (s.boom) { boom(s); s.life = 0; break; } hurtFoe(f, s.dmg, s.el, s.vx / l, s.vy / l); if (s.heal) G.hp = Math.min(G.mhp, G.hp + s.heal); if (s.pierce) { (s.hit = s.hit || new Set()).add(f); } else { s.life = 0; break; } } }
      for (const o of M.objs) if (o.dummy && !o.down && Math.hypot(o.x + .5 - s.x, o.y + .2 - s.y) < .6 && !(s.hitD && s.hitD.has(o))) { hitDummy(o, s.dmg); (s.hitD = s.hitD || new Set()).add(o); if (!s.pierce) s.life = 0; } }
    else if (Math.hypot(P.x - s.x, P.y - .3 - s.y) < s.r + P.r) { hurtPlayer(s.dmg, s); s.life = 0; }
    if (s.kind === 'fire' && Math.random() < .5) part(s.x, s.y, rnd(-1, 1), rnd(-1, 0), '#ffb040', .3, 3);
  }
  shots = shots.filter(s => s.life > 0);
  // 범위 공격(예고 → 피해)
  for (const a of areas) {
    a.t += dt;
    if (a.owner === 'e' && !a.done && a.t >= a.delay) { a.done = 1; shake = Math.max(shake, .5); noise(.18, .08, 300); if (Math.hypot(P.x - a.x, P.y - a.y) < a.r) hurtPlayer(a.dmg, a); for (let i = 0; i < 10; i++) part(a.x + rnd(-a.r, a.r) * .6, a.y + rnd(-a.r, a.r) * .4, rnd(-2, 2), rnd(-3, 0), a.col || '#d9b05a', .5, 3); }
    if (a.owner === 'p' && a.kind === 'vortex') for (const f of foes) if (!f.dead && dist(f, a) < a.r && (f.vT = (f.vT || 0) - dt) <= 0) { f.vT = .3; hurtFoe(f, a.dmg, 'fire'); }
  }
  areas = areas.filter(a => a.t < (a.life != null ? a.life : a.delay + .35));
  for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 6 * dt; }
  parts = parts.filter(p => p.life > 0);
  for (const e of fxs) { e.life -= dt; if (e.follow) { e.x = P.x; e.y = P.y; }
    if (e.vx || e.vy) { e.x += e.vx * dt; e.y += e.vy * dt; for (const f of foes) if (!f.dead && !e.hit.has(f) && Math.hypot(f.x - e.x, f.y - (e.y + .8)) < 1.7 + FOE[f.k].r) { e.hit.add(f); hurtFoe(f, e.dmg, e.el, Math.sign(e.vx), Math.sign(e.vy)); } } }
  fxs = fxs.filter(e => e.life > 0);
  for (const n of nums) { n.life -= dt; n.y -= dt * .9; }
  nums = nums.filter(n => n.life > 0);
  for (const o of M.objs) if (o.flash) o.flash = Math.max(0, o.flash - dt);
  // 줍기
  for (const o of M.objs) {
    if (o.herb && !o.got && Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y) < .8) { o.got = 1; setF(`herb_${M.id}_${o.x}_${o.y}`); G.herb++; G.hp = Math.min(G.mhp, G.hp + 20); toast('🌿 약초! 체력 +20'); pluck(784, 0, .04); }
  }
  // 출구
  for (const ex of M.exits) if (P.x > ex.x && P.x < ex.x + ex.w && P.y > ex.y && P.y < ex.y + ex.h + .4) {
    if (!ex.need || F(ex.need) || (ex.need === 'weapon' && G.weapon)) { fadeTo(ex.to); return; }
    if (now - exitMsgT > 3) { exitMsgT = now; toast(ex.msg, 2400); }
    moveEnt(P, 0, .6, P.r);
  }
  // 마을: 당산나무 앞
  if (M.id === 'village' && F('mom') && !F('gateOpen') && P.y < 9.2 && Math.abs(P.x - 17) < 4 && !scriptBusy) halmiScene();
  shake = Math.max(0, shake - dt * 3);
  if (Math.random() < dt * 4) updateHUD();
}
async function halmiScene() {
  scriptBusy = true; const h = ents.find(e => e.id === 'halmi'); if (h) { h.hidden = 0; for (let i = 0; i < 24; i++) part(h.x, h.y - .5, rnd(-2, 2), rnd(-3, 0), '#fff4c0', .8, 3); }
  pluck(659, 0, .05); pluck(880, .2, .05);
  await talk([['당산할미', '허허, 왔구나. 까치가 물고 간 편지의 주인이.'], ['당산할미', '사람들은 이 나무를 그저 마을 지킴이로 알지. 허나 오백 년 동안 이 뿌리는 두 세상을 이어왔단다. 역사가 적지 않은 또 하나의 조선과.'], ['당산할미', '금줄 아래로 지나가거라. 문 너머는 도깨비 장터. 거기서 법구를 마련해 사신궁으로 가면 된다.'], ['까치', '열렸다! 빛나는 문으로 가자, {name}!']]);
  setF('gateOpen'); M.objs.push({ k: 'portal', x: 15, y: 3, w: 4, h: 2, rgb: '255,220,140', light: 1 }); quest('당산나무 아래 빛나는 문으로 들어가기'); scriptBusy = false;
}
function nearestFoe(s, r) { let b = null, bd = r; for (const f of foes) { if (f.dead || f.fake) continue; const d = Math.hypot(f.x - s.x, f.y - s.y); if (d < bd) { bd = d; b = f; } } return b; }
function boom(s) { areas.push({ x: s.x, y: s.y + .3, r: s.boom, t: 0, delay: 0, life: .35, kind: 'boom', owner: 'fx' }); fx('fx_hongryeon', s.x, s.y - .6, 4.2, .55); shake = .4; noise(.3, .09, 200); for (const f of foes) if (!f.dead && Math.hypot(f.x - s.x, f.y - s.y) < s.boom + FOE[f.k].r) hurtFoe(f, 30, 'fire'); for (let i = 0; i < 18; i++) part(s.x, s.y, rnd(-4, 4), rnd(-5, 1), pick(['#ffb040', '#ff6a2a', '#ffe070']), .5, 4); for (const o of M.objs) if (o.dummy && !o.down && Math.hypot(o.x + .5 - s.x, o.y + .5 - s.y) < s.boom + .5) hitDummy(o, 30); }
function nearInteract() {
  for (const e of ents) if (!e.hidden && e.k !== 'magpie' && Math.hypot(e.x - P.x, e.y - P.y) < 1.5) return e;
  for (const o of M.objs) { if (o.k === 'mirror' && Math.hypot(o.x + 1 - P.x, o.y + 1.2 - P.y) < 1.8) return { obj: o, k: 'mirror' }; if (o.chest && !o.open && Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y) < 1.4) return { obj: o, k: 'chest' }; }
  return null;
}
function doInteract(n) {
  if (n.k === 'mirror') return mirrorScene();
  if (n.k === 'chest') { n.obj.open = 1; setF(`chest_${M.id}_${n.obj.x}_${n.obj.y}`); const c = ri(15, 30); G.coin += c; if (Math.random() < .6) { G.potion++; toast(`📦 상자: 🪙${c}냥 + 🧪영약`); } else toast(`📦 상자: 🪙${c}냥`); pluck(784, 0, .05); pluck(1046, .1, .05); updateHUD(); return; }
  return interact(n);
}
function foeAI(f, dt) {
  const b = FOE[f.k], dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy) || .01;
  f.flash = Math.max(0, f.flash - dt); f.burn = Math.max(0, f.burn - dt); f.shock = Math.max(0, f.shock - dt);
  if (f.burn > 0 && (f.bT = (f.bT || 0) - dt) <= 0) { f.bT = .5; f.hp -= 3; nums.push({ x: f.x, y: f.y - 1, t: '3', c: '#ff9a4a', life: .6 }); if (f.hp <= 0) return killFoe(f); }
  if (f.kb[0] || f.kb[1]) { moveEnt(f, f.kb[0] * dt, f.kb[1] * dt, b.r * .8); f.kb[0] *= .85; f.kb[1] *= .85; if (Math.abs(f.kb[0]) + Math.abs(f.kb[1]) < .1) f.kb = [0, 0]; }
  if (f.fz > 0) { f.fz -= dt; return; } if (f.shock > 0) return; if (f.sleep) return;
  if (state !== 'play') return;
  f.cd -= dt; f.t += dt; const sees = d < (b.boss ? 30 : 7) && (b.boss || losClear(f.x, f.y, P.x, P.y));
  const go = (sp, tx, ty) => { const ex = tx - f.x, ey = ty - f.y, l = Math.hypot(ex, ey) || 1; moveEnt(f, ex / l * sp * dt, ey / l * sp * dt, b.r * .8); f.dir = dirOf(ex, ey); f.step += dt * 7; f.f = Math.floor(f.step) % 2; };
  if (f.k === 'wisp') {
    if (sees) { if (d > 3.5) go(b.sp, P.x, P.y); else go(b.sp * .6, f.x - dy, f.y + dx); if (f.cd <= 0) { f.cd = 2.4; shots.push({ x: f.x, y: f.y - .4, vx: dx / d * 5, vy: dy / d * 5, r: .3, dmg: b.dmg, owner: 'e', life: 2, kind: 'efire' }); beep(500, .1, 'sine', .03, 300); } }
    else go(.6, f.x + Math.cos(f.t), f.y + Math.sin(f.t));
  } else if (f.k === 'imp' || f.minion) {
    if (f.st === 'wind') { f.wt -= dt; if (f.wt <= 0) { f.st = 'idle'; f.cd = 1.1; slashE(f.x + Math.sign(dx) * .6, f.y + Math.sign(dy) * .4, 1, b.dmg, f); } return; }
    if (sees) { if (d > .9) go(b.sp, P.x, P.y); if (d < 1.3 && f.cd <= 0) { f.st = 'wind'; f.wt = .38; } } else go(.8, f.x + Math.cos(f.t * .7) * 2, f.y + Math.sin(f.t * .7) * 2);
  } else if (f.k === 'egg') {
    f.alpha = sees ? .95 : .35;
    if (sees && f.cd <= 0) { f.cd = 3.2; const a = rnd(0, 6.28); const nx = P.x + Math.cos(a) * 2.2, ny = P.y + Math.sin(a) * 2.2; if (!solidAt(nx, ny)) { poof(f.x, f.y, '#fff'); f.x = nx; f.y = ny; f.lunge = .9; beep(90, .3, 'sine', .07, 60); } }
    if (f.lunge > 0) { f.lunge -= dt; if (f.lunge < .5) go(b.sp * 2.6, P.x, P.y); } else if (sees) go(b.sp * .7, P.x, P.y);
    if (d < .8) hurtPlayer(b.dmg, f);
  } else if (f.k === 'tiger') {
    if (f.st === 'aim') { f.wt -= dt; if (f.wt <= 0) { f.st = 'dash'; f.wt = .45; } return; }
    if (f.st === 'dash') { f.wt -= dt; moveEnt(f, f.vx * dt, f.vy * dt, b.r * .8); if (d < 1.1) hurtPlayer(b.dmg, f); if (f.wt <= 0) { f.st = 'idle'; f.cd = 1.6; } return; }
    if (sees || f.hp < f.mhp) { if (f.cd <= 0 && d < 7) { f.st = 'aim'; f.wt = .7; f.vx = dx / d * 13; f.vy = dy / d * 13; f.dir = dirOf(dx, dy); areas.push({ x: f.x, y: f.y, r: .6, t: 0, delay: 0, life: .7, kind: 'line', a: Math.atan2(dy, dx), len: 6, owner: 'fx' }); beep(80, .5, 'sawtooth', .06); } else go(b.sp * .55, f.x - dy / d * 2 + dx / d, f.y + dx / d * 2 + dy / d); if (d < 1.1) hurtPlayer(b.dmg * .6, f); }
  } else if (f.k === 'king') kingAI(f, dt, dx, dy, d);
}
function slashE(x, y, r, dmg, from) { areas.push({ x, y, r, t: 0, delay: 0, life: .15, kind: 'eslash', owner: 'fx' }); if (Math.hypot(P.x - x, P.y - y) < r + P.r) hurtPlayer(dmg, from); }
function kingAI(k, dt, dx, dy, d) {
  const phase2 = k.hp < k.mhp * .5;
  if (phase2 && !k.p2) { k.p2 = 1; banner('도깨비왕', '진짜 힘을 보여주마!', '환술 · 졸개 소환'); for (let i = 0; i < 3; i++) { const m = spawnFoe('imp', k.x + rnd(-3, 3), k.y + rnd(1, 3)); m.minion = 1; m.hp = m.mhp = 30; } }
  if (k.act) { k.wt -= dt; k.swing = Math.sin(k.wt * 20) * .6;
    if (k.act === 'spin') { moveEnt(k, k.vx * dt, k.vy * dt, .9); if (d < 1.6 && (k.hT = (k.hT || 0) - dt) <= 0) { k.hT = .4; hurtPlayer(15, k); } if (Math.random() < .5) part(k.x, k.y, rnd(-3, 3), rnd(-2, 0), '#d9b05a', .3, 3); }
    if (k.wt <= 0) { k.act = null; k.cd = phase2 ? 1.1 : 1.6; k.swing = 0; } return; }
  if (d > 2.2) { const l = d; moveEnt(k, dx / l * FOE.king.sp * dt, dy / l * FOE.king.sp * dt, .9); k.dir = dirOf(dx, dy); k.step += dt * 5; k.f = Math.floor(k.step) % 2; }
  k.cd -= dt; if (k.cd > 0) return;
  const r = Math.random();
  if (d < 3.2 && r < .5) { // 방망이 내려찍기
    k.act = 'slam'; k.wt = .95; areas.push({ x: P.x, y: P.y, r: 2.2, t: 0, delay: .9, dmg: 22, owner: 'e', col: '#d9b05a' }); say0('으라차차!');
  } else if (r < .75) { // 금 나와라 뚝딱
    k.act = 'rain'; k.wt = 1.2; say0('금 나와라, 뚝딱!'); for (let i = 0; i < (phase2 ? 8 : 5); i++) areas.push({ x: P.x + rnd(-3, 3), y: P.y + rnd(-2.5, 2.5), r: 1.1, t: 0, delay: .8 + i * .08, dmg: 12, owner: 'e', col: '#ffd040', coin: 1 });
  } else if (phase2 && r < .9) { // 환술 분신
    k.act = 'clone'; k.wt = .6; say0('어느 게 진짜일까?'); for (let i = 0; i < 2; i++) { const c = spawnFoe('imp', k.x + rnd(-4, 4), k.y + rnd(-3, 3)); c.fake = 1; c.clone = 1; c.hp = 1; c.minion = 1; } poof(k.x, k.y, '#c9a0ff');
  } else { // 회전 돌진
    k.act = 'spin'; k.wt = 1.2; k.vx = dx / d * 6; k.vy = dy / d * 6; say0('방망이 회오리!');
  }
}
function say0(t) { nums.push({ x: (foes.find(f => f.k === 'king') || P).x, y: (foes.find(f => f.k === 'king') || P).y - 3, t, c: '#ffd977', life: 1.2, big: 1 }); }
async function victory() {
  state = 'talk'; scriptBusy = true; music(null); shake = 1; stat('boss_clear');
  for (let i = 0; i < 60; i++) part(P.x + rnd(-4, 4), P.y + rnd(-3, 3), rnd(-3, 3), rnd(-6, -1), pick(['#ffd040', '#fff', HOUSE[G.house].c]), 1.2, 4);
  await wait(1400); state = 'play';
  await talk([['도깨비왕', '아이고, 아이고… 졌다, 졌어! 도깨비는 내기에 지면 약속을 지키는 법이지.'], ['도깨비왕', '빼앗은 방망이들은 다 돌려주마. …그리고 이건 네 몫이다. 내가 금단의 숲 깊은 곳에서 찾은 알이야.'], ['까치', '저, 저거… 신수의 알이잖아!'],
    ['📜', `알에 금이 가더니, 작은 ${HOUSE[G.house].ic}가 고개를 내민다.\n아기 신수가 {name}의 어깨 위로 폴짝 뛰어오른다.`],
    ['청송 훈장', '(멀리서 들려오는 목소리) 신수가 스스로 주인을 골랐구나. 이제 하늘이 너를 부를 게다.']]);
  setF('cleared'); save(); scriptBusy = false; endCine();
}
async function endCine() {
  state = 'end'; music('calm');
  await showArt(G.house, '그날 밤, 나는 처음으로 하늘을 날았다', `${HOUSE[G.house].n}의 신수와 함께 — 사신학당의 이야기는 이제 시작이다.`, false);
  const min = Math.max(1, Math.round((Date.now() - G.t0) / 60000));
  const b = $('#endBox'); b.innerHTML = `<div class="tk" style="letter-spacing:5px;color:#e9c77f;font-size:12px;font-weight:800">DEMO CLEAR</div><h2 style="font-size:34px;letter-spacing:4px;margin:6px 0">사신학당</h2><p>“조선에는 역사가 기록하지 않은 또 하나의 세계가 있었다.”</p>
    <div class="stats"><div><b>Lv.${G.lv}</b><small>${HOUSE[G.house].n}</small></div><div><b>${G.kills}</b><small>토벌한 요괴</small></div><div><b>${min}분</b><small>플레이</small></div></div>
    <p style="font-size:13px">다음 이야기: 제2장 「도깨비의 잃어버린 방망이」, 신수 탑승 비행, 학당 대항전 「사신대전」…<br>정식판에서 계속됩니다.</p>
    <button class="btn" id="eShare">친구에게 공유하기</button><button class="btn g" id="eAgain">처음부터 다시</button>`;
  $('#sEnd').classList.add('on'); $('#hud').classList.add('hide'); $('#skills').classList.add('hide');
  $('#eShare').onclick = () => { const url = 'https://aptgame.kr/sashin/', text = `사신학당 데모 클리어! ${HOUSE[G.house].n} Lv.${G.lv}로 도깨비왕을 쓰러뜨렸다 🐉`; if (navigator.share) navigator.share({ title: '사신학당', text, url }).catch(() => {}); else { try { navigator.clipboard.writeText(text + '\n' + url); toast('링크를 복사했어요'); } catch (e) {} } stat('share'); };
  $('#eAgain').onclick = () => { store.set('save', null); location.reload(); };
}
// ----- 장면 전환 -----
function fadeTo(id) {
  state = 'fade'; const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;background:#000;z-index:35;opacity:0;transition:opacity .45s'; document.body.appendChild(d);
  requestAnimationFrame(() => d.style.opacity = 1); pluck(330, 0, .05); pluck(494, .15, .05);
  setTimeout(() => { loadScene(id); state = 'play'; d.style.opacity = 0; setTimeout(() => d.remove(), 500); }, 500);
}

// ----- 그리기 -----
let camX = 0, camY = 0, LS = 1;
function draw() {
  const z = M.bg ? Math.max(.75, ZOOM * .45) : ZOOM, vw = VW / z, vh = VH / z; LS = ZOOM / z; const CS = M.bg ? 1.3 : 1;
  const tx = clamp(P.x * T - vw / 2, 0, Math.max(0, M.W * T - vw)), ty = clamp(P.y * T - vh / 2 + (isTouch && VW < 760 ? vh * .1 : 0), 0, Math.max(0, M.H * T - vh));
  camX += (tx - camX) * .2; camY += (ty - camY) * .2; if (Math.abs(tx - camX) > 300) { camX = tx; camY = ty; }
  const sh = shake ? (Math.random() - .5) * 8 * shake : 0, cx = Math.round(camX + sh), cy = Math.round(camY + sh);
  ctx.setTransform(DPR * z, 0, 0, DPR * z, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, vw, vh);
  ctx.save(); ctx.translate(-cx, -cy);
  const sx = Math.max(0, cx), sy = Math.max(0, cy), sw = Math.min(ground.width - sx, Math.ceil(vw) + 2), shh = Math.min(ground.height - sy, Math.ceil(vh) + 2);
  if (sw > 0 && shh > 0) ctx.drawImage(ground, sx, sy, sw, shh, sx, sy, sw, shh);
  // 바닥 효과 (예고 원 등)
  for (const a of areas) drawArea(a, true);
  // 깊이 정렬
  const L = cx - 120, R = cx + vw + 120, U = cy - 160, D = cy + vh + 160, list = [];
  for (const o of M.objs) { if (o.hidden) continue; const bx = o.x * T, by = (o.y + o.h) * T; if (bx + o.w * T < L || bx > R || by < U || by - 200 > D) continue; list.push([by - (o.k === 'portal' ? 40 : 0), 0, o]); }
  for (const e of ents) if (!e.hidden) list.push([e.y * T + (e.k === 'magpie' ? 60 : 12), 1, e]);
  for (const f of foes) list.push([f.y * T + 12, 2, f]);
  list.push([P.y * T + 12, 3, P]);
  list.sort((a, b) => a[0] - b[0]);
  for (const [, k, o] of list) {
    if (k === 0) { if (o.flash) ctx.globalAlpha = .6; drawObj(ctx, o.dummy && o.down ? Object.assign({}, o, { k: 'rock' }) : o, now); ctx.globalAlpha = 1; if (o.house && o.mine) { ctx.fillStyle = HOUSE[o.house].c; ctx.globalAlpha = .35 + .2 * Math.sin(now * 3); ctx.fillRect(o.x * T + 14, (o.y + o.h) * T - 48, o.w * T - 28, 48); ctx.globalAlpha = 1; } }
    else { const sx0 = o.x * T, sy0 = o.y * T; if (CS !== 1) { ctx.save(); ctx.translate(sx0, sy0); ctx.scale(CS, CS); ctx.translate(-sx0, -sy0); }
      if (k === 1) drawNPC(o); else if (k === 2) drawFoe(o); else drawPlayer();
      if (CS !== 1) ctx.restore(); }
  }
  for (const s of shots) drawShot(s);
  for (const a of areas) drawArea(a, false);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  for (const e of fxs) { const im = IMG[e.n]; if (!ok(im)) continue; const w = e.w * T, h = w * im.naturalHeight / im.naturalWidth, k = e.life / e.ml;
    ctx.globalAlpha = (e.alpha || 1) * Math.min(1, k * 3, (1 - k) * 8 + .2); ctx.save(); ctx.translate(e.x * T, e.y * T); if (e.rot) ctx.rotate(e.rot); if (e.flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); }
  ctx.restore(); ctx.imageSmoothingEnabled = false;
  for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / p.ml); px(ctx, p.x * T - p.s / 2, p.y * T - p.s / 2, p.s, p.s, p.c); } ctx.globalAlpha = 1;
  ctx.restore();
  // 밤 + 불빛
  if (M.night > 0) {
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0); dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, VW, VH);
    dctx.fillStyle = `rgba(8,10,34,${M.night})`; dctx.fillRect(0, 0, VW, VH); dctx.globalCompositeOperation = 'destination-out';
    const hole = (wx, wy, r, a) => { const X = (wx - cx) * z, Y = (wy - cy) * z, Rr = r * z; if (X < -Rr || X > VW + Rr || Y < -Rr || Y > VH + Rr) return; const g = dctx.createRadialGradient(X, Y, 0, X, Y, Rr); g.addColorStop(0, `rgba(0,0,0,${a || .95})`); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.beginPath(); dctx.arc(X, Y, Rr, 0, 7); dctx.fill(); };
    hole(P.x * T, P.y * T, 150);
    for (const o of M.objs) if (o.light && !o.hidden) hole((o.x + o.w / 2) * T, (o.y + o.h) * T - 30, o.k === 'portal' ? 120 : 90, .85);
    if (M.id === 'village') hole(17 * T, 3 * T, F('gateOpen') ? 200 : 110, .7);
    for (const s of shots) hole(s.x * T, s.y * T, 50, .6);
    for (const a of areas) if (a.kind === 'boom' || a.kind === 'bolt' || a.kind === 'ice' || a.kind === 'spring') hole(a.x * T, a.y * T, 110, .8);
    for (const f of foes) if (f.k === 'wisp') hole(f.x * T, f.y * T - 8, 60, .7);
    if (P.ring > 0) hole(P.x * T, P.y * T, 100, .7);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0);
    if (M.id === 'village' || M.id === 'market') { ctx.fillStyle = 'rgba(255,190,110,.05)'; ctx.fillRect(0, 0, cv.width, cv.height); }
  }
  // 위에 그리는 것: 숫자, 상호작용 표시, 화살표
  ctx.setTransform(DPR * z, 0, 0, DPR * z, 0, 0); ctx.save(); ctx.translate(-cx, -cy);
  for (const n of nums) { ctx.globalAlpha = Math.min(1, n.life * 2); ctx.font = `900 ${(n.big ? 12 : 10) * LS}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(n.t, n.x * T, n.y * T); ctx.fillStyle = n.c; ctx.fillText(n.t, n.x * T, n.y * T); } ctx.globalAlpha = 1;
  for (const f of foes) if (!f.dead && (FOE[f.k].elite || FOE[f.k].boss || f.hp < f.mhp) && !f.fake) { const w = FOE[f.k].boss ? 0 : 26, bx = f.x * T - w / 2, by = f.y * T - (FOE[f.k].elite ? 38 : 30); if (w) { px(ctx, bx, by, w, 4, '#0008'); px(ctx, bx, by, w * Math.max(0, f.hp / f.mhp), 4, '#e04848'); } }
  const pill = (x, y, txt, col, bg) => { ctx.save(); ctx.translate(x, y); ctx.scale(LS, LS); ctx.font = '800 9px sans-serif'; const w = ctx.measureText(txt).width + 10; ctx.fillStyle = bg || 'rgba(12,9,18,.72)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -8, w, 12, 3) : ctx.rect(-w / 2, -8, w, 12); ctx.fill(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(txt, 0, 1); ctx.restore(); };
  const tgt = state === 'play' ? questTarget() : null;
  for (const e of ents) { if (e.hidden || e.k === 'magpie' || !e.name) continue; const x = e.x * T, y = e.y * T - (e.k === 'dok' ? 34 : 32) * CS; pill(x, y, e.name, '#ffd977');
    if (tgt === e) { const by = y - 16 * LS + Math.sin(now * 4) * 2; ctx.save(); ctx.translate(x, by); ctx.scale(LS, LS); ctx.translate(-x, -by); ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(x, by, 6.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffd977'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffd977'; ctx.font = '900 9px sans-serif'; ctx.fillText('!', x, by + 3.5); ctx.restore(); } }
  for (const f of foes) if (!f.dead && !f.fake && (FOE[f.k].elite || FOE[f.k].boss)) pill(f.x * T, f.y * T - (FOE[f.k].boss ? 62 : 46) * CS, FOE[f.k].n, '#ff8a7a');
  if (state === 'play' || state === 'talk') { const x = P.x * T, y = P.y * T - 44 * CS; pill(x, y - 6 * LS, `Lv.${G.lv} ${G.name}`, '#fff'); const bw = 28 * LS, bh = 3 * LS; px(ctx, x - bw / 2, y + LS, bw, bh, 'rgba(0,0,0,.7)'); px(ctx, x - bw / 2, y + LS, bw * Math.max(0, G.hp / G.mhp), bh, G.hp / G.mhp > .3 ? '#5ad26a' : '#e04848'); }
  const ni = state === 'play' ? nearInteract() : null;
  if (ni) { const x = (ni.obj ? ni.obj.x + .5 + (ni.k === 'mirror' ? .5 : 0) : ni.x) * T + 22, y = (ni.obj ? ni.obj.y - (ni.k === 'mirror' ? 1.6 : .2) : ni.y - .6 * CS) * T + Math.sin(now * 5) * 1.5; ctx.save(); ctx.translate(x, y); ctx.scale(LS, LS); ctx.translate(-x, -y); const lb = ni.k === 'chest' ? '열기' : ni.k === 'mirror' ? '거울 보기' : '대화';
    ctx.font = '800 9px sans-serif'; const w = ctx.measureText(lb).width + 26; ctx.fillStyle = 'rgba(12,9,18,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y - 9, w, 15, 7) : ctx.rect(x, y - 9, w, 15); ctx.fill(); ctx.strokeStyle = '#e9c77f'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#f3ecdc'; ctx.beginPath(); ctx.arc(x + 8, y - 1.5, 5.5, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1208'; ctx.textAlign = 'center'; ctx.fillText(isTouch ? '⚔' : 'E', x + 8, y + 1.5); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(lb, x + 16, y + 1.5); ctx.restore(); }
  ctx.restore();
  // 보스 체력바
  const king = foes.find(f => f.k === 'king' && !f.dead);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (king) { const w = Math.min(VW - 40, 420), x = (VW - w) / 2, y = VH - (isTouch ? 230 : 60); px(ctx, x - 2, y - 2, w + 4, 14, '#000a'); px(ctx, x, y, w * king.hp / king.mhp, 10, king.p2 ? '#ff3a3a' : '#d9533a'); ctx.font = '900 12px sans-serif'; ctx.fillStyle = '#ffd977'; ctx.textAlign = 'center'; ctx.fillText('👹 도깨비왕', VW / 2, y - 6); }
  // 길잡이 화살표
  const tg = state === 'play' ? questTarget() : null;
  if (tg) { const sxp = (P.x * T - cx) * z, syp = (P.y * T - cy) * z, dx = tg.x - P.x, dy = tg.y - P.y, d = Math.hypot(dx, dy); if (d > 2.5) { const a = Math.atan2(dy, dx), rr = Math.min(Math.min(VW, VH) * .42, d * T * z * .8), ax = clamp(sxp + Math.cos(a) * rr, 26, VW - 26), ay = clamp(syp + Math.sin(a) * rr, 100, VH - (isTouch ? 220 : 40));
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ffd977'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-3, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  if (P.flash > 0) { ctx.fillStyle = `rgba(220,30,40,${P.flash})`; ctx.fillRect(0, 0, VW, VH); }
}
function lookOf() { const h = G.house ? HOUSE[G.house] : null; return { gender: G.gender, top: '#f4efe0', bottom: G.gender === 'f' ? (h ? h.d : '#c0392b') : '#e8e0d0', belt: h ? h.c : '#c0392b', hair: '#1a1410' }; }
function drawPlayer() {
  if (P.inv > 0 && !P.roll && Math.floor(now * 14) % 2) return;
  const x = P.x * T, y = P.y * T;
  if (P.guard > 0) { ctx.strokeStyle = `rgba(230,230,255,${.5 + .3 * Math.sin(now * 10)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 4, 16, 0, 7); ctx.stroke(); }
  if (P.roll > 0) { ctx.save(); ctx.translate(x, y - 4); ctx.rotate(now * 30); ctx.translate(-x, -y + 4); }
  const g = G.gender === 'f' ? 'f' : 'm', side = P.dir === 'left' || P.dir === 'right';
  const im = side ? (P.moving ? IMG[g + '_walk' + (Math.floor(P.step * .6) % 4)] : IMG[g + '_side']) : IMG[g + (P.dir === 'up' ? '_up' : '_down')];
  if (ok(im)) { const h = 46, w = h * im.naturalWidth / im.naturalHeight, bob = P.moving && !side ? Math.abs(Math.sin(P.step * 1.6)) * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 4, 0, 0, 7); ctx.fill();
    if (G.house) { ctx.fillStyle = HOUSE[G.house].c; ctx.globalAlpha = .25; ctx.beginPath(); ctx.ellipse(x, y + 6, 13, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(x, y + 8 - bob); if (P.dir === 'left') ctx.scale(-1, 1); if (P.atkAnim > 0) ctx.translate(3, 0); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); ctx.imageSmoothingEnabled = false; }
  else drawHuman(ctx, x, y, Object.assign(lookOf(), { dir: P.dir, f: P.f, moving: P.moving }));
  if (P.roll > 0) ctx.restore();
  // 법구
  if (G.weapon && !P.roll && (G.weapon !== 'sword' || P.atkAnim > 0)) { const [fx, fy] = facing(), wx = x + fx * 9, wy = y - 2 + fy * 6; const sw = P.atkAnim > 0 ? (P.atkAnim / .18) * 2 - 1 : 0;
    if (G.weapon === 'sword') { ctx.save(); ctx.translate(wx, wy); ctx.rotate(Math.atan2(fy, fx) + sw * 1.2); px(ctx, 0, -1, 14, 2, '#dfe6f0'); px(ctx, -3, -2, 3, 4, '#8a5a2a'); ctx.restore(); }
    else if (G.weapon === 'talisman') { px(ctx, wx - 3, wy - 5, 6, 9, '#f2e3a0'); px(ctx, wx - 1, wy - 3, 2, 5, '#c0392b'); }
    else if (G.weapon === 'fan') { ctx.fillStyle = '#e8d8b0'; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.arc(wx, wy, 8, Math.atan2(fy, fx) - .8 + sw, Math.atan2(fy, fx) + .8 + sw); ctx.closePath(); ctx.fill(); }
    else { px(ctx, wx - 3, wy - 3, 6, 6, '#d9b05a'); px(ctx, wx - 1, wy + 2, 2, 3, '#8a5a2a'); } }
  if (F('cleared') && G.house) drawBeast(ctx, x - 14, y - 26, G.house, now, .45);
}
function drawNPC(e) {
  const x = e.x * T, y = e.y * T;
  if (e.k === 'magpie') { drawMagpie(ctx, x, y, now, 1); return; }
  if (e.glow) { ctx.fillStyle = `rgba(255,240,180,${.25 + .1 * Math.sin(now * 3)})`; ctx.beginPath(); ctx.arc(x, y - 6, 22, 0, 7); ctx.fill(); }
  if (e.k === 'dok') drawDokkaebi(ctx, x, y, Object.assign({ dir: e.dir, f: e.f, club: false }, e.look));
  else drawHuman(ctx, x, y, Object.assign({ dir: e.dir, f: e.f, moving: e.f }, e.look));
}
function drawFoe(f) {
  const x = f.x * T, y = f.y * T;
  if (f.flash > 0) ctx.globalAlpha = .55; if (f.fake) ctx.globalAlpha = .75;
  if (f.k === 'wisp') drawWisp(ctx, x, y, now);
  else if (f.k === 'imp') { if (f.clone) drawDokkaebi(ctx, x, y, { dir: f.dir, f: f.f, s: 1.9, skin: '#c0392b', king: 1, cloth: '#2a2a2a', eye: '#ff0', swing: Math.sin(now * 5) * .3 }); else drawDokkaebi(ctx, x, y, { dir: f.dir, f: f.f, skin: f.minion ? '#7a4ad9' : '#d9533a', s: .85, swing: f.st === 'wind' ? -.8 : 0 }); }
  else if (f.k === 'egg') { ctx.globalAlpha = Math.min(ctx.globalAlpha, f.alpha || .9); drawEgg(ctx, x, y, now, f.f); }
  else if (f.k === 'tiger') { if (f.st === 'aim') { ctx.fillStyle = 'rgba(255,60,60,.3)'; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); } drawTigerSpirit(ctx, x, y, now, f.f, f.dir === 'left' ? 'left' : 'right'); }
  else if (f.k === 'king') drawDokkaebi(ctx, x, y, { dir: f.dir, f: f.f, s: 1.9, skin: f.p2 ? '#c0392b' : '#d9533a', king: 1, cloth: '#2a2a2a', eye: f.p2 ? '#ff0' : '#000', swing: f.swing || 0 });
  ctx.globalAlpha = 1;
  if (f.fz > 0) { ctx.fillStyle = 'rgba(180,230,255,.45)'; ctx.fillRect(x - 12, y - 24, 24, 34); }
  if (f.burn > 0 && Math.random() < .3) part(f.x + rnd(-.3, .3), f.y - .5, 0, -2, '#ff8a3a', .3, 2);
  if (f.shock > 0) { ctx.strokeStyle = '#fff36a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 4; i++) ctx.lineTo(x + rnd(-12, 12), y - 10 + rnd(-12, 12)); ctx.stroke(); }
}
function drawShot(s) {
  const x = s.x * T, y = s.y * T;
  if (s.kind === 'fire' && ok(IMG.fx_fireball)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.translate(x, y); ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.drawImage(IMG.fx_fireball, -48, -12, 56, 24); ctx.restore(); ctx.imageSmoothingEnabled = false; return; }
  if (s.kind === 'tal' && ok(IMG.talisman)) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(x, y); ctx.rotate(now * 12); ctx.drawImage(IMG.talisman, -6, -9, 12, 18); ctx.restore(); ctx.imageSmoothingEnabled = false; return; }
  if (s.kind === 'tal') { ctx.save(); ctx.translate(x, y); ctx.rotate(now * 12); px(ctx, -3, -5, 6, 10, '#f2e3a0'); px(ctx, -1, -3, 2, 6, '#c0392b'); ctx.restore(); }
  else if (s.kind === 'wind') { ctx.strokeStyle = 'rgba(200,255,230,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, Math.atan2(s.vy, s.vx) - 1, Math.atan2(s.vy, s.vx) + 1); ctx.stroke(); }
  else if (s.kind === 'orb') { ctx.fillStyle = 'rgba(255,240,180,.4)'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
  else if (s.kind === 'fire') { ctx.fillStyle = 'rgba(255,140,40,.45)'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd070'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
  else if (s.kind === 'efire') { ctx.fillStyle = 'rgba(110,190,255,.45)'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
}
function drawArea(a, floor) {
  const x = a.x * T, y = a.y * T, r = a.r * T;
  if (floor) {
    if (a.owner === 'e' && !a.done) { const k = Math.min(1, a.t / a.delay); ctx.fillStyle = 'rgba(230,40,40,.18)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,80,80,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * k, r * .7 * k, 0, 0, 7); ctx.stroke(); if (a.coin) { ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🪙', x, y - (1 - k) * 120); } }
    if (a.kind === 'spring') { ctx.fillStyle = `rgba(120,200,255,${.2 + .08 * Math.sin(now * 5)})`; ctx.beginPath(); ctx.ellipse(P.x * T, P.y * T, r, r * .6, 0, 0, 7); ctx.fill(); if (Math.random() < .3) part(P.x + rnd(-1, 1), P.y, 0, -2, '#9fe0ff', .5, 2); }
    if (a.kind === 'ice') { const k = a.t / a.life; ctx.fillStyle = `rgba(200,240,255,${.5 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#e8faff'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const an = i * .785; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * r * k, y + Math.sin(an) * r * .7 * k); ctx.stroke(); } }
    if (a.kind === 'line') { ctx.save(); ctx.translate(x, y); ctx.rotate(a.a); ctx.fillStyle = 'rgba(255,60,60,.25)'; ctx.fillRect(0, -10, a.len * T, 20); ctx.restore(); }
    return;
  }
  if (a.kind === 'slash') { const k = a.t / a.life; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(P.x * T, P.y * T - 4, r, a.a - 1.1, a.a + 1.1); ctx.stroke(); }
  if (a.kind === 'eslash') { ctx.strokeStyle = 'rgba(255,120,80,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
  if (a.kind === 'bolt') { ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + rnd(-6, 6), y - 140); for (let i = 1; i <= 6; i++) ctx.lineTo(x + rnd(-10, 10), y - 140 + i * 23); ctx.stroke(); ctx.fillStyle = 'rgba(255,250,180,.5)'; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); }
  if (a.kind === 'boom') { const k = a.t / a.life; ctx.fillStyle = `rgba(255,150,40,${.7 * (1 - k)})`; ctx.beginPath(); ctx.arc(x, y, r * (.4 + k * .6), 0, 7); ctx.fill(); }
  if (a.kind === 'vortex') { ctx.strokeStyle = 'rgba(255,140,60,.8)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y - i * 8, r * (1 - i * .25), now * 10 + i, now * 10 + i + 3); ctx.stroke(); } }
}

// ----- HUD -----
function updateHUD() {
  if (!G) return;
  $('#lv').textContent = 'Lv.' + G.lv; $('#pName').textContent = G.name;
  $('#hpB').style.width = Math.max(0, G.hp / G.mhp * 100) + '%'; $('#hpT').textContent = Math.max(0, Math.ceil(G.hp)).toLocaleString() + ' / ' + G.mhp.toLocaleString();
  $('#mpB').style.width = (G.mp / G.mmp * 100) + '%'; $('#mpT').textContent = Math.floor(G.mp) + ' / ' + G.mmp; $('#xpB').style.width = (G.xp / (G.lv * 30) * 100) + '%';
  const sg = G.house ? G.sg || 0 : 0; $('#sgB').style.width = sg + '%'; $('#sgB').parentNode.classList.toggle('full', sg >= 100);
  $('#coin').textContent = `🪙 ${G.coin}냥${G.potion ? ` · 🧪${G.potion}` : ''}`;
  $('#qT').textContent = G.quest || '-'; $('#qS').innerHTML = questProg();
  const sb = $('#qSubBox'); sb.classList.toggle('hide', !F('trained')); sb.classList.toggle('done', G.sub >= 5); $('#qSub').innerHTML = G.sub >= 5 ? '☑ 완료 — 영약 2 · 엽전 50냥 획득' : `☐ 요괴의 기운 모으기 (${G.sub || 0}/5)`;
  if (M) $('#mmT').textContent = M.name;
}
function cdHUD() {
  if (!G) return; const sg = G.house ? G.sg || 0 : 0, set = (id, cd, lock) => { const b = $(id); b.querySelector('.cd').style.height = (cd * 100) + '%'; b.classList.toggle('lock', !!lock); };
  for (let i = 0; i < 2; i++) { const s = G.house && SPELLS[G.house][i]; set(i ? '#skE' : '#skQ', s ? CD['s' + i] / s.cd : 0, !s || G.mp < s.mp); }
  set('#skR', CD.r / 6, !G.house || sg < 40); set('#skF', CD.f / 2.5, !G.weapon); set('#skT', 0, sg < 100); $('#skT').classList.toggle('ready', sg >= 100);
  if (Math.random() < .25) updateHUD();
}
function updatePad() {
  if (!G) return; const B = G.house ? BEAST[G.house] : null;
  const slot = (id, img, label, size) => { const b = $(id); b.style.backgroundImage = img ? `url(img/${img}.png)` : 'none'; b.style.backgroundSize = size || 'cover'; b.querySelector('u').textContent = label; };
  for (let i = 0; i < 2; i++) { const s = G.house && SPELLS[G.house][i]; slot(i ? '#skE' : '#skQ', s ? 'fx_' + SFX[s.id] : '', s ? s.n : '술법 🔒'); }
  slot('#skR', B ? 'fx_' + B.call : '', B ? '신수 호출' : '신수 🔒'); slot('#skF', 'talisman', '부적', 'auto 70%'); slot('#skT', B ? 'fx_' + B.ult.fx : '', B ? B.ult.n : '궁극기 🔒');
  $('#skA').querySelector('span').textContent = G.weapon ? WEAPONS[G.weapon].ic : '💬';
  $('#hPort').src = 'img/' + (G.gender === 'f' ? 'f' : 'm') + '_port.png';
  $('#sgIc').textContent = B ? B.ic : '🥚'; $('#sgN').textContent = B ? `신수 게이지 (${B.n})` : '신수 게이지 (봉인됨)';
  updateHUD();
}

// ----- 루프 -----
function loop(ts) {
  const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if (state === 'menu' && took('escape')) closeMenu();
  document.body.classList.toggle('talking', state === 'talk');
  if (state === 'talk') { if (took('j') || took(' ') || took('click') || took('enter') || took('e')) advanceDlg(); if (dlgTyping) { dlgShown += dt * 45; if (dlgShown >= dlgFull.length) { dlgShown = dlgFull.length; dlgTyping = false; } $('#dTxt').textContent = dlgFull.slice(0, Math.floor(dlgShown)); } }
  if (M && P && (state === 'play' || state === 'talk' || state === 'fade' || state === 'end' || state === 'dead' || state === 'menu')) { if (state === 'play') update(dt); else { now += dt; for (const e of ents) if (e.k === 'magpie' && e.follow) { e.x += (P.x + 1.1 - e.x) * .05; e.y += (P.y - 1.4 - e.y) * .05; } } draw(); cdHUD(); if ((mmTick = (mmTick + 1) % 2) === 0) drawMini(); }
  if (state === 'title') drawTitle(ts / 1000);
  requestAnimationFrame(loop);
}
// ----- 타이틀 -----
const tc = $('#tc'), tctx = tc.getContext('2d'); const titleImg = new Image(); titleImg.src = 'img/key_world.webp';
function drawTitle(t) {
  const w = tc.clientWidth, h = tc.clientHeight; if (tc.width !== w * DPR) { tc.width = w * DPR; tc.height = h * DPR; }
  tctx.setTransform(DPR, 0, 0, DPR, 0, 0); tctx.fillStyle = '#0b0d1a'; tctx.fillRect(0, 0, w, h);
  if (titleImg.complete && titleImg.naturalWidth) { const s = Math.max(w / titleImg.naturalWidth, h / titleImg.naturalHeight) * 1.06, iw = titleImg.naturalWidth * s, ih = titleImg.naturalHeight * s; tctx.drawImage(titleImg, (w - iw) / 2 + Math.sin(t * .2) * 10, (h - ih) / 2 + Math.cos(t * .15) * 6, iw, ih); }
  const g = tctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(5,6,16,.15)'); g.addColorStop(.45, 'rgba(5,6,16,.35)'); g.addColorStop(1, 'rgba(5,6,16,.92)'); tctx.fillStyle = g; tctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) { const x = (hash(i, 1) * w + t * 12 * (1 + hash(i, 2))) % w, y = (hash(i, 3) * h + t * 18 * (1 + hash(i, 4))) % h; tctx.fillStyle = `rgba(255,190,210,${.5 + .3 * Math.sin(t + i)})`; tctx.beginPath(); tctx.ellipse(x, y, 3, 2, t + i, 0, 7); tctx.fill(); }
}
// ----- 시작 -----
function startGame() {
  ['sTitle', 'sName'].forEach(i => $('#' + i).classList.remove('on')); $('#hud').classList.remove('hide'); $('#skills').classList.remove('hide'); G.sg = G.sg || 0; G.dex = G.dex || {}; G.sub = G.sub || 0; applyMute(); $('#log').innerHTML = ''; log('sys', '시스템', '사신학당에 오신 것을 환영합니다!');
  state = 'play'; ac(); loadScene(G.scene || 'village'); if (G.quest) quest(G.quest);
}
let gsel = 'm';
document.querySelectorAll('.gb').forEach(b => b.onclick = () => { gsel = b.dataset.g; document.querySelectorAll('.gb').forEach(x => x.classList.toggle('on', x === b)); });
$('#bNew').onclick = () => { ac(); $('#sTitle').classList.remove('on'); $('#sName').classList.add('on'); setTimeout(() => $('#nm').focus(), 100); };
$('#bNameOk').onclick = () => { const n = ($('#nm').value || '').trim().slice(0, 6) || (gsel === 'f' ? '서연' : '도윤'); G = newG(n, gsel); save(); startGame(); };
const sv = store.get('save', null);
if (sv && sv.scene) { $('#bCont').classList.remove('hide'); $('#bCont').onclick = () => { G = sv; if (G.hp <= 0) G.hp = G.mhp; startGame(); }; }
requestAnimationFrame(loop);
