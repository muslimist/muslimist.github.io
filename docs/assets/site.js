// shared helpers for every page: translation, settings sheets, saved options

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const AR = localStorage.lang === 'arabic';

// strings are [english, arabic]; pages add their own with i18n({...})
const DICT = {
  home: ['Home', 'الرئيسية'], quran: ['Quran', 'القرآن'], duaa: ['Duaa', 'أدعية'], times: ['Times', 'أوقات'], qibla: ['Qibla', 'القبلة'], dash: ['Dashboard', 'لوحة المعلومات'],
  hadith: ['Hadith', 'الحديث'], names: ['Names', 'الأسماء'], calendar: ['Calendar', 'التقويم'], zakat: ['Zakat', 'الزكاة'], salah: ['Salah', 'الصلاة'], ramadan: ['Ramadan', 'رمضان'],
  madewith: ['made with', 'صُنع بـ'], bymuslims: ['by muslims for muslims', 'من المسلمين للمسلمين'], privacy: ['privacy', 'الخصوصية'], privacynote: ["we don't track anything, see for yourself =)", 'نحن لا نتتبع أي شيء، تحقق بنفسك =)'],
  settings: ['Settings', 'الإعدادات'], close: ['Close', 'إغلاق'], reset: ['Reset', 'إعادة تعيين'],
};
const t = k => (DICT[k] || [k])[AR ? 1 : 0];
// saved Quran text may carry tajweed colour markup: keep only <span class="rule"> and plain text, drop anything else
function safeTajweed(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = String(html ?? ''); // template content is inert: nothing in it runs
  const out = document.createElement('div');
  const copy = (from, to) => from.childNodes.forEach(n => {
    if (n.nodeType === 3) to.append(n.textContent);
    else if (n.nodeType === 1 && n.tagName === 'SPAN') { const s = document.createElement('span'); const c = (n.getAttribute('class') || '').replace(/[^a-z_ ]/g, ''); if (c) s.className = c; copy(n, s); to.append(s) }
    else if (n.nodeType === 1 && !/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(n.tagName)) copy(n, to); // other elements: keep their text only
  });
  copy(tpl.content, out);
  return out.innerHTML;
}
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


// light/dark: saved choice, or follow the system (and keep following it while the page is open)
const systemLight = matchMedia('(prefers-color-scheme: light)');
const scheme = () => document.documentElement.dataset.scheme = localStorage.mode || (systemLight.matches ? 'light' : 'dark');
systemLight.addEventListener('change', scheme);

// site settings: appearance, language and your data, in one popup (opened from the menu and the footer)
Object.assign(DICT, {
  settingsbtn: ['settings', 'الإعدادات'],
  mode: ['Mode', 'الوضع'], auto: ['Auto', 'تلقائي'], light: ['Light', 'فاتح'], dark: ['Dark', 'داكن'],
  glass: ['Style', 'النمط'], clear: ['Clear', 'شفاف'], glassy: ['Glass', 'زجاجي'], frosted: ['Frosted', 'ضبابي'], solid: ['Solid', 'بسيط'],
  language: ['Language', 'اللغة'], yourdata: ['Your data', 'بياناتك'],
  download: ['Download backup', 'تنزيل نسخة احتياطية'], restore: ['Restore from a file', 'استعادة من ملف'],
  backupnote: ['Your settings and progress (Quran, fasts, make-ups, zakat, adhkar…) are saved only in this browser. Download a backup to keep them safe or move them to another phone.', 'إعداداتك وتقدّمك محفوظة في هذا المتصفح فقط. نزّل نسخة احتياطية لحفظها أو نقلها إلى جهاز آخر.'],
  restored: ['Restored. Reloading…', 'تمت الاستعادة. جارٍ إعادة التحميل…'], badfile: ["That file isn't a muslimist backup.", 'هذا الملف ليس نسخة احتياطية من muslimist.'],
  restoreask: ['Replace what is saved here with this backup?', 'استبدال البيانات المحفوظة هنا بهذه النسخة؟'],
});
{
  const SKIP = /^(alerts-last|alerts-sim)$/;
  // a backup is only restored as far as it looks like what this site saves: known names, simple values, no markup
  const CHOICE = { lang: ['english', 'arabic'], mode: ['light', 'dark'], glass: ['clear', 'frosted', 'solid'] };
  const JSON_KEYS = /^(times|quran|quran-last|quran-days|quran-bookmarks|khatm|duaa|adhkar|hadith|names|calendar|ramadan|qada|zakat|alerts)$/;
  const OLD_KEYS = /^(times|quran)_[a-z_]{1,30}$/; // settings saved by the older site
  const safeText = s => typeof s === 'string' && s.length <= 500 && !/[<>"`\\]|javascript:/i.test(s);
  const plain = (v, depth = 0) => depth > 6 ? false
    : v === null || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v)) ? true
    : typeof v === 'string' ? safeText(v)
    : Array.isArray(v) ? v.length <= 2000 && v.every(x => plain(x, depth + 1))
    : typeof v === 'object' ? Object.keys(v).length <= 400 && Object.entries(v).every(([k, x]) => safeText(k) && k.length <= 60 && plain(x, depth + 1))
    : false;
  function checkBackup(data) {
    const keep = {}; let skipped = 0;
    for (const [k, v] of Object.entries(data)) {
      let ok = false, val = v;
      try {
        if (typeof v !== 'string' || v.length > 200000) ok = false;
        else if (CHOICE[k]) ok = CHOICE[k].includes(v);
        else if (OLD_KEYS.test(k)) ok = v.length <= 500 && !/[<>`]|javascript:/i.test(v); // may hold a small JSON list
        else if (JSON_KEYS.test(k)) {
          const o = JSON.parse(v);
          if (k === 'quran-last' && o && typeof o === 'object') { o.ar = safeTajweed(o.ar); o.tr = safeTajweed(o.tr); val = JSON.stringify(o); ok = plain({ ...o, ar: '', tr: '' }) }
          else ok = !!o && typeof o === 'object' && plain(o);
        }
      } catch { ok = false }
      if (ok) keep[k] = val; else skipped++;
    }
    return { keep, skipped };
  }
  const seg = (key, opts) => `<div class="seg2" data-key="${key}">${opts.map(([v, label]) => `<button type="button" data-v="${v}" aria-pressed="${(localStorage[key] || '') === v}">${label}</button>`).join('')}</div>`;
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet'; dlg.id = 'site-settings';
  dlg.innerHTML = `<form method="dialog"><div class="sheet-head"><h2 tabindex="-1" autofocus>${t('settings')}</h2><button class="close" aria-label="${t('close')}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="field"><span>${t('mode')}</span>${seg('mode', [['', t('auto')], ['light', t('light')], ['dark', t('dark')]])}</div>
    <div class="field"><span>${t('glass')}</span>${seg('glass', [['clear', t('clear')], ['', t('glassy')], ['frosted', t('frosted')], ['solid', t('solid')]])}</div>
    <div class="field"><span>${t('language')}</span><div class="seg2" data-key="lang"><button type="button" data-v="english" aria-pressed="${!AR}">English</button><button type="button" data-v="arabic" aria-pressed="${AR}">عربي</button></div></div>
    <h3 class="sheet-sub">${t('yourdata')}</h3><p class="note">${t('backupnote')}</p>
    <div class="row2"><button type="button" class="btn" id="bk-down">${t('download')}</button><label class="btn center" style="cursor:pointer;display:block;font-size:14px;color:var(--fg)">${t('restore')}<input type="file" accept=".json,application/json" id="bk-file" hidden></label></div>
    <p class="note" id="bk-msg"></p></form>`;
  document.body.append(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() });
  dlg.querySelectorAll('.seg2').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
    const key = g.dataset.key, v = b.dataset.v;
    g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (key === 'lang') { if ((v === 'arabic') !== AR) { localStorage.lang = v; location.reload() } return }
    if (v) localStorage[key] = v; else localStorage.removeItem(key);
    if (key === 'mode') scheme(); else if (v) document.documentElement.dataset[key] = v; else delete document.documentElement.dataset[key];
  }));
  $('#bk-down').onclick = () => {
    const data = Object.fromEntries(Object.keys(localStorage).filter(k => !SKIP.test(k)).map(k => [k, localStorage[k]]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ muslimist: 1, saved: new Date().toISOString(), data }, null, 1)], { type: 'application/json' }));
    a.download = `muslimist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#bk-file').onchange = async e => {
    try {
      const file = e.target.files[0];
      if (!file || file.size > 2e6) throw 0;
      const b = JSON.parse(await file.text());
      if (!b || b.muslimist !== 1 || !b.data || typeof b.data !== 'object' || Array.isArray(b.data)) throw 0;
      const { keep, skipped } = checkBackup(b.data);
      if (!Object.keys(keep).length) throw 0;
      if (!confirm(t('restoreask') + (skipped ? '\n' + L(`${skipped} item(s) that didn't look right will be skipped.`, `سيُتجاوز ${skipped} عنصر لا يبدو سليمًا.`) : ''))) return;
      localStorage.clear(); Object.entries(keep).forEach(([k, v]) => localStorage[k] = v);
      $('#bk-msg').textContent = t('restored'); setTimeout(() => location.reload(), 600);
    } catch { $('#bk-msg').textContent = t('badfile') }
  };
  const open = () => { $('#menu')?.hidePopover?.(); dlg.showModal() };
  // in the menu popup, under the pages
  const mb = document.createElement('button');
  mb.className = 'menu-settings'; mb.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>${t('settings')}`;
  mb.onclick = open;
  $('#menu')?.append(mb);
  // and in the footer
  const fb = document.createElement('button');
  fb.textContent = t('settingsbtn'); fb.onclick = open;
  $('.foot').append(fb);
}

// page photo. Each page picks its own (html[data-bg]); to avoid a blank flash while it loads, the head script
// first shows the photo from the previous page (already cached), and it crossfades to the new one here.
{
  const root = document.documentElement;
  const urlOf = v => v?.match(/url\(["']?([^"')]+)/)?.[1];
  const shown = urlOf(getComputedStyle(root).getPropertyValue('--bg-img'));
  const pool = u => u?.match(/bg-(\w+)-\d+/)?.[1];
  // moving between pages that share a photo set (Quran: Read and Progress) keeps the current photo
  const want = pool(shown) && pool(shown) === pool(urlOf(root.dataset.bg)) ? shown : urlOf(root.dataset.bg) || shown;
  const BG_COUNT = { home: 7, quran: 6, duaa: 6, times: 6, qibla: 6, hadith: 5, names: 5, salah: 5, calendar: 5, ramadan: 5, zakat: 5 };
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

// menu: on devices with a mouse it opens on hover and closes shortly after the pointer leaves it
{
  const btn = $('.menu'), menu = $('#menu');
  if (btn && menu?.showPopover && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let timer;
    const open = () => { clearTimeout(timer); if (!menu.matches(':popover-open')) menu.showPopover() };
    const close = () => { clearTimeout(timer); timer = setTimeout(() => menu.matches(':popover-open') && menu.hidePopover(), 250) };
    for (const el of [btn, menu]) { el.addEventListener('pointerenter', open); el.addEventListener('pointerleave', close) }
    // a click on the button while hover-opened keeps it open instead of toggling it shut
    btn.addEventListener('click', e => { if (menu.matches(':popover-open')) { e.preventDefault(); open() } });
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
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
  // a new version took over: reload once so this page shows it (not on the very first install)
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload() } });
}
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
