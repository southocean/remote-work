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

// Highlight current section in nav
const links = [...document.querySelectorAll('.nav a')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section').forEach(s => io.observe(s));
