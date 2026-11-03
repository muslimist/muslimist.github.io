// prayer time settings + calculation, shared by the home and times pages (needs praytimes.js, site.js)

const PRAYERS = ['tahajjud', 'imsak', 'fajr', 'sunrise', 'duha', 'dhuhr', 'awabeen', 'asr', 'sunset', 'maghrib', 'isha', 'midnight'];
i18n({
  tahajjud: ['Tahajjud', 'تهجد'], imsak: ['Imsak', 'إمساك'], fajr: ['Fajr', 'الفجر'], sunrise: ['Sunrise', 'الشروق'],
  duha: ['Duha', 'الضحى'], dhuhr: ['Dhuhr', 'الظهر'], awabeen: ['Awabeen', 'الأوابين'], asr: ['Asr', 'العصر'],
  sunset: ['Sunset', 'الغروب'], maghrib: ['Maghrib', 'المغرب'], isha: ['Isha', 'العشاء'], midnight: ['Midnight', 'منتصف الليل'],
  in: ['in', 'بعد'], h: ['h', 'س'], m: ['m', 'د'], next: ['Next', 'التالية'],
});

// reads the old per-key settings once so returning visitors keep their location
const oldList = localStorage.times_list && JSON.parse(localStorage.times_list).map(s => s.toLowerCase());
const timesSet = load('times', {
  lat: +(localStorage.times_latitude ?? 43),
  lng: +(localStorage.times_longitude ?? -80),
  method: localStorage.times_method || 'ISNA',
  format: localStorage.times_format || '12h',
  seconds: localStorage.times_precision === 'show',
  show: oldList || ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
});

// a prayer time ("13.25" hours) as a Date on the given day, counted on the wall clock: adding hours to midnight
// would be an hour off on the days the clocks change
const atClock = (day, hours) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, Math.round(hours * 3600));
const daysBetween = (a, b) => Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);

// returns [{key, time, at}] for the shown prayers today, plus the next one (rolls over to tomorrow's first)
function prayerTimes(now = new Date()) {
  prayTimes.setMethod(timesSet.method);
  const coords = [timesSet.lat, timesSet.lng];
  const text = prayTimes.getTimes(now, coords, 'auto', 'auto', timesSet.format, timesSet.seconds ? 'show' : 'hide');
  const hours = prayTimes.getTimes(now, coords, 'auto', 'auto', 'Float');
  const list = PRAYERS.filter(k => timesSet.show.includes(k))
    .map(k => ({ key: k, time: text[k], at: atClock(now, hours[k]) }));
  // after the last one, the next is tomorrow's first (with tomorrow's own time)
  const tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
  const next = list.find(p => p.at > now) || (list[0] && { ...list[0], time: prayTimes.getTimes(tm, coords, 'auto', 'auto', timesSet.format, timesSet.seconds ? 'show' : 'hide')[list[0].key], at: atClock(tm, prayTimes.getTimes(tm, coords, 'auto', 'auto', 'Float')[list[0].key]) });
  return { list, next };
}

// the part of the day from today's prayer times: fajr, sunrise, duha, dhuhr, asr, maghrib, isha, night or lastthird
function dayPart(now = new Date()) {
  prayTimes.setMethod(timesSet.method);
  const h = prayTimes.getTimes(now, [timesSet.lat, timesSet.lng], 'auto', 'auto', 'Float'), x = now.getHours() + now.getMinutes() / 60;
  // the last third of the night: between isha's night and fajr (night = maghrib → fajr)
  const night = (h.fajr + 24 - h.maghrib) % 24, lastThird = (h.fajr - night / 3 + 24) % 24;
  const inLastThird = (x - lastThird + 24) % 24 < night / 3; // from the start of the last third until fajr, across midnight
  let part;
  if (x < h.fajr) part = inLastThird ? 'lastthird' : 'night';
  else if (x < h.sunrise) part = 'fajr';
  else if (x < h.sunrise + 1.5) part = 'sunrise';
  else if (x < h.dhuhr) part = 'duha';
  else if (x < h.asr) part = 'dhuhr';
  else if (x < h.maghrib - .5) part = 'asr';
  else if (x < h.maghrib + .4) part = 'maghrib';
  else if (x < h.isha + 1.5) part = 'isha';
  else part = inLastThird ? 'lastthird' : 'night';
  return { part, h, x };
}

function until(date) {
  const min = Math.max(0, Math.round((date - Date.now()) / 6e4));
  return `${t('in')} ${min >= 60 ? Math.floor(min / 60) + t('h') + ' ' : ''}${min % 60}${t('m')}`;
}

// fills a block with .next-up (label, big time, countdown, progress bar) and, if it has one, a .prayers list
function showPrayers(root, now = new Date()) {
  const { list, next } = prayerTimes(now);
  const isNext = p => next && p.key === next.key && +p.at === +next.at;
  const ul = root.querySelector('.prayers');
  if (ul) ul.innerHTML = list.map(p => `<li class="${isNext(p) ? 'now' : p.at < now ? 'past' : ''}"><span>${t(p.key)}</span><b>${p.time}</b></li>`).join('');
  const box = root.querySelector('.next-up');
  box.hidden = !next;
  if (!next) return;
  // progress from the last prayer that passed (or start of today) to the next one
  const prev = [...list].reverse().find(p => p.at <= now)?.at || new Date(now).setHours(0, 0, 0, 0);
  box.querySelector('.label').textContent = `${t('next')} · ${t(next.key)}`;
  box.querySelector('.next-time').textContent = next.time;
  box.querySelector('.next-in').textContent = soonText(next.at) || until(next.at);
  box.querySelector('.bar i')?.style.setProperty('width', `${Math.min(100, Math.max(2, (now - prev) / (next.at - prev) * 100))}%`);
  root._next = next;
  root.classList.toggle('soon', !!soonText(next.at));
  // the day's prayers as dots on one line, with a marker for now
  const line = root.querySelector('.day-line');
  if (!line) return;
  line.hidden = list.length < 2;
  if (line.hidden) return;
  const pad = 45 * 6e4, a = list[0].at - pad, b = list.at(-1).at - -pad, pos = d => (d - a) / (b - a) * 100;
  const upNext = list.find(p => p.at > now);
  line.innerHTML = `<i class="fill" style="width:${Math.min(100, Math.max(0, pos(now)))}%"></i>`
    + list.map(p => `<span class="${p === upNext ? 'next' : p.at <= now ? 'past' : ''}" style="inset-inline-start:${pos(p.at)}%"><b></b><small>${t(p.key)}</small></span>`).join('')
    + (now > a && now < b ? `<em style="inset-inline-start:${pos(now)}%"></em>` : '');
}

// the last ten minutes before a prayer count down by the second ("in 4:16"); '' before that
function soonText(at) {
  const sec = Math.round((at - Date.now()) / 1e3);
  return sec > 0 && sec <= 600 ? `${t('in')} ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '';
}
// keeps a showPrayers block ticking each second; refresh() re-renders once the prayer time arrives
function liveCountdown(root, refresh) {
  setInterval(() => {
    const n = root._next; if (!n) return;
    if (n.at <= Date.now()) return refresh();
    const s = soonText(n.at);
    root.classList.toggle('soon', !!s);
    if (s) root.querySelector('.next-in').textContent = s;
  }, 1e3);
}
