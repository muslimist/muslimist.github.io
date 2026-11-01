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

// returns [{key, time, at}] for the shown prayers today, plus the next one (rolls over to tomorrow's first)
function prayerTimes(now = new Date()) {
  prayTimes.setMethod(timesSet.method);
  const coords = [timesSet.lat, timesSet.lng];
  const text = prayTimes.getTimes(now, coords, 'auto', 'auto', timesSet.format, timesSet.seconds ? 'show' : 'hide');
  const hours = prayTimes.getTimes(now, coords, 'auto', 'auto', 'Float');
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const list = PRAYERS.filter(k => timesSet.show.includes(k))
    .map(k => ({ key: k, time: text[k], at: new Date(+day + hours[k] * 3600e3) }));
  const next = list.find(p => p.at > now) || (list[0] && { ...list[0], at: new Date(+list[0].at + 864e5) });
  return { list, next };
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
  box.querySelector('.next-in').textContent = until(next.at);
  box.querySelector('.bar i').style.width = `${Math.min(100, Math.max(2, (now - prev) / (next.at - prev) * 100))}%`;
}
