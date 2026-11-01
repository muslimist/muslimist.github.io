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
  copylink: ['copy link', 'نسخ الرابط'], copied: ['copied', 'تم النسخ'], sources: ['source', 'المصدر'],
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
    card.style.setProperty('--img', `url(/assets/img/cat-${cat}.webp)`);
    card.innerHTML = `<span><b>${catName(cat)}</b><small>${n} ${t(n === 1 ? 'duaone' : 'duamany')}</small></span>`;
    card.onclick = () => $(`#chips button[data-cat="${cat}"]`).click();
    cats.append(card);
  }
  list.before(cats);

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
  $('#dr-count').textContent = n > 1 ? `${reader.i + 1} / ${n}` : '';
  $('#dr-prev').style.visibility = $('#dr-next').style.visibility = n > 1 ? '' : 'hidden';
  $('#dr-play').hidden = !audioOf();
  const src = v.querySelector('.dua-sources');
  $('#dr-src').hidden = !src;
  $('#dr-sources').hidden = true;
  $('#dr-sources').innerHTML = src ? src.innerHTML : '';
  syncPlay();
}

function openReader(dua, at) {
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
  reader.dua = null;
  if (location.hash) history.pushState(null, '', location.pathname);
  filterDuas();
}

function go(step) {
  const n = reader.versions.length;
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
  const target = location.hash && document.getElementById(location.hash.slice(1));
  const dua = target?.closest?.('.dua');
  if (!dua) { if (reader.dua) closeReader(); return }
  if (!search.value.trim()) { category = dua.dataset.category; $$('#chips button').forEach(x => x.setAttribute('aria-pressed', x.dataset.cat === category)) }
  filterDuas();
  openReader(dua, target);
}
addEventListener('hashchange', fromHash);

// ---------- display options, remembered on this device ----------
const opts = load('duaa', { translation: true, transliteration: false });
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
