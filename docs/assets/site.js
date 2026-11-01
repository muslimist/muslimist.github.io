// shared helpers for every page: translation, settings sheets, saved options

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const AR = localStorage.lang === 'arabic';

// strings are [english, arabic]; pages add their own with i18n({...})
const DICT = {
  quran: ['Quran', 'القرآن'], duaa: ['Duaa', 'أدعية'], times: ['Times', 'أوقات'], qibla: ['Qibla', 'القبلة'], dash: ['Dash', 'لوحتي'],
  madewith: ['made with', 'صُنع بـ'], bymuslims: ['by muslims for muslims', 'من المسلمين للمسلمين'], privacy: ['privacy', 'الخصوصية'], privacynote: ["we don't track anything, see for yourself =)", 'نحن لا نتتبع أي شيء، تحقق بنفسك =)'],
  settings: ['Settings', 'الإعدادات'], close: ['Close', 'إغلاق'], reset: ['Reset', 'إعادة تعيين'],
};
const t = k => (DICT[k] || [k])[AR ? 1 : 0];
function i18n(dict) {
  Object.assign(DICT, dict);
  if (!AR) return;
  $$('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  $$('[data-t-placeholder]').forEach(e => e.placeholder = t(e.dataset.tPlaceholder));
  $$('[data-t-label]').forEach(e => e.setAttribute('aria-label', t(e.dataset.tLabel)));
}

// saved options: one JSON object per page in localStorage
function load(key, defaults) {
  try { return { ...defaults, ...JSON.parse(localStorage[key] || '{}') } } catch { return { ...defaults } }
}
const save = (key, obj) => localStorage[key] = JSON.stringify(obj);


// appearance pickers in the footer: mode (auto/light/dark) and glass level (clear/glass/frosted/solid)
function picker(key, options) {
  const sel = document.createElement('select');
  sel.setAttribute('aria-label', t(key));
  sel.innerHTML = options.map(([v, k]) => `<option value="${v}">${t(k).toLowerCase()}</option>`).join('');
  sel.value = localStorage[key] || '';
  sel.onchange = () => {
    if (sel.value) localStorage[key] = sel.value; else localStorage.removeItem(key);
    if (key === 'mode') scheme(); else if (sel.value) document.documentElement.dataset[key] = sel.value; else delete document.documentElement.dataset[key];
  };
  $('.foot').append(sel);
}
// light/dark: saved choice, or follow the system (and keep following it while the page is open)
const systemLight = matchMedia('(prefers-color-scheme: light)');
const scheme = () => document.documentElement.dataset.scheme = localStorage.mode || (systemLight.matches ? 'light' : 'dark');
systemLight.addEventListener('change', scheme);
Object.assign(DICT, {
  mode: ['Mode', 'الوضع'], auto: ['Auto', 'تلقائي'], light: ['Light', 'فاتح'], dark: ['Dark', 'داكن'],
  glass: ['Style', 'النمط'], clear: ['Clear', 'شفاف'], glassy: ['Glass', 'زجاجي'], frosted: ['Frosted', 'ضبابي'], solid: ['Solid', 'بسيط'],
});
picker('mode', [['', 'auto'], ['light', 'light'], ['dark', 'dark']]);
picker('glass', [['clear', 'clear'], ['', 'glassy'], ['frosted', 'frosted'], ['solid', 'solid']]);

// language toggle, last in the footer
const langBtn = document.createElement('button');
langBtn.textContent = AR ? 'english' : 'عربي';
langBtn.onclick = () => { localStorage.lang = AR ? 'english' : 'arabic'; location.reload() };
$('.foot').append(langBtn);

// fade the page photo in once it has loaded
{
  const url = getComputedStyle(document.documentElement).getPropertyValue('--bg-img').match(/url\(["']?([^"')]+)/)?.[1];
  const done = () => document.documentElement.classList.add('bg-ready');
  if (url) { const img = new Image(); img.onload = img.onerror = done; img.src = url } else done();
}

// background slideshow: every ~20s fade to another photo from this page's set
const BG_COUNT = { home: 7, quran: 6, duaa: 6, times: 6, qibla: 6 };
const bgMatch = getComputedStyle(document.documentElement).getPropertyValue('--bg-img').match(/bg-(\w+)-(\d+)\.webp/);
if (bgMatch && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const [, pool] = bgMatch, root = document.documentElement;
  let cur = +bgMatch[2];
  setInterval(() => {
    if (document.hidden || root.dataset.glass === 'solid') return;
    const next = (cur + 1 + Math.floor(Math.random() * (BG_COUNT[pool] - 1))) % BG_COUNT[pool];
    const url = `/assets/img/bg-${pool}-${next}.webp`, img = new Image();
    img.onload = () => {
      root.style.setProperty('--bg-next', `url(${url})`);
      root.classList.add('swap');
      setTimeout(() => { root.style.setProperty('--bg-img', `url(${url})`); root.classList.remove('swap'); cur = next }, 2600);
    };
    img.src = url;
  }, 20e3);
}

// settings sheets: [data-open=id] opens, tapping outside closes
$$('[data-open]').forEach(b => b.onclick = () => document.getElementById(b.dataset.open).showModal());
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close() }));

i18n({});

// show the page once its own script has filled it in (pages can set window.pageReady to a promise to wait
// for data); never wait more than 1.5s
addEventListener('DOMContentLoaded', () =>
  Promise.race([window.pageReady, new Promise(r => setTimeout(r, 1500))]).finally(() =>
    requestAnimationFrame(() => document.documentElement.classList.add('ready'))));
