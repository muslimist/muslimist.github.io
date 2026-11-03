// duaa page (needs site.js, arabic.js)
// three views: category cards -> list of titles (a category or a search) -> one duaa in the reader.
// the original page markup is the data: each <details class="dua"> is a duaa, each .dua-version (or the
// whole .dua-body) is one recitation, and the original <audio> elements are what actually play.

i18n({
  sub: ['Find the words for every moment', 'دعاء لكل لحظة'], search: ['Search travel, forgiveness, morning…', 'ابحث: السفر، المغفرة، الصباح…'],
  all: ['All', 'الكل'], c1: ['Daily', 'اليومية'], c2: ['Thikr', 'الذكر'], c3: ['People', 'الناس'], c4: ['Hajj / Fasting', 'الحج والصيام'],
  c5: ['Quranic', 'قرآنية'], c6: ['Prayer', 'الصلاة'], c7: ['Feelings', 'المشاعر'], c8: ['Iman', 'الإيمان'], c9: ['Illness', 'المرض'],
  duaone: ['duaa', 'دعاء'], duamany: ['duas', 'أدعية'], result: ['result', 'نتيجة'], results: ['results', 'نتائج'],
  play: ['Play', 'تشغيل'], pause: ['Pause', 'إيقاف مؤقت'], prev: ['Previous', 'السابق'], next: ['Next', 'التالي'],
  empty: ['No duas found. Try another word or category.', 'لا توجد نتائج. جرّب كلمة أو تصنيفًا آخر.'],
  showtr: ['Show translation', 'إظهار الترجمة الإنجليزية'], showtl: ['Show transliteration', 'إظهار النطق بالحروف اللاتينية'],
  copylink: ['copy link', 'نسخ الرابط'],
  morning: ['Morning adhkar', 'أذكار الصباح'], evening: ['Evening adhkar', 'أذكار المساء'], start: ['Start', 'ابدأ'], tap: ['Tap to count', 'اضغط للعدّ'],
  donetoday: ['Done today', 'تمت اليوم'], adhkardone: ['Done. May Allah accept it.', 'تمّت. تقبّل الله منك.'], back: ['Duaa', 'الأدعية'], of: ['of', 'من'],
  adhkarsub: ['Step through them with a counter', 'خطوة بخطوة مع عدّاد'], copied: ['copied', 'تم النسخ'], sources: ['source', 'المصدر'],
});

const search = $('#duaa-search');
const list = $('#duaa-list');
const duas = $$('.dua');
const catName = c => t('c' + c);
let category = '';

// Arabic titles (and make them searchable in both languages)
duas.forEach(dua => {
  const ar = arabicDuaTitles[dua.id.slice(4)];
  if (!ar) return;
  dua.dataset.search += ' ' + ar;
  if (AR) dua.querySelector('summary > span:last-child').textContent = ar;
});
// in Arabic, short notes (instructions, counts, references) get their Arabic; longer narrations stay in English, shown left to right
if (AR) $$('.dua p:not([class])').forEach(p => {
  const ar = arabicDuaNotes[p.textContent.trim()];
  if (ar) p.textContent = ar; else { p.lang = 'en'; p.dir = 'ltr'; p.classList.add('en-note') }
});
const titleOf = dua => dua.querySelector('summary > span:last-child').textContent;

// recitations of a duaa: each .dua-version, or the whole body when there is only one
const versionsOf = dua => { const v = [...dua.querySelectorAll('.dua-version')]; return v.length ? v : [dua.querySelector('.dua-body')] };

// ---------- list: titles grouped by category, in chip order ----------
const groups = new Map(); // a Map keeps chip order (a plain object would sort the numeric keys)
if (duas.length) for (const b of $$('#chips button[data-cat]:not([data-cat=""])')) {
  const g = document.createElement('section');
  g.className = 'dua-group';
  g.innerHTML = `<h3>${b.textContent}</h3>`;
  list.append(g);
  groups.set(b.dataset.cat, g);
}
duas.forEach(dua => {
  groups.get(dua.dataset.category)?.append(dua);
  dua.querySelector('summary').addEventListener('click', e => { e.preventDefault(); location.hash = dua.id });
});

// ---------- start view: a photo card per category ----------
if (duas.length) {
  const cats = document.createElement('div');
  cats.className = 'dua-cats';
  cats.id = 'cats';
  for (const [cat, g] of groups) {
    const n = g.querySelectorAll('.dua').length;
    const card = document.createElement('button');
    card.className = 'dua-cat';
    card.style.setProperty('--img', `url(/assets/img/cat-${cat}-soft.webp)`); // 32px wide: stretched, it reads as a blur with no live filter
    card.innerHTML = `<span><b>${catName(cat)}</b><small>${n} ${t(n === 1 ? 'duaone' : 'duamany')}</small></span>`;
    card.onclick = () => $(`#chips button[data-cat="${cat}"]`).click();
    cats.append(card);
  }
  list.before(cats);
  // morning / evening adhkar: the two sets from "Dua in the morning & evening", one at a time with a counter
  const ad = document.createElement('div');
  ad.className = 'adhkar-start'; ad.id = 'adhkar-start';
  const AD_ICON = { morning: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', evening: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' };
  ad.innerHTML = ['morning', 'evening'].map(k => `<a class="ad-card" href="#adhkar-${k}" data-k="${k}"><i class="ad-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${AD_ICON[k]}"/></svg></i><span><b>${t(k)}</b><small>${t('adhkarsub')}</small><span class="ad-done" hidden>✓ ${t('donetoday')}</span></span></a>`).join('');
  cats.before(ad);

  list.insertAdjacentHTML('afterend', `
  <div id="reader" class="dr" hidden>
    <button class="dr-back" id="dr-back"></button>
    <h2 class="dr-title" id="dr-title"></h2>
    <div class="dr-body" id="dr-body"></div>
    <div class="dr-controls">
      <button class="icon" id="dr-prev" aria-label="${t('prev')}"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
      <button class="play" id="dr-play" aria-label="${t('play')}"><svg viewBox="0 0 24 24"><path id="dr-icon" d="M8 5v14l11-7z"/></svg></button>
      <button class="icon" id="dr-next" aria-label="${t('next')}"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
    <button class="dr-tap" id="dr-tap" hidden></button>
    <p class="dr-count" id="dr-count"></p>
    <div class="dr-meta"><a href="#" id="dr-link">${t('copylink')}</a><button id="dr-src">${t('sources')}</button></div>
    <div class="dr-sources" id="dr-sources" hidden></div>
  </div>`);
}

// ---------- search + chips ----------
const normalize = text => text.toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g, '');
const searchable = duas.map(dua => normalize(dua.dataset.search));
function filterDuas() {
  const words = normalize(search.value).trim().split(/\s+/);
  let count = 0;
  duas.forEach((dua, i) => {
    const match = (!category || dua.dataset.category === category) && words.every(w => searchable[i].includes(w));
    dua.hidden = !match;
    if (match) count++;
  });
  for (const g of groups.values()) g.hidden = !g.querySelector('.dua:not([hidden])');
  const filtered = !!(search.value.trim() || category);
  list.classList.toggle('one-cat', !!category && !search.value.trim());
  $('#duaa-count').textContent = filtered ? `${count} ${t(count === 1 ? 'result' : 'results')}` : '';
  $('#duaa-empty').hidden = !filtered || count !== 0;
  show(filtered ? 'list' : 'cats');
}
search.addEventListener('input', () => { if (reader.dua) closeReader(); filterDuas() });
$$('#chips button').forEach(b => b.onclick = () => {
  $$('#chips button').forEach(x => x.setAttribute('aria-pressed', x === b));
  category = b.dataset.cat;
  if (reader.dua) closeReader();
  filterDuas();
});

// which view is on screen: 'cats', 'list' or 'reader'
function show(view) {
  if (!duas.length) return;
  if (reader.dua) view = 'reader';
  $('#cats').hidden = view !== 'cats';
  $('#adhkar-start').hidden = view !== 'cats';
  if (view === 'cats') $$('.ad-card').forEach(c => { c.querySelector('.ad-done').hidden = !adhkarDone(c.dataset.k); c.classList.toggle('now', c.dataset.k === adhkarNow()) });
  list.hidden = view !== 'list';
  $('#reader').hidden = view !== 'reader';
  $('#chips').hidden = view === 'reader';
  $('#duaa-count').hidden = view !== 'list';
  if (view === 'reader') $('#duaa-empty').hidden = true;
}

// ---------- reader: one duaa, one recitation at a time ----------
const reader = { dua: null, versions: [], i: 0 };
const audioOf = () => reader.versions[reader.i]?.querySelector('audio') || null;
const idOf = () => reader.versions[reader.i].id || reader.dua.id;

function render() {
  const v = reader.versions[reader.i], n = reader.versions.length;
  // show the readable parts of this recitation (not its audio, buttons or sources)
  const body = v.cloneNode(true);
  body.querySelectorAll('audio, .dua-actions, .dua-sources, .dua-version, h3').forEach(e => e.remove());
  $('#dr-body').replaceChildren(...body.childNodes);
  // an item with no Arabic text keeps its English notes, so it isn't empty
  if (!$('#dr-body .dua-arabic')) $$('#dr-body .en-note').forEach(n => n.classList.add('keep'));
  $('#dr-count').textContent = n > 1 ? `${reader.i + 1} / ${n}` : '';
  $('#dr-tap').hidden = !reader.adhkar;
  if (reader.adhkar) { reader.count = 0; syncTap() }
  $('#dr-prev').style.visibility = $('#dr-next').style.visibility = n > 1 ? '' : 'hidden';
  $('#dr-play').hidden = !audioOf();
  const src = v.querySelector('.dua-sources');
  $('#dr-src').hidden = !src;
  $('#dr-sources').hidden = true;
  $('#dr-sources').innerHTML = src ? src.innerHTML : '';
  syncPlay();
}

// ---------- adhkar mode ----------
// how many times each recitation is said, and when (b = both, m = morning only, e = evening only), from its own notes
const ADHKAR = { '': [1, 'b'], 'dua-73': [1, 'b'], 'dua-74': [3, 'b'], 'dua-75': [1, 'b'], 'dua-76': [1, 'b'], 'dua-77': [1, 'b'], 'dua-78': [4, 'b'], 'dua-79': [1, 'b'],
  'dua-80': [3, 'b'], 'dua-81': [7, 'b'], 'dua-82': [1, 'b'], 'dua-83': [1, 'b'], 'dua-84': [3, 'b'], 'dua-85': [3, 'b'], 'dua-86': [1, 'b'], 'dua-87': [1, 'b'], 'dua-88': [1, 'b'],
  'dua-89': [100, 'b'], 'dua-90': [10, 'b'], 'dua-91': [3, 'm'], 'dua-92': [1, 'm'], 'dua-93': [100, 'm'], 'dua-94': [3, 'e'], 'dua-95': [10, 'b'] };
const today = () => new Date().toDateString();
const adhkarDone = k => load('adhkar', {})[k] === today();
// morning from fajr until asr, evening from asr until the night (falls back to clock hours without prayer times)
function adhkarNow() { const h = new Date().getHours(); return h >= 3 && h < 15 ? 'morning' : 'evening' }
const timesOf = () => reader.versions.map(v => (ADHKAR[v.id] || [1])[0]);
function syncTap() {
  const need = timesOf()[reader.i];
  $('#dr-tap').innerHTML = `<span class="tap-n"><b>${reader.count}</b><i>/ ${need}</i></span><small>${t('tap')}</small>`;
  $('#dr-tap').classList.toggle('full', reader.count >= need);
}
function openAdhkar(k) {
  const dua = $('#dua-72');
  if (!dua) return;
  reader.dua = dua; reader.adhkar = k; reader.i = 0;
  reader.versions = versionsOf(dua).filter(v => { const w = (ADHKAR[v.id] || [1, 'b'])[1]; return w === 'b' || w === k[0] });
  $('#dr-back').textContent = (AR ? '› ' : '‹ ') + t('back');
  $('#dr-title').textContent = t(k);
  render(); show('reader');
  $('.layout').scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function finishAdhkar() {
  const done = load('adhkar', {}); done[reader.adhkar] = today(); save('adhkar', done);
  $('#dr-body').innerHTML = `<p class="ad-finish">✓ ${t('adhkardone')}</p>`;
  $('#dr-tap').hidden = true; $('#dr-count').textContent = '';
}

function openReader(dua, at) {
  reader.adhkar = null;
  reader.dua = dua;
  reader.versions = versionsOf(dua);
  reader.i = Math.max(0, reader.versions.findIndex(v => v === at || v.contains(at)));
  const back = search.value.trim() ? $('#duaa-count').textContent : catName(category || dua.dataset.category);
  $('#dr-back').textContent = (AR ? '› ' : '‹ ') + back;
  $('#dr-title').textContent = titleOf(dua);
  render();
  show('reader');
  $('.layout').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function closeReader() {
  $$('audio').forEach(a => a.pause());
  reader.dua = null; reader.adhkar = null;
  if (location.hash) history.pushState(null, '', location.pathname);
  filterDuas();
}

function go(step) {
  const n = reader.versions.length;
  if (reader.adhkar) { reader.i = Math.min(n - 1, Math.max(0, reader.i + step)); $$('audio').forEach(a => a.pause()); render(); return }
  $$('audio').forEach(a => a.pause());
  reader.i = (reader.i + step + n) % n;
  history.replaceState(null, '', '#' + idOf());
  render();
}

function syncPlay() {
  if (!reader.dua) return;
  const a = audioOf(), on = !!a && !a.paused;
  $('#dr-icon').setAttribute('d', on ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  $('#dr-play').setAttribute('aria-label', t(on ? 'pause' : 'play'));
}

if (duas.length) {
  $('#dr-back').onclick = () => closeReader();
  $('#dr-prev').onclick = () => go(AR ? 1 : -1);
  $('#dr-next').onclick = () => go(AR ? -1 : 1);
  $('#dr-play').onclick = () => { const a = audioOf(); if (a) a.paused ? a.play() : a.pause() };
  $('#dr-tap').onclick = () => {
    const need = timesOf()[reader.i];
    if (reader.count < need) reader.count++;
    if (navigator.vibrate) navigator.vibrate(reader.count >= need ? [30, 60, 30] : 15);
    syncTap();
    if (reader.count >= need) setTimeout(() => { if (!reader.adhkar) return; if (reader.i < reader.versions.length - 1) go(1); else finishAdhkar() }, 450);
  };
  $('#dr-src').onclick = () => $('#dr-sources').hidden = !$('#dr-sources').hidden;
  $('#dr-link').onclick = async e => {
    e.preventDefault();
    const url = `${location.origin}${location.pathname}#${idOf()}`;
    try { await navigator.clipboard.writeText(url); $('#dr-link').textContent = t('copied') }
    catch { $('#dr-link').textContent = url }
    setTimeout(() => $('#dr-link').textContent = t('copylink'), 2000);
  };
}
document.addEventListener('keydown', e => {
  if (!reader.dua || e.target.closest?.('input, select, dialog')) return;
  if (e.key === 'Escape') closeReader();
  else if (e.key === 'ArrowRight') $('#dr-next').click();
  else if (e.key === 'ArrowLeft') $('#dr-prev').click();
});

// links: /duaa/#dua-12 opens that duaa (or that recitation) in the reader
function fromHash() {
  const ak = location.hash.match(/^#adhkar-(morning|evening)$/);
  if (ak) { filterDuas(); openAdhkar(ak[1]); return }
  const target = location.hash && document.getElementById(location.hash.slice(1));
  const dua = target?.closest?.('.dua');
  if (!dua) { if (reader.dua) closeReader(); return }
  if (!search.value.trim()) { category = dua.dataset.category; $$('#chips button').forEach(x => x.setAttribute('aria-pressed', x.dataset.cat === category)) }
  filterDuas();
  openReader(dua, target);
}
addEventListener('hashchange', fromHash);

// ---------- display options, remembered on this device ----------
const opts = load('duaa', { translation: !AR, transliteration: false }); // in Arabic the English translation starts off
for (const k of ['translation', 'transliteration']) {
  const box = $('#duaa-' + k);
  box.checked = opts[k];
  document.body.classList.toggle('show-' + k, opts[k]);
  box.onchange = () => { opts[k] = box.checked; save('duaa', opts); document.body.classList.toggle('show-' + k, box.checked) };
}

// ---------- audio: one at a time; when one ends, the next recitation of the same duaa plays ----------
document.addEventListener('play', e => {
  if (e.target.tagName !== 'AUDIO') return;
  $$('audio').forEach(a => { if (a !== e.target) a.pause() });
  // keep the reader on the recitation that is playing
  if (reader.dua) {
    const i = reader.versions.findIndex(v => v.contains(e.target));
    if (i >= 0 && i !== reader.i) { reader.i = i; history.replaceState(null, '', '#' + idOf()); render() }
  }
  syncPlay();
}, true);
document.addEventListener('pause', () => syncPlay(), true);
document.addEventListener('ended', async e => {
  if (e.target.tagName !== 'AUDIO') return;
  syncPlay();
  const dua = e.target.closest('.dua');
  if (!dua || dua.hidden) return;
  const all = [...dua.querySelectorAll('audio')];
  const next = all[all.indexOf(e.target) + 1];
  if (!next) return;
  next.currentTime = 0;
  try { await next.play() } catch (err) { console.warn('Unable to autoplay the next recording:', err) }
}, true);

filterDuas();
fromHash();
