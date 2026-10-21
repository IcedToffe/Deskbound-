// Deskbound features. Load AFTER app.js. It reuses app.js globals: store, $, save, day, dayKey, streakCount, render, startWork, sname, esc, STRETCHES.
(() => {
  const S = store.settings;
  store.stats ||= { done: {}, skip: {} };
  store.badges ||= {};
  const totalDone = () => Object.values(store.days).reduce((n, d) => n + (d.done || 0), 0);

  // ---------- 1. Track every stretch by id (wraps finishBreak, no edits to app.js) ----------
  const origFinish = finishBreak;
  finishBreak = function (done) {
    const cur = st.cur, real = st.mode === 'break' && !st.demo, before = day().done;
    origFinish(done);
    if (!real || !cur) return;
    const k = done ? 'done' : 'skip';
    store.stats[k][cur.id] = (store.stats[k][cur.id] || 0) + 1;
    save();
    if (done && before < S.goal && day().done >= S.goal) { confetti(); toast('Daily goal reached!'); }
    checkBadges();
  };

  // ---------- 2. Badges ----------
  const ICON = {
    check: 'M5 12l5 5L20 7',
    flame: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z',
    star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
    target: 'M12 12m-8 0a8 8 0 1016 0a8 8 0 10-16 0M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0',
    plus: 'M12 5v14M5 12h14'
  };
  const BADGES = [
    { id: 'first', name: 'First stretch', desc: 'Finish 1 stretch', ic: 'check', ok: () => totalDone() >= 1 },
    { id: 'goal', name: 'Goal crusher', desc: 'Hit your daily goal', ic: 'target', ok: () => day().done >= S.goal },
    { id: 'streak7', name: '7-day streak', desc: 'Stretch 7 days in a row', ic: 'flame', ok: () => streakCount() >= 7 },
    { id: 'fifty', name: '50 stretches', desc: 'Finish 50 stretches', ic: 'star', ok: () => totalDone() >= 50 },
    { id: 'own', name: 'Your own move', desc: 'Add a custom stretch', ic: 'plus', ok: () => store.custom.length > 0 }
  ];
  function checkBadges(silent) {
    BADGES.forEach(b => {
      if (!store.badges[b.id] && b.ok()) {
        store.badges[b.id] = dayKey(); save();
        if (!silent) toast('Badge unlocked: ' + b.name);
      }
    });
  }

  // ---------- 3. Toast and confetti ----------
  document.body.insertAdjacentHTML('beforeend', '<div id="toast" role="status" aria-live="polite"></div>');
  let toastT;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.id = 'confetti'; c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const x = c.getContext('2d'), cols = ['#7C5CFF', '#1FB894', '#E85D8F', '#E8A020', '#3B82F6'];
    const ps = Array.from({ length: 90 }, () => ({ x: c.width / 2, y: c.height * .6, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * 5)] }));
    const t0 = performance.now();
    (function frame(t) {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r * .6); });
      t - t0 < 1800 ? requestAnimationFrame(frame) : c.remove();
    })(t0);
  }

  // ---------- 4. Insights dialog ----------
  document.body.insertAdjacentHTML('beforeend', `<dialog id="insights"><div id="ins-body"></div>
    <div class="mt-4"><button class="btn soft" onclick="this.closest('dialog').close()">Close</button></div></dialog>`);
  $('recap-btn').insertAdjacentHTML('afterend', '<button id="ins-btn" class="btn soft mt-2 w-full">Insights & badges</button>');

  function openInsights() {
    checkBadges(true);
    const total = totalDone(), mins = Math.round(total * S.breakSec / 60);
    // Best weekday
    const wd = [0, 0, 0, 0, 0, 0, 0];
    Object.entries(store.days).forEach(([k, d]) => { wd[new Date(k + 'T00:00').getDay()] += d.done || 0; });
    const bestIdx = wd.indexOf(Math.max(...wd));
    const bestDay = Math.max(...wd) ? new Date(2024, 0, 7 + bestIdx).toLocaleDateString([], { weekday: 'long' }) : 'n/a';
    // Most skipped stretch
    const skips = Object.entries(store.stats.skip).sort((a, b) => b[1] - a[1])[0];
    const sk = skips && STRETCHES.find(s => s.id === skips[0]);
    // Heatmap: 12 weeks, columns start on Sunday
    const dow = new Date().getDay(); let cells = '';
    for (let o = 11 * 7 + dow; o >= 0; o--) {
      const n = store.days[dayKey(o)]?.done || 0, lv = n ? Math.min(4, Math.ceil(n / S.goal * 4)) : 0;
      cells += `<i title="${dayKey(o)}: ${n} stretches" style="${lv ? `background:color-mix(in srgb,var(--mint) ${lv * 25}%,var(--soft))` : ''}"></i>`;
    }
    const tip = sk && skips[1] >= 3 && !sk.eyes && S.focus !== 'eyes'
      ? `<p class="mt-4 text-sm"><b>Smart suggestion:</b> you skip "${esc(sname(sk))}" most (${skips[1]} times). Try Tired eyes mode, which has gentler moves?
         <button id="ins-eyes" class="chip ml-1">Switch</button></p>` : '';
    $('ins-body').innerHTML = `
      <h2 class="disp text-3xl font-extrabold">Insights</h2>
      <div class="grid grid-cols-3 gap-2 mt-4">
        <div class="tile"><div class="disp text-2xl font-extrabold">${total}</div><div class="text-xs">stretches</div></div>
        <div class="tile"><div class="disp text-2xl font-extrabold">~${mins}</div><div class="text-xs">minutes moving</div></div>
        <div class="tile"><div class="disp text-2xl font-extrabold">${bestDay.slice(0, 3)}</div><div class="text-xs">best weekday</div></div>
      </div>
      <h3 class="font-bold mt-5 mb-2">Last 12 weeks</h3><div class="heat" role="img" aria-label="Heatmap of stretches per day">${cells}</div>
      ${sk ? `<p class="mt-3 text-sm">Most skipped: <b>${esc(sname(sk))}</b> (${skips[1]}x)</p>` : ''}${tip}
      <h3 class="font-bold mt-5 mb-2">Badges</h3>
      <div class="grid sm:grid-cols-2 gap-2">${BADGES.map(b => `<div class="badge ${store.badges[b.id] ? 'on' : ''}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[b.ic]}"/></svg>
        <div><div class="font-bold text-sm">${b.name}</div><div class="text-xs">${store.badges[b.id] ? 'Unlocked ' + store.badges[b.id] : b.desc}</div></div></div>`).join('')}</div>`;
    $('ins-eyes')?.addEventListener('click', () => { S.focus = 'eyes'; $('focus').value = 'eyes'; save(); render(); $('insights').close(); toast('Tired eyes mode on'); });
    $('insights').showModal();
  }
  $('ins-btn').onclick = openInsights;

  // ---------- 5. Personalize panel: presets, accent colour, high contrast ----------
  const PRESETS = { Study: { mins: 25, breakSec: 60, goal: 5 }, 'Deep work': { mins: 45, breakSec: 120, goal: 8 }, 'Light day': { mins: 30, breakSec: 30, goal: 3 } };
  const ACCENTS = { violet: '#7C5CFF', rose: '#D6336C', ocean: '#2563EB', forest: '#15803D' };
  document.querySelector('aside').lastElementChild.insertAdjacentHTML('beforebegin', `
    <section class="panel p-5"><h2 class="font-bold text-lg mb-3">Personalize</h2>
      <p class="text-sm font-semibold mb-2">Presets</p>
      <div class="flex flex-wrap gap-2" id="presets">${Object.keys(PRESETS).map(k => `<button class="chip" data-p="${k}" aria-pressed="false">${k}</button>`).join('')}</div>
      <p class="text-sm font-semibold mt-4 mb-2">Accent colour</p>
      <div class="flex gap-3" id="accents">${Object.entries(ACCENTS).map(([k, c]) => `<button class="swatch" data-a="${k}" aria-label="${k}" aria-pressed="false" style="background:${c}"></button>`).join('')}</div>
      <label class="flex items-center gap-2 font-semibold mt-4 text-sm"><input id="hc" type="checkbox" class="w-5 h-5"> High contrast</label>
    </section>`);

  const html = document.documentElement;
  const syncPresets = () => document.querySelectorAll('#presets .chip').forEach(b => {
    const p = PRESETS[b.dataset.p]; b.setAttribute('aria-pressed', p.mins === S.mins && p.breakSec === S.breakSec && p.goal === S.goal);
  });
  $('presets').onclick = e => {
    const p = PRESETS[e.target.dataset.p]; if (!p) return;
    Object.assign(S, p); $('mins').value = String(p.mins); $('blen').value = String(p.breakSec); $('goal').value = String(p.goal);
    save(); if (st.mode === 'work') startWork(); render(); syncPresets(); toast(e.target.dataset.p + ' preset applied');
  };
  ['mins', 'blen', 'goal'].forEach(id => $(id).addEventListener('change', syncPresets));
  syncPresets();

  const setAccent = a => {
    a === 'violet' ? html.removeAttribute('data-accent') : html.dataset.accent = a;
    document.querySelectorAll('#accents .swatch').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === a));
    S.accent = a; save();
  };
  $('accents').onclick = e => e.target.dataset.a && setAccent(e.target.dataset.a);
  setAccent(S.accent || 'violet');

  $('hc').checked = !!S.contrast;
  const setContrast = on => { on ? html.dataset.contrast = 'high' : html.removeAttribute('data-contrast'); S.contrast = on; save(); };
  $('hc').onchange = e => setContrast(e.target.checked);
  if (S.contrast) setContrast(true);

  // ---------- 6. Library: search and category filter ----------
  const CAT = { neck: 'Neck', neckturn: 'Neck', chin: 'Neck', eyes: 'Eyes', eyecircle: 'Eyes', shrug: 'Shoulders', open: 'Shoulders', reach: 'Shoulders', bend: 'Back', stand: 'Legs' };
  const CATS = ['All', 'Neck', 'Eyes', 'Shoulders', 'Back', 'Legs', 'Custom'];
  let q = '', cat = 'All';
  $('library').insertAdjacentHTML('beforebegin', `<div class="flex flex-wrap items-center gap-2 mb-4">
    <input id="lib-q" class="cin" placeholder="Search stretches" aria-label="Search stretches">
    <div id="lib-cats" class="flex flex-wrap gap-2">${CATS.map(c => `<button class="chip" data-c="${c}" aria-pressed="${c === 'All'}">${c}</button>`).join('')}</div></div>`);
  function applyFilter() {
    [...$('library').children].forEach(card => {
      const id = card.querySelector('input')?.dataset.id || '', c = CAT[id] || 'Custom';
      const ok = (cat === 'All' || c === cat) && card.textContent.toLowerCase().includes(q);
      card.style.display = ok ? '' : 'none';
    });
  }
  const origLib = renderLibrary;
  renderLibrary = function () { origLib(); applyFilter(); };
  $('lib-q').oninput = e => { q = e.target.value.trim().toLowerCase(); applyFilter(); };
  $('lib-cats').onclick = e => {
    if (!e.target.dataset.c) return; cat = e.target.dataset.c;
    document.querySelectorAll('#lib-cats .chip').forEach(b => b.setAttribute('aria-pressed', b === e.target));
    applyFilter();
  };

  // ---------- 7. Sound styles (replaces the default chime, custom uploads still win) ----------
  const TONES = { soft: ['sine', .25, .6], bell: ['triangle', .32, 1.2], pluck: ['square', .07, .3] };
  chime = function (notes) {
    if (!S.sound || !ac) return;
    const [type, vol, len] = TONES[S.tone] || TONES.soft, t0 = ac.currentTime;
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * .22;
      o.type = type; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + len);
      o.start(t); o.stop(t + len + .05);
    });
  };
  $('hc').closest('label').insertAdjacentHTML('beforebegin', `<label class="flex flex-col gap-1 font-semibold text-sm mt-4">Chime style
    <select id="tone"><option value="soft">Soft</option><option value="bell">Bell</option><option value="pluck">Pluck</option></select></label>`);
  $('tone').value = S.tone || 'soft';
  $('tone').onchange = e => { S.tone = e.target.value; save(); initAudio(); chime([659, 880]); };

  // ---------- 8. Keyboard shortcuts dialog (press ?) ----------
  document.body.insertAdjacentHTML('beforeend', `<dialog id="keys"><h2 class="disp text-2xl font-extrabold">Keyboard shortcuts</h2>
    <ul class="mt-3 grid gap-1 text-sm"><li><b>Space</b> start or pause</li><li><b>Enter</b> I did it</li><li><b>S</b> skip this stretch</li><li><b>D</b> dark mode</li><li><b>?</b> this list</li></ul>
    <button class="btn soft mt-4" onclick="this.closest('dialog').close()">Close</button></dialog>`);
  document.addEventListener('keydown', e => {
    if (e.key !== '?' || document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    $('keys').showModal();
  });

  // Award a badge when a custom stretch is added
  $('cform').addEventListener('submit', () => setTimeout(checkBadges, 0));
  checkBadges(true);
})();
