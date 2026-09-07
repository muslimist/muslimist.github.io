const search = document.querySelector('#duaa-search');
const category = document.querySelector('#duaa-category');
const duas = [...document.querySelectorAll('.dua')];
duas.forEach(section => {
  const count = section.querySelectorAll('audio').length;
  const label = document.createElement('span');
  label.className = 'dua-audio-count';
  label.textContent = ` (${count})`;
  label.setAttribute('aria-label', duaaIsArabic ? `عدد التسجيلات: ${count}` : `${count} recordings`);
  section.querySelector('summary > span:last-child').append(label);
});
const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '');
const searchable = duas.map(dua => normalize(dua.dataset.search));
function filterDuas() {
  const words = normalize(search.value).trim().split(/\s+/);
  let count = 0;
  duas.forEach((dua, index) => {
    const matches = (!category.value || dua.dataset.category === category.value) && words.every(word => searchable[index].includes(word));
    if (matches) count++;
    dua.hidden = !matches;
    if (dua.hidden) dua.querySelectorAll('audio').forEach(audio => audio.pause());
  });
  document.querySelector('#duaa-count').textContent = `${count} ${count === 1 ? duaaText.topic : duaaText.topics}`;
  document.querySelector('#duaa-empty').hidden = count !== 0;
}
search.addEventListener('input', filterDuas);
category.addEventListener('change', filterDuas);
document.querySelector('#duaa-transliteration').addEventListener('change', event => {
  document.querySelector('#duaa-list').classList.toggle('show-transliteration', event.target.checked);
});
document.addEventListener('play', event => {
  if (event.target.tagName === 'AUDIO') document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
}, true);
document.addEventListener('ended', async event => {
  if (event.target.tagName !== 'AUDIO') return;
  const section = event.target.closest('.dua');
  if (!section || section.hidden) return;
  const recordings = [...section.querySelectorAll('audio')];
  const next = recordings[recordings.indexOf(event.target) + 1];
  if (!next) return;
  next.currentTime = 0;
  try {
    await next.play();
  } catch (error) {
    console.warn('Unable to autoplay the next recording:', error);
  }
}, true);
async function openLinkedDua() {
  const target = document.getElementById(location.hash.slice(1));
  const dua = target?.closest('.dua');
  if (!dua) return;
  search.value = ''; category.value = ''; filterDuas();
  dua.open = true;
  // Wait for the initial layout before positioning an expanded, nested entry.
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, {once: true}));
  }
  await document.fonts.ready;
  if (location.hash !== '#' + target.id) return;
  requestAnimationFrame(() => {
    if (location.hash !== '#' + target.id) return;
    target.scrollIntoView({block: 'start', behavior: 'instant'});
  });
}
window.addEventListener('hashchange', openLinkedDua);
filterDuas();
openLinkedDua();

document.querySelector('#duaa-translation').addEventListener('change', event => {
  document.querySelector('#duaa-list').classList.toggle('show-translation', event.target.checked);
});

 document.querySelectorAll('.dua-source-toggle').forEach(button => {
  if (duaaIsArabic) { button.title = 'المصادر'; button.setAttribute('aria-label', 'المصادر'); }
  button.addEventListener('click', () => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
  });
 });
 document.querySelectorAll('.dua-permalink').forEach(link => {
  const label = duaaIsArabic ? 'نسخ الرابط' : 'Copy link';
  link.title = label;
  link.setAttribute('aria-label', label);
  link.addEventListener('click', async event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(link.getAttribute('href'), location.href).href;
    link.parentElement.querySelector('.dua-copy-status')?.remove();
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      const status = document.createElement('span');
      status.className = 'dua-copy-status';
      status.setAttribute('role', 'status');
      link.parentElement.append(status);
      status.textContent = duaaIsArabic ? 'تعذر النسخ. انسخ الرابط من هنا:' : 'Could not copy. Copy this link:';
      const fallback = document.createElement('input');
      fallback.type = 'text';
      fallback.readOnly = true;
      fallback.value = url;
      fallback.setAttribute('aria-label', label);
      status.append(fallback);
      fallback.focus();
      fallback.select();
    }
  });
 });
