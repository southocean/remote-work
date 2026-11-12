// Per-browser persistence; the page works without it.
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

// Checklists
const done = store.get('rw-done', {});
const items = [...document.querySelectorAll('.check li')];
function progress() {
  const n = items.filter(li => li.classList.contains('done')).length;
  document.getElementById('ptext').textContent = `${n} / ${items.length} done`;
  document.getElementById('pbar').style.width = (100 * n / items.length) + '%';
}
items.forEach(li => {
  li.tabIndex = 0;
  li.setAttribute('role', 'checkbox');
  const set = on => { li.classList.toggle('done', on); li.setAttribute('aria-checked', on); };
  set(!!done[li.dataset.id]);
  const toggle = e => {
    if (e.target.closest('a')) return;
    const on = !li.classList.contains('done');
    set(on); done[li.dataset.id] = on; store.set('rw-done', done); progress();
  };
  li.addEventListener('click', toggle);
  li.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(e); } });
});
progress();

// Notes
const notes = document.getElementById('notes');
notes.value = store.get('rw-notes', '');
notes.addEventListener('input', () => store.set('rw-notes', notes.value));

// Extra detail opens by default on desktop, stays collapsed on phones
if (matchMedia('(min-width: 641px)').matches) document.querySelectorAll('details.more').forEach(d => d.open = true);

// Budget (thousand VND per month)
const LINES = [['rent', 'Rent'], ['util', 'Electricity & water'], ['food', 'Food'], ['gym', 'Gym'], ['move', 'Transport'], ['net', 'Internet / SIMs'], ['misc', 'Fun & misc']];
const PRESETS = {
  sgn:       { rent: 15000, util: 1500, food: 9000, gym: 1000, move: 1500, net: 350, misc: 4000 },
  sgn_cheap: { rent: 9000,  util: 1200, food: 7500, gym: 500,  move: 1500, net: 350, misc: 3000 },
  dad:       { rent: 10000, util: 1200, food: 7000, gym: 600,  move: 1800, net: 350, misc: 2500 },
  dli:       { rent: 7000,  util: 500,  food: 6000, gym: 500,  move: 1800, net: 350, misc: 2000 },
  vtu:       { rent: 8000,  util: 1200, food: 6500, gym: 500,  move: 1200, net: 350, misc: 2000 }
};
const saved = store.get('rw-budget', null);
const city = document.getElementById('bcity'), rate = document.getElementById('brate'), box = document.getElementById('blines');
let vals = saved ? saved.vals : { ...PRESETS.sgn };
if (saved) { city.value = saved.city; rate.value = saved.rate; }
const fmt = n => Math.round(n).toLocaleString('sv-SE');
function render() {
  box.innerHTML = LINES.map(([k, label]) =>
    `<label class="bl">${label}<span><input type="number" step="100" data-k="${k}" value="${vals[k]}"> k₫</span></label>`).join('');
  box.querySelectorAll('input').forEach(i => i.addEventListener('input', () => { vals[i.dataset.k] = +i.value || 0; total(); }));
  total();
}
function total() {
  const t = Object.values(vals).reduce((a, b) => a + b, 0) * 1000;
  const r = +rate.value || 2750;
  document.getElementById('btot').textContent = (t / 1e6).toFixed(1) + ' M ₫';
  document.getElementById('bsek').textContent = fmt(t / r) + ' kr';
  document.getElementById('b5').textContent = fmt(5 * t / r) + ' kr';
  store.set('rw-budget', { city: city.value, rate: rate.value, vals });
}
city.addEventListener('change', () => { vals = { ...PRESETS[city.value] }; render(); });
rate.addEventListener('input', total);
render();

// Tabs: one section at a time, picked by the URL hash (#work etc.)
const links = [...document.querySelectorAll('.nav a')];
const sections = [...document.querySelectorAll('main section')];
function show(id, scroll) {
  if (!sections.some(s => s.id === id)) id = sections[0].id;
  sections.forEach(s => s.hidden = s.id !== id);
  links.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('on', on);
    if (on) { a.setAttribute('aria-current', 'page'); a.parentElement.scrollLeft = a.offsetLeft - (a.parentElement.clientWidth - a.offsetWidth) / 2; }
    else a.removeAttribute('aria-current');
  });
  const top = document.querySelector('.hero').offsetHeight;
  if (scroll && scrollY > top) scrollTo(0, top);
}
addEventListener('hashchange', () => show(location.hash.slice(1), true));
show(location.hash.slice(1), false);

// Laptop shortlist, rendered from laptops.json (updated by cloud routines: daily, plus hourly on weekdays)
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const kr = n => n == null ? '–' : Number(n).toLocaleString('en-US');
  const link = (it, label) => /^https:\/\//.test(it.url || '') ? `<a href="${esc(it.url)}" target="_blank" rel="noopener"><b>${esc(label)}</b></a>` : `<b>${esc(label)}</b>`;
  function render(d) {
  $('lt-status').innerHTML = `Last checked <b>${esc(d.checked)}${d.checked_at ? ' ' + esc(d.checked_at) : ''}</b>. ${md(d.status)}`;
  const items = d.items || [];
  $('lt-picks').innerHTML = items.filter(i => i.pick).map(i =>
    `<div class="card accent"><b>${esc(i.pick)}</b><p>${link(i, i.model)}, ${esc(i.spec)}, ${esc(i.grade)}<br><span class="price">${i.approx ? '~' : ''}${kr(i.price_ex)} kr</span> <span class="muted small">· ${esc(i.shop)}${i.price_incl ? ` (${kr(i.price_incl)} incl.)` : ''}</span><br>${md(i.pick_text)}</p></div>`).join('');
  const sb = d.strong_buy;
  if (sb) {
    $('lt-floor-note').innerHTML = md(sb.note);
    $('lt-floor').innerHTML = (sb.rows || []).map(r =>
      `<tr><td>${esc(r.model)}</td><td><b>${kr(r.max)} kr</b></td><td class="opt">${r.pct ? r.pct + '%' : '–'}</td></tr>`).join('');
  }
  $('lt-rows').innerHTML = items.map(i =>
    `<tr${i.highlight ? ' class="hl"' : ''}><td>${link(i, i.model)}<span class="spec">${esc(i.spec)}</span></td><td>${i.approx ? "~" : ""}${kr(i.price_ex)}</td><td>${md(i.why)}</td><td class="opt">${esc(i.shop)} · ${esc(i.grade)}${i.price_incl ? ` (${kr(i.price_incl)} incl.)` : ''}</td></tr>`).join('');
  const r = d.new_reference;
  if (r) $('lt-ref').innerHTML = `For comparison, new: ${link(r, r.model)}: <b>${kr(r.price_ex)} kr</b> ex moms at ${esc(r.shop)}. ${md(r.note)}`;
  $('lt-notes').innerHTML = (d.notes || []).map(n => `<p class="muted small">${md(n)}</p>`).join('');
  $('lt-changes').innerHTML = (d.changes || []).slice(0, 30).map(c => `<li><b>${esc(c.date)}</b>: ${md(c.text)}</li>`).join('');
  $('lt-dropped').innerHTML = (d.dropped || []).map(x => `<li>${md(x)}</li>`).join('');
  const pv = d.private;
  if (pv) {
    $('lt-priv-status').innerHTML = `Checked by hand <b>${esc(pv.checked)}</b>. ${md(pv.note)}`;
    $('lt-priv').innerHTML = (pv.items || []).map(i =>
      `<tr><td>${link(i, i.model)}<span class="spec">${esc(i.spec)}</span></td><td>${i.price != null ? kr(i.price) : esc(i.price_label)}</td><td>${md(i.why)}${i.flag ? `<br><span class="flag">${esc(i.flag)}</span>` : ''}</td><td class="opt">${esc(i.site)} · ${esc(i.where)}</td></tr>`).join('');
    $('lt-priv-skip').innerHTML = (pv.skipped || []).map(x => `<li>${md(x)}</li>`).join('');
    const so = pv.sold;
    if (so) {
      $('lt-sold-note').innerHTML = `Checked <b>${esc(so.checked)}</b>. ${md(so.note)}`;
      $('lt-sold').innerHTML = (so.rows || []).map(r =>
        `<tr><td>${esc(r.model)}</td><td><b>${kr(r.median)}</b></td><td>${esc(r.range)}</td><td class="opt">${esc(r.n)}</td></tr>`).join('');
      $('lt-sold-take').innerHTML = (so.takeaways || []).map(x => `<li>${md(x)}</li>`).join('');
    }
  }
  }

  // Deal notifications: anything in the list that this browser hasn't seen before
  const keyOf = i => i.id || i.url;
  const listed = d => [...(d.items || []), ...((d.private && d.private.items) || [])].filter(keyOf);
  const btn = $('lt-notify'), note = $('lt-notify-state');
  const canNotify = 'Notification' in window;
  function showState() {
    if (!canNotify) { btn.hidden = true; note.textContent = 'This browser does not support notifications.'; return; }
    const p = Notification.permission;
    btn.hidden = p !== 'default';
    note.textContent = p === 'granted' ? 'Deal alerts are on in this browser. Keep this page open in a tab; it checks for new listings every 5 minutes.'
      : p === 'denied' ? 'Notifications are blocked for this site. Allow them in the browser\'s site settings to get deal alerts.'
      : 'Get a desktop notification when a new deal is added to the list.';
  }
  btn.addEventListener('click', async () => { await Notification.requestPermission(); showState(); });
  showState();

  function notifyNew(d) {
    const seen = store.get('rw-seen-deals', null);
    const all = listed(d), keys = all.map(keyOf);
    if (seen) {
      const fresh = all.filter(i => !seen.includes(keyOf(i)));
      if (canNotify && Notification.permission === 'granted') fresh.forEach(i => {
        const price = i.price_ex != null ? `~${kr(i.price_ex)} kr ex moms` : i.price != null ? `${kr(i.price)} kr` : (i.price_label || '');
        const n = new Notification(`New deal: ${i.model}`, { body: `${i.spec || ''}\n${price} · ${i.shop || i.site || ''}`, tag: keyOf(i) });
        n.onclick = () => { window.focus(); if (/^https:\/\//.test(i.url || '')) window.open(i.url, '_blank', 'noopener'); n.close(); };
      });
    }
    store.set('rw-seen-deals', [...new Set([...(seen || []), ...keys])].slice(-300));
  }

  let last = '';
  async function load() {
    let text;
    try { text = await (await fetch('laptops.json', { cache: 'no-cache' })).text(); }
    catch { if (!last) $('lt-status').textContent = 'Could not load the shortlist (laptops.json).'; return; }
    if (text === last) return;
    last = text;
    let d;
    try { d = JSON.parse(text); } catch { return; }
    render(d);
    notifyNew(d);
  }
  load();
  setInterval(load, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
