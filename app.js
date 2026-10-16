const BASE = [
  { id:'neck', name:'Neck tilt', eyes:1, tip:'Drop your right ear toward your shoulder, then switch sides. Slow and gentle.' },
  { id:'neckturn', name:'Neck turn', eyes:1, tip:'Turn your head slowly to look over one shoulder, hold, then switch. Keep your shoulders still.' },
  { id:'chin', name:'Chin tucks', eyes:1, tip:'Glide your chin straight back, like making a double chin. Hold for two breaths, then release.' },
  { id:'eyes', name:'20-20-20 eye rest', eyes:1, tip:'Look at something about 6 metres (20 feet) away for the whole minute. Blink slowly.' },
  { id:'eyecircle', name:'Eye circles', eyes:1, tip:'Keep your head still and trace a slow, big circle with your eyes. Then reverse direction.' },
  { id:'shrug', name:'Shoulder shrugs', tip:'Lift your shoulders to your ears, hold a beat, then let them drop. Breathe out as they fall.' },
  { id:'reach', name:'Overhead reach', tip:'Sweep both arms up and reach tall. Lace your fingers and press up if it feels good.' },
  { id:'open', name:'Chest opener', tip:'Open your arms wide and squeeze your shoulder blades together. Keep your chin level.' },
  { id:'bend', name:'Seated side bend', tip:'Sit tall and lean to one side, then the other. Keep both hips on the chair.' },
  { id:'stand', name:'Stand and sit', tip:'Stand all the way up, squeeze your glutes, and sit back down slowly. Repeat.' }
];
const breakMs = () => store.settings.breakSec * 1000, KEY = 'deskbound-v1';
const $ = id => document.getElementById(id);
const dayKey = (off = 0) => { const d = new Date(); d.setDate(d.getDate() - off); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

let store;
try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
store.days ||= {}; store.settings ||= { mins: 25, sound: true, notify: false };
store.custom ||= []; let STRETCHES = [...BASE, ...store.custom];
store.settings.routine ||= STRETCHES.map(s => s.id);
store.settings.focus ||= 'routine';
store.settings.breakSec ||= 60; store.settings.goal ||= 5; store.settings.sitwarn ??= 90;

// ---- Language (strings live in i18n.js) ----
let lang = store.settings.lang || (/^(fil|tl)/i.test(navigator.language) ? 'fil' : 'en');
const t = s => lang === 'fil' ? (FIL[s] || s) : s;
const sname = s => lang === 'fil' && FSTR[s.id] ? FSTR[s.id][0] : s.name;
const stip = s => lang === 'fil' && FSTR[s.id] ? FSTR[s.id][1] : s.tip;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const orig = new WeakMap();
function applyLang() {
  document.documentElement.lang = lang;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; n = w.nextNode();) {
    if (!orig.has(n)) { const k = n.data.replace(/\s+/g, ' ').trim(); if (!(k in FIL)) continue; orig.set(n, [n.data, k]); }
    const [d, k] = orig.get(n);
    n.data = lang === 'fil' ? d.replace(/\S[\s\S]*\S|\S/, FIL[k]) : d;
  }
  document.querySelectorAll('[data-ph]').forEach(e => { e.placeholder = t(e.dataset.ph); });
}

// ---- Sitting alert and screen wake lock ----
let sinceMove = 0, warned = false, lastTick = Date.now(), wl = null, wlWanted = false;
const resetSit = () => { sinceMove = 0; warned = false; $('warn').classList.add('hidden'); };
async function wake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.onrelease = () => { wl = null; }; }
    else if (!on && wl) { await wl.release(); wl = null; }
  } catch { wl = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wlWanted) wake(true); });

const PAL = ['#7C5CFF', '#1FB894', '#E85D8F', '#E8A020', '#3B82F6'];
const FACES = {
  happy: '<circle class="eye" cx="94" cy="56" r="2.2"/><circle class="eye" cx="106" cy="56" r="2.2"/><path d="M93 64Q100 70 107 64"/>',
  proud: '<circle class="eye" cx="94" cy="56" r="2.2"/><circle class="eye" cx="106" cy="56" r="2.2"/><path d="M91 63Q100 74 109 63"/><circle class="spark" cx="124" cy="38" r="3"/>',
  sleepy: '<path d="M90 56h7M103 56h7"/><path d="M95 65h10"/>'
};
// Each stretch gets its own outfit colour. Eye and neck stretches add glasses.
const figSvg = (id, cls = '', mood = 'happy') => {
  const i = STRETCHES.findIndex(s => s.id === id), glasses = STRETCHES[i]?.eyes;
  return `<svg class="fig s-${id.startsWith('c_') ? 'custom' : id} ${cls}" style="--outfit:${PAL[i % 5]}" viewBox="0 0 200 210" role="img" aria-label="Animated stretch demonstration">
  <g class="furniture"><rect x="60" y="150" width="80" height="9" rx="4.5"/><line x1="100" y1="158" x2="100" y2="196"/><line x1="74" y1="199" x2="126" y2="199"/></g>
  <g class="body">
    <g class="legs"><line x1="92" y1="140" x2="88" y2="192"/><line x1="108" y1="140" x2="112" y2="192"/></g>
    <g class="upper">
      <line class="torso" x1="100" y1="80" x2="100" y2="142"/>
      <g class="shoulders">
        <g class="armL"><line x1="84" y1="90" x2="78" y2="132"/></g>
        <g class="armR"><line x1="116" y1="90" x2="122" y2="132"/></g>
      </g>
      <g class="head"><circle cx="100" cy="58" r="15"/>${FACES[mood]}${glasses ? '<circle class="glass" cx="94" cy="56" r="6"/><circle class="glass" cx="106" cy="56" r="6"/>' : ''}</g>
    </g>
  </g>
  <g class="far"><line x1="118" y1="56" x2="186" y2="30"/><circle cx="190" cy="28" r="7"/></g>
</svg>`;
};
const save = () => localStorage.setItem(KEY, JSON.stringify(store));
const day = (off = 0) => (store.days[dayKey(off)] ||= { done: 0, skipped: 0, sit: 0 });

let st = { mode: 'idle', endAt: 0, total: 0, workStart: 0, last: null, demo: false };
let ac = null;

// ---- Sound and notifications ----
function initAudio() {
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch {}
}
function chime(notes) {
  if (!store.settings.sound || !ac) return;
  const t0 = ac.currentTime;
  notes.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.22;
    o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.start(t); o.stop(t + 0.65);
  });
}
async function askNotify() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  return Notification.permission === 'granted';
}
function notify(body) {
  if (!store.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification('Deskbound: time to move', { body });
  n.onclick = () => { window.focus(); n.close(); };
}

// ---- Session flow ----
const workMs = () => store.settings.mins * 60000;

function startWork() {
  st = { ...st, mode: 'work', total: workMs(), endAt: Date.now() + workMs(), workStart: Date.now(), demo: false, paused: false };
  render();
}
function addSit() {
  if (st.workStart) day().sit += Math.round((Date.now() - st.workStart) / 1000);
  st.workStart = 0;
}
function startBreak(demo = false) {
  if (!demo) addSit();
  const set = store.settings.focus === 'eyes' ? STRETCHES.filter(x => x.eyes) : STRETCHES.filter(x => store.settings.routine.includes(x.id));
  const base = set.length ? set : STRETCHES;
  const pool = base.filter(x => x.id !== st.last);
  const opts = pool.length ? pool : base;
  const s = opts[Math.floor(Math.random() * opts.length)];
  st = { ...st, mode: 'break', cur: s, last: s.id, total: breakMs(), endAt: Date.now() + breakMs(), demo, resume: demo && st.mode === 'work' ? { left: st.paused ? st.pausedLeft : Math.max(0, st.endAt - Date.now()), total: st.total } : null };
  $('s-name').textContent = sname(s);
  $('s-tip').textContent = stip(s);
  $('fig-wrap').innerHTML = figSvg(s.id, 'w-52 h-52', moodNow());
  chime([659, 880]);
  notify(sname(s) + ': ' + stip(s));
  save(); render();
}
function finishBreak(done) {
  if (done) resetSit();
  if (st.demo && st.resume) { const r = st.resume; st = { ...st, mode: 'work', demo: false, resume: null, total: r.total, endAt: Date.now() + r.left, workStart: Date.now(), paused: false }; render(); return; }
  if (!st.demo) { done ? day().done++ : day().skipped++; (day().log ||= []).push(done ? 'd' : 's'); }
  if (done) chime([523, 659, 784]);
  save();
  if (st.demo) { st.mode = 'idle'; render(); } else startWork();
}
function stopSession() { addSit(); st.mode = 'idle'; st.paused = false; save(); render(); }

function pauseToggle() {
  if (st.mode !== 'work') return;
  if (st.paused) { st.endAt = Date.now() + st.pausedLeft; st.workStart = Date.now(); st.paused = false; }
  else { st.pausedLeft = Math.max(0, st.endAt - Date.now()); addSit(); st.paused = true; }
  render();
}
function snooze() {
  if (st.demo && !st.resume) { st.mode = 'idle'; render(); return; }
  st = { ...st, resume: null, demo: false, mode: 'work', total: 300000, endAt: Date.now() + 300000, workStart: Date.now(), paused: false };
  render();
}

function streakCount() {
  let s = 0, i = store.days[dayKey()]?.done ? 0 : 1;
  while (store.days[dayKey(i)]?.done) { s++; i++; }
  return s;
}
// The figure's mood follows how today is going.
function moodNow() {
  const d = day();
  if (d.skipped >= 2 && d.skipped > d.done) return 'sleepy';
  return streakCount() >= 3 || d.done >= 4 ? 'proud' : 'happy';
}

// ---- Pop-out timer (Document Picture-in-Picture, Chrome and Edge) ----
let pip = null;
async function popOut() {
  if (pip) { pip.close(); return; }
  try {
    pip = await documentPictureInPicture.requestWindow({ width: 250, height: 140 });
    const cs = getComputedStyle(document.documentElement);
    pip.bg = cs.getPropertyValue('--bg'); pip.fg = cs.getPropertyValue('--ink');
    pip.document.body.style.cssText = 'margin:0;height:100vh;display:grid;place-items:center;text-align:center;font-family:system-ui,sans-serif';
    pip.document.body.innerHTML = '<div><div id="pt" style="font:800 46px Georgia,serif">--:--</div><div id="ps" style="font-size:14px;font-weight:600"></div></div>';
    pip.addEventListener('pagehide', () => { pip = null; });
    render();
  } catch { pip = null; }
}
function updatePip(left) {
  if (!pip) return;
  const t = pip.document.getElementById('pt'), s = pip.document.getElementById('ps');
  if (!t) return;
  const brk = st.mode === 'break';
  t.textContent = st.mode === 'idle' ? '--:--' : fmt(left);
  s.textContent = brk ? 'Stretch: ' + st.cur.name : st.paused ? 'Paused' : st.mode === 'work' ? 'Until your next stretch' : 'Start a session in Deskbound';
  pip.document.body.style.background = brk ? '#1FB894' : pip.bg;
  pip.document.body.style.color = brk ? '#06251D' : pip.fg;
}

// ---- Weekly recap ----
function recapData() {
  let total = 0, skipped = 0, sit = 0, best = { n: 0, name: '' };
  for (let o = 6; o >= 0; o--) {
    const d = store.days[dayKey(o)]; if (!d) continue;
    total += d.done; skipped += d.skipped; sit += d.sit;
    if (d.done > best.n) best = { n: d.done, name: new Date(Date.now() - o * 864e5).toLocaleDateString([], { weekday: 'long' }) };
  }
  const line = total ? `You stretched ${total} time${total === 1 ? '' : 's'} this week. Best day: ${best.name}.` : 'No stretches logged this week yet. Your first one is a minute away.';
  return { total, skipped, best, line, hours: (sit / 3600).toFixed(1), streak: streakCount() };
}
function openRecap() {
  const r = recapData();
  $('recap-card').innerHTML = `<div class="rounded-2xl p-6 text-white" style="background:linear-gradient(135deg,#7C5CFF,#1FB894)">
    <p class="font-semibold">Deskbound weekly recap</p>
    <p class="disp text-6xl font-extrabold my-2">${r.total}</p>
    <p>${r.line}</p>
    <p class="mt-3 text-sm">Streak: ${r.streak} day${r.streak === 1 ? '' : 's'} · ${r.hours} h at your desk · ${r.skipped} skipped</p></div>`;
  $('recap').showModal();
}
function recapImage() {
  const r = recapData(), c = document.createElement('canvas'); c.width = 900; c.height = 500;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 900, 500);
  g.addColorStop(0, '#7C5CFF'); g.addColorStop(1, '#1FB894');
  x.fillStyle = g; x.fillRect(0, 0, 900, 500); x.fillStyle = '#fff';
  x.font = '600 32px sans-serif'; x.fillText('Deskbound weekly recap', 60, 90);
  x.font = '800 200px Georgia, serif'; x.fillText(String(r.total), 60, 300);
  x.font = '600 34px sans-serif'; x.fillText('stretches this week', 60, 355);
  x.font = '28px sans-serif';
  x.fillText(`Best day: ${r.best.name || 'none yet'}   Streak: ${r.streak} day${r.streak === 1 ? '' : 's'}`, 60, 415);
  x.fillText(`${r.hours} h at your desk   ${r.skipped} skipped`, 60, 455);
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'deskbound-recap.png'; a.click();
}

// ---- Rendering ----
const fmt = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function render() {
  const left = st.paused ? st.pausedLeft : Math.max(0, st.endAt - Date.now());
  const breaking = st.mode === 'break', working = st.mode === 'work';
  $('work-panel').classList.toggle('hidden', breaking);
  $('break-panel').classList.toggle('hidden', !breaking);
  $('start').classList.toggle('hidden', working);
  $('stop').classList.toggle('hidden', !working);
  $('try').classList.toggle('hidden', breaking);
  $('pause').classList.toggle('hidden', !working);
  $('pause').textContent = t(st.paused ? 'Resume' : 'Pause');
  document.body.classList.toggle('breaking', breaking);
  if (breaking) $('breath-label').textContent = Math.floor((st.total - left) / 4000) % 2 ? t('Breathe out') : t('Breathe in');
  updatePip(left);
  if (breaking !== wlWanted) { wlWanted = breaking; wake(breaking); }

  if (breaking) {
    $('b-time').textContent = fmt(left);
    $('b-bar').style.width = (100 - left / st.total * 100) + '%';
    document.title = fmt(left) + ' Stretch: ' + st.cur.name;
  } else if (working) {
    $('time').textContent = fmt(left);
    $('state').textContent = t(st.paused ? 'Paused' : store.settings.focus === 'eyes' ? 'Until your next eye break' : 'Until your next stretch');
    $('ring').style.strokeDashoffset = 339.3 * (left / st.total);
    document.title = '(' + fmt(left) + ') Deskbound';
  } else {
    $('time').textContent = fmt(store.settings.mins * 60000);
    $('state').textContent = t('Ready when you are');
    $('ring').style.strokeDashoffset = 339.3;
    document.title = 'Deskbound';
  }
  renderStats();
}

function renderStats() {
  const d = day();
  const live = st.mode === 'work' && !st.paused ? Math.round((Date.now() - st.workStart) / 1000) : 0;
  const mins = Math.round((d.sit + live) / 60);
  $('n-done').textContent = d.done;
  $('n-skip').textContent = d.skipped;
  $('n-sit').textContent = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';

  const streak = streakCount();
  $('dots').innerHTML = (d.log || []).map(x => `<span class="dot ${x === 'd' ? 'd' : ''}" title="${x === 'd' ? 'Stretch done' : 'Skipped'}"></span>`).join('')
    + (st.mode === 'work' ? '<span class="dot n" title="Next break"></span>' : '') || '<span class="text-xs">Your breaks today show up here.</span>';
  const g = store.settings.goal; $('goal-txt').textContent = Math.min(d.done, g) + ' / ' + g + (d.done >= g ? ' \u2713' : ''); $('goal-bar').style.width = Math.min(100, d.done / g * 100) + '%';
  $('streak').textContent = streak + (streak === 1 ? ' day' : ' days');

  const vals = [6, 5, 4, 3, 2, 1, 0].map(o => ({ n: store.days[dayKey(o)]?.done || 0, l: new Date(Date.now() - o * 864e5).toLocaleDateString([], { weekday: 'narrow' }) }));
  const max = Math.max(3, ...vals.map(v => v.n));
  $('week').innerHTML = vals.map(v => `<div class="flex-1 flex flex-col items-center justify-end h-full gap-1">
    <div class="w-full rounded-t-md" style="height:${Math.max(4, v.n / max * 100)}%;background:${v.n ? 'var(--vio)' : 'var(--soft)'}" title="${v.n} stretches"></div>
    <span class="text-xs">${v.l}</span></div>`).join('');
}

// ---- Events ----
$('start').onclick = async () => {
  initAudio();
  if (store.settings.notify) await askNotify();
  startWork();
};
$('stop').onclick = stopSession;
$('try').onclick = () => { initAudio(); startBreak(true); };
$('done').onclick = () => finishBreak(true);
$('skip').onclick = () => finishBreak(false);

$('mins').value = String(store.settings.mins);
$('blen').value = String(store.settings.breakSec); $('goal').value = String(store.settings.goal);
$('blen').onchange = e => { store.settings.breakSec = Number(e.target.value); save(); };
$('goal').onchange = e => { store.settings.goal = Number(e.target.value); save(); render(); };
$('sound').checked = store.settings.sound;
$('notify').checked = store.settings.notify;
$('mins').onchange = e => { store.settings.mins = Number(e.target.value); save(); if (st.mode === 'work') startWork(); render(); };
$('sound').onchange = e => { store.settings.sound = e.target.checked; save(); };
$('notify').onchange = async e => {
  store.settings.notify = e.target.checked;
  if (e.target.checked && !(await askNotify())) {
    e.target.checked = false; store.settings.notify = false;
    alert('Notifications are blocked. Allow them in your browser\'s site settings to use this.');
  }
  save();
};

const applyTheme = th => { document.documentElement.dataset.theme = th; $('theme').textContent = t(th === 'dark' ? 'Light mode' : 'Dark mode'); };
applyTheme(document.documentElement.dataset.theme || 'light');
$('theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; store.settings.theme = t; applyTheme(t); save(); };

$('pause').onclick = pauseToggle;
$('snooze').onclick = snooze;
$('pop').onclick = popOut;
if (!('documentPictureInPicture' in window)) $('pop').classList.add('hidden');
$('recap-btn').onclick = openRecap;
$('recap-img').onclick = recapImage;
$('recap-copy').onclick = async () => {
  const r = recapData();
  await navigator.clipboard.writeText('Deskbound weekly recap: ' + r.line + ' Streak: ' + r.streak + ' days.');
  $('recap-copy').textContent = 'Copied!'; setTimeout(() => { $('recap-copy').textContent = 'Copy text'; }, 1500);
};

// Backup, restore, reset
$('exp').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }));
  a.download = 'deskbound-backup-' + dayKey() + '.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('imp').onclick = () => $('impfile').click();
$('impfile').onchange = async e => {
  try {
    const d = JSON.parse(await e.target.files[0].text());
    if (typeof d !== 'object' || !d.days || !d.settings) throw 0;
    localStorage.setItem(KEY, JSON.stringify(d)); location.reload();
  } catch { alert('That file is not a valid Deskbound backup.'); }
};
$('reset').onclick = () => { if (confirm('Delete all stats and settings? This cannot be undone.')) { localStorage.removeItem(KEY); location.reload(); } };

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); if (st.mode === 'idle') $('start').click(); else if (st.mode === 'work') pauseToggle(); }
  else if (e.key === 'Enter' && st.mode === 'break') $('done').click();
  else if (e.key.toLowerCase() === 's' && st.mode === 'break') $('skip').click();
  else if (e.key.toLowerCase() === 'd') $('theme').click();
});

// First-run welcome
const WSTEPS = document.querySelectorAll('#welcome [data-step]');
let ws = 0;
const wShow = () => { WSTEPS.forEach((el, i) => el.classList.toggle('hidden', i !== ws)); $('w-next').textContent = ws === 2 ? 'Try a stretch' : 'Next'; };
$('welcome').addEventListener('close', () => { store.seen = true; save(); });
$('w-skip').onclick = () => $('welcome').close();
$('w-next').onclick = async () => {
  if (ws === 0) { store.settings.mins = Number($('w-mins').value); $('mins').value = String(store.settings.mins); }
  if (ws === 1) {
    store.settings.sound = $('w-sound').checked; $('sound').checked = store.settings.sound;
    store.settings.notify = $('w-notify').checked && await askNotify(); $('notify').checked = store.settings.notify;
  }
  if (ws === 2) { $('welcome').close(); initAudio(); startBreak(true); return; }
  ws++; save(); wShow();
};
if (!store.seen) { wShow(); $('welcome').showModal(); }

$('focus').value = store.settings.focus;
$('focus').onchange = e => { store.settings.focus = e.target.value; save(); render(); };

function renderLibrary() {
  $('library').innerHTML = STRETCHES.map(s => {
    const on = store.settings.routine.includes(s.id);
    return `<label class="lib panel p-4 flex gap-3 cursor-pointer" style="${on ? 'border-color:var(--vio)' : ''}">
    ${figSvg(s.id, 'w-20 h-20 shrink-0')}
    <span class="min-w-0">
      <span class="flex items-center gap-2 font-bold"><input type="checkbox" data-id="${s.id}" ${on ? 'checked' : ''} class="w-5 h-5"> ${esc(sname(s))}</span>
      <span class="block text-sm mt-1">${esc(stip(s))}</span>
      ${s.eyes ? '<span class="block text-xs mt-1 font-semibold" style="color:var(--mint)">Eyes and neck</span>' : ''}
      ${s.custom ? `<button type="button" data-del="${s.id}" class="text-xs font-semibold underline mt-1">Delete</button>` : ''}
    </span></label>`;
  }).join('');
  applyLang();
}
renderLibrary();
$('cform').onsubmit = e => {
  e.preventDefault();
  const name = $('c-name').value.trim(), tip = $('c-tip').value.trim(); if (!name || !tip) return;
  const c = { id: 'c_' + Date.now().toString(36), name, tip, custom: 1 };
  store.custom.push(c); STRETCHES = [...BASE, ...store.custom]; store.settings.routine.push(c.id);
  save(); e.target.reset(); renderLibrary();
};
$('library').onclick = e => {
  const id = e.target.dataset.del; if (!id) return;
  store.custom = store.custom.filter(x => x.id !== id); STRETCHES = [...BASE, ...store.custom];
  store.settings.routine = store.settings.routine.filter(x => x !== id); save(); renderLibrary();
};
$('library').onchange = e => {
  const id = e.target.dataset.id; if (!id) return;
  const r = store.settings.routine;
  store.settings.routine = e.target.checked ? [...new Set([...r, id])] : r.filter(x => x !== id);
  e.target.closest('label').style.borderColor = e.target.checked ? 'var(--vio)' : '';
  save();
};

$('lang').value = lang;
$('lang').onchange = e => { lang = e.target.value; store.settings.lang = lang; save(); applyTheme(document.documentElement.dataset.theme); renderLibrary(); render(); };
$('sitwarn').value = String(store.settings.sitwarn);
$('sitwarn').onchange = e => { store.settings.sitwarn = Number(e.target.value); save(); resetSit(); };
$('warn-x').onclick = () => $('warn').classList.add('hidden');
$('warn-go').onclick = () => { $('warn').classList.add('hidden'); $('try').click(); };

// PWA: install button and offline support
let ip;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); ip = e; $('install').classList.remove('hidden'); });
$('install').onclick = async () => { ip.prompt(); await ip.userChoice; $('install').classList.add('hidden'); };
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

// Timestamp-based, so it stays accurate even when the tab is throttled in the background.
setInterval(() => {
  const now = Date.now(); if (st.mode === 'work' && !st.paused) sinceMove += now - lastTick; lastTick = now;
  const lim = store.settings.sitwarn * 60000;
  if (lim && !warned && sinceMove >= lim) { warned = true; $('warn').classList.remove('hidden'); chime([440, 392, 330]); notify(t("You've been sitting for a long time. Stand up and move!")); }
  if (st.mode === 'work' && !st.paused && Date.now() >= st.endAt) startBreak();
  else if (st.mode === 'break' && Date.now() >= st.endAt) finishBreak(true);
  else render();
}, 500);
render();
