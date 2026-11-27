'use strict';
// ===== 기본 =====
const T = 32;
const $ = s => document.querySelector(s);
const cv = $('#c'), ctx = cv.getContext('2d');
const dark = document.createElement('canvas'), dctx = dark.getContext('2d');
let DPR = 1, VW = 0, VH = 0, ZOOM = 1.5;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); VW = innerWidth; VH = innerHeight;
  ZOOM = VW < 520 ? 1.45 : VW < 900 ? 1.7 : 2;
  for (const c of [cv, dark]) { c.width = VW * DPR; c.height = VH * DPR; }
}
addEventListener('resize', resize); resize();
const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pick = a => a[Math.floor(Math.random() * a.length)];
const store = { get(k, d) { try { const v = localStorage.getItem('sashin_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('sashin_' + k, JSON.stringify(v)); } catch (e) {} } };
function stat(ev, k) { try { navigator.sendBeacon && navigator.sendBeacon('/api/stat', new Blob([JSON.stringify({ g: 'sashin', ev, k: k || '' })], { type: 'application/json' })); } catch (e) {} }
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

// ===== 입력 =====
const keys = {}; let joy = null;
const press = {};            // 이번 프레임에 눌린 버튼
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); if (!keys[k]) press[k] = 1; keys[k] = 1;
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = 0; });
const isTouch = 'ontouchstart' in window;
const joyEl = $('#joy'), joyKnob = joyEl.querySelector('i');
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && !isTouch) { press.click = 1; return; }
  if (e.clientX > VW * .62) { press.click = 1; return; }
  joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 };
  joyEl.style.display = 'block'; joyEl.style.left = (e.clientX - 60) + 'px'; joyEl.style.top = (e.clientY - 60) + 'px'; joyKnob.style.transform = '';
});
cv.addEventListener('pointermove', e => { if (!joy || e.pointerId !== joy.id) return; let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } joy.dx = dx / m; joy.dy = dy / m; joyKnob.style.transform = `translate(${dx}px,${dy}px)`; });
const joyEnd = e => { if (joy && e.pointerId === joy.id) { joy = null; joyEl.style.display = 'none'; } };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
document.querySelectorAll('#skills [data-k]').forEach(b => { const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press[k] = 1; keys[k] = 1; b.classList.add('on'); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('on'); });
});
function moveVec() {
  let mx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
  let my = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
  if (joy && Math.hypot(joy.dx, joy.dy) > .18) { mx = joy.dx; my = joy.dy; }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  return [mx, my];
}
const took = k => { const v = press[k]; press[k] = 0; return !!v; };
function clearPress() { for (const k in press) press[k] = 0; }

// ===== 소리 =====
let AC = null, master = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .6; master.connect(AC.destination); } catch (e) {} } return AC; }
function beep(f, d, type, vol, slide) {
  const a = ac(); if (!a) return;
  try { const o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + d);
    g.gain.value = vol || .07; g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d); o.connect(g); g.connect(master); o.start(); o.stop(a.currentTime + d); } catch (e) {}
}
function noise(d, vol, hp) {
  const a = ac(); if (!a) return;
  try { const n = a.createBufferSource(), b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    n.buffer = b; const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800; const g = a.createGain(); g.gain.value = vol || .08; n.connect(f); f.connect(g); g.connect(master); n.start(); } catch (e) {}
}
// 가야금 느낌의 뜯는 소리 + 5음 음계 배경음
function pluck(f, t, vol) {
  const a = ac(); if (!a) return;
  try { const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.01;
    const st = a.currentTime + (t || 0); g.gain.setValueAtTime(.0001, st); g.gain.exponentialRampToValueAtTime(vol || .05, st + .01); g.gain.exponentialRampToValueAtTime(.0001, st + 1.6);
    o.frequency.setValueAtTime(f, st); o.frequency.linearRampToValueAtTime(f * 1.012, st + .5); o.frequency.linearRampToValueAtTime(f, st + 1.2);
    o.connect(g); o2.connect(g); g.connect(master); o.start(st); o2.start(st); o.stop(st + 1.7); o2.stop(st + 1.7); } catch (e) {}
}
const SCALE = { calm: [196, 220, 262, 294, 330, 392, 440, 523], night: [185, 220, 247, 277, 330, 370, 440, 494], battle: [147, 165, 196, 220, 247, 294, 330, 392] };
let musicT = null, musicMode = null;
function music(mode) {
  if (mode === musicMode) return; musicMode = mode; clearInterval(musicT); if (!mode) return;
  let i = 0; const sc = SCALE[mode] || SCALE.calm, sp = mode === 'battle' ? 260 : 520;
  musicT = setInterval(() => { if (!AC || document.hidden) return; i++;
    if (mode === 'battle') { if (i % 2 === 0) beep(sc[0] / 2, .12, 'square', .025); if (i % 4 === 0) noise(.05, .03, 2000); }
    if (Math.random() < (mode === 'battle' ? .8 : .55)) pluck(pick(sc), 0, mode === 'battle' ? .035 : .04);
    if (i % 8 === 0) pluck(sc[0] / 2, 0, .035);
  }, sp);
}
// ===== 화면 알림 =====
let toastT = 0;
function toast(h, ms) { const m = $('#toast'); m.innerHTML = h; m.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => m.classList.remove('on'), ms || 1800); }
function banner(k, t, s) { const b = $('#banner'); b.innerHTML = `<div class="k">${k}</div><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}`; b.classList.remove('hide'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(b._t); b._t = setTimeout(() => b.classList.add('hide'), 2600); }
