// shared helpers for every page: translation, settings sheets, saved options

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const AR = localStorage.lang === 'arabic';

// strings are [english, arabic]; pages add their own with i18n({...})
const DICT = {
  home: ['Home', 'الرئيسية'], quran: ['Quran', 'القرآن'], duaa: ['Duaa', 'أدعية'], times: ['Times', 'أوقات'], qibla: ['Qibla', 'القبلة'], dash: ['Dash', 'لوحتي'],
  hadith: ['Hadith', 'الحديث'], names: ['Names', 'الأسماء'], calendar: ['Calendar', 'التقويم'], zakat: ['Zakat', 'الزكاة'], salah: ['Salah', 'الصلاة'], ramadan: ['Ramadan', 'رمضان'],
  madewith: ['made with', 'صُنع بـ'], bymuslims: ['by muslims for muslims', 'من المسلمين للمسلمين'], privacy: ['privacy', 'الخصوصية'], privacynote: ["we don't track anything, see for yourself =)", 'نحن لا نتتبع أي شيء، تحقق بنفسك =)'],
  settings: ['Settings', 'الإعدادات'], close: ['Close', 'إغلاق'], reset: ['Reset', 'إعادة تعيين'],
};
const t = k => (DICT[k] || [k])[AR ? 1 : 0];
// inline pair for page text: L('English', 'العربية')
const L = (en, ar) => AR ? ar : en;
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

// backup: everything this site saves lives in this browser; download it as a file, or restore it on another device
Object.assign(DICT, {
  backup: ['backup', 'نسخة احتياطية'], backuptitle: ['Your data', 'بياناتك'], download: ['Download backup', 'تنزيل نسخة احتياطية'], restore: ['Restore from a file', 'استعادة من ملف'],
  backupnote: ['Your settings and progress (Quran, fasts, make-ups, zakat, adhkar…) are saved only in this browser. Download a backup to keep them safe or move them to another phone.', 'إعداداتك وتقدّمك محفوظة في هذا المتصفح فقط. نزّل نسخة احتياطية لحفظها أو نقلها إلى جهاز آخر.'],
  restored: ['Restored. Reloading…', 'تمت الاستعادة. جارٍ إعادة التحميل…'], badfile: ["That file isn't a muslimist backup.", 'هذا الملف ليس نسخة احتياطية من muslimist.'],
  restoreask: ['Replace what is saved here with this backup?', 'استبدال البيانات المحفوظة هنا بهذه النسخة؟'],
});
{
  const SKIP = /^(alerts-last|alerts-sim)$/;
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet'; dlg.id = 'backup';
  dlg.innerHTML = `<form method="dialog"><div class="sheet-head"><h2 tabindex="-1" autofocus>${t('backuptitle')}</h2><button class="close" aria-label="${t('close')}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="note">${t('backupnote')}</p><button type="button" class="btn primary" id="bk-down">${t('download')}</button>
    <label class="btn center" style="cursor:pointer">${t('restore')}<input type="file" accept=".json,application/json" id="bk-file" hidden></label><p class="note" id="bk-msg"></p></form>`;
  document.body.append(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() });
  $('#bk-down').onclick = () => {
    const data = Object.fromEntries(Object.keys(localStorage).filter(k => !SKIP.test(k)).map(k => [k, localStorage[k]]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ muslimist: 1, saved: new Date().toISOString(), data }, null, 1)], { type: 'application/json' }));
    a.download = `muslimist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#bk-file').onchange = async e => {
    try {
      const b = JSON.parse(await e.target.files[0].text());
      if (!b.muslimist || typeof b.data !== 'object') throw 0;
      if (!confirm(t('restoreask'))) return;
      localStorage.clear(); Object.entries(b.data).forEach(([k, v]) => localStorage[k] = v);
      $('#bk-msg').textContent = t('restored'); setTimeout(() => location.reload(), 600);
    } catch { $('#bk-msg').textContent = t('badfile') }
  };
  const btn = document.createElement('button');
  btn.textContent = t('backup'); btn.onclick = () => dlg.showModal();
  $('.foot').append(btn);
}

// language toggle, last in the footer
const langBtn = document.createElement('button');
langBtn.textContent = AR ? 'english' : 'عربي';
langBtn.onclick = () => { localStorage.lang = AR ? 'english' : 'arabic'; location.reload() };
$('.foot').append(langBtn);

// page photo. Each page picks its own (html[data-bg]); to avoid a blank flash while it loads, the head script
// first shows the photo from the previous page (already cached), and it crossfades to the new one here.
{
  const root = document.documentElement;
  const urlOf = v => v?.match(/url\(["']?([^"')]+)/)?.[1];
  const shown = urlOf(getComputedStyle(root).getPropertyValue('--bg-img'));
  const pool = u => u?.match(/bg-(\w+)-\d+/)?.[1];
  // moving between pages that share a photo set (Quran: Read and Progress) keeps the current photo
  const want = pool(shown) && pool(shown) === pool(urlOf(root.dataset.bg)) ? shown : urlOf(root.dataset.bg) || shown;
  const BG_COUNT = { home: 7, quran: 6, duaa: 6, times: 6, qibla: 6 };
  const swapTo = (url, done) => {
    const img = new Image();
    img.onload = () => {
      root.style.setProperty('--bg-next', `url(${url})`);
      root.classList.add('swap');
      setTimeout(() => { root.style.setProperty('--bg-img', `url(${url})`); root.classList.remove('swap'); sessionStorage.bg = `url(${url})`; done?.() }, 2600);
    };
    img.src = url;
  };
  // fade the first photo in once it has loaded (instant when it came from the previous page)
  if (shown) { const img = new Image(); img.onload = img.onerror = () => root.classList.add('bg-ready'); img.src = shown } else root.classList.add('bg-ready');
  if (want && want !== shown) swapTo(want); else if (want) sessionStorage.bg = `url(${want})`;

  // slideshow: every ~20s fade to another photo from this page's set
  const m = want?.match(/bg-(\w+)-(\d+)\.webp/);
  if (m && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const pool = m[1];
    let cur = +m[2];
    setInterval(() => {
      if (document.hidden || root.dataset.glass === 'solid' || root.classList.contains('swap')) return;
      const next = (cur + 1 + Math.floor(Math.random() * (BG_COUNT[pool] - 1))) % BG_COUNT[pool];
      swapTo(`/assets/img/bg-${pool}-${next}.webp`, () => cur = next);
    }, 20e3);
  }
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

// offline support and prayer alerts, on every page
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
{ const s = document.createElement('script'); s.src = '/assets/alerts.js'; s.defer = true; document.head.append(s) }

// sub-page switches (Quran: Read | Progress) slide sideways instead of the usual page fade
const SLIDES = [['/quran/', '/quran/progress/']];
const slideIndex = path => { for (const g of SLIDES) { const i = g.findIndex((p, j) => j ? path.startsWith(p) : path.startsWith(p) && !g.slice(1).some(q => path.startsWith(q))); if (i >= 0) return [g, i] } return [] };
addEventListener('pagereveal', e => {
  const from = window.navigation?.activation?.from?.url;
  if (!e.viewTransition || !from) return;
  const [g1, a] = slideIndex(new URL(from).pathname), [g2, b] = slideIndex(location.pathname);
  if (!g1 || g1 !== g2 || a === b) return;
  e.viewTransition.types.add(b > a ? 'slide-fwd' : 'slide-back');
  // the content is already in place: skip the fade-up that normally follows page load
  document.documentElement.classList.add('ready', 'no-rise');
});
