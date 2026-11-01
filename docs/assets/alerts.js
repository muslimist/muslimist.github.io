// prayer alerts: when a prayer time arrives, show a notification and play the adhan.
// Browsers can't wake a website on their own, so this works while the site is open (a tab or the installed app).
// Settings live on the Times page; any open page keeps watching.
(() => {
  const DEF = { on: false, sound: true, prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] };
  const get = () => load('alerts', DEF);
  const ADHAN = '/assets/athan/adhan.mp3';
  let hasAdhan = null, audio = null;
  i18n({ timefor: ['Time for', 'حان وقت'], stop: ['Stop', 'إيقاف'], playadhan: ['Play adhan', 'تشغيل الأذان'], testalert: ['Test alert', 'تنبيه تجريبي'] });

  // prayer-time scripts: already on the Times, Dash and Ramadan pages; loaded here for the rest
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s) });
  const ensureTimes = async () => {
    if (typeof prayTimes === 'undefined') await loadScript('/assets/praytimes.js');
    if (typeof prayerTimes !== 'function') await loadScript('/assets/times.js');
  };

  async function soundFile() {
    if (hasAdhan === null) try { const r = await fetch(ADHAN, { method: 'HEAD' }); hasAdhan = r.ok && !/text\/html/.test(r.headers.get('content-type') || '') } catch { hasAdhan = false }
    return hasAdhan;
  }
  // a soft three-note chime when no adhan recording has been added
  function chime() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + i * .45;
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.25, t0 + .05); g.gain.exponentialRampToValueAtTime(.001, t0 + 1.6);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 1.7);
    });
    return ctx.resume();
  }
  async function play() {
    stopSound();
    if (await soundFile()) { audio = new Audio(ADHAN); return audio.play() }
    return chime();
  }
  function stopSound() { if (audio) { audio.pause(); audio = null } }

  function toast(text, canPlay) {
    document.querySelector('.athan-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'athan-toast glass';
    el.innerHTML = `<a href="/times/">${text}</a>${canPlay ? `<button class="btn" data-play>${t('playadhan')}</button>` : ''}<button class="btn" data-stop>${t('stop')}</button>`;
    el.querySelector('[data-stop]').onclick = () => { stopSound(); el.remove() };
    el.querySelector('[data-play]')?.addEventListener('click', e => { play(); e.target.remove() });
    // an open settings sheet blocks the rest of the page, so the banner goes inside it until it closes
    const sheet = document.querySelector('dialog[open]');
    (sheet || document.body).append(el);
    sheet?.addEventListener('close', () => el.isConnected && document.body.append(el), { once: true });
    setTimeout(() => { if (!audio || audio.paused) el.remove() }, 5 * 60e3);
  }

  async function notify(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, icon: '/assets/icons/favicon-196.png', badge: '/assets/icons/favicon-196.png', tag: 'prayer', renotify: true };
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) return reg.showNotification(title, opts) } catch {}
    try { new Notification(title, opts) } catch {}
  }

  // fire one alert (also used by the Times page's test buttons)
  async function fire(key, timeText) {
    const s = get();
    const title = `${t('timefor')} ${t(key)}`;
    notify(title, timeText || '');
    let blocked = false;
    if (s.sound) try { await play() } catch { blocked = true } // autoplay can be blocked until you've tapped the page
    toast(`<b>${title}</b>${timeText ? ` · ${timeText}` : ''}`, blocked);
  }

  // check every 10s whether a chosen prayer has just begun; one alert per prayer per day across all open tabs
  async function check() {
    const s = get();
    const sim = +localStorage['alerts-sim'] || 0;
    if (sim && Date.now() >= sim) { localStorage.removeItem('alerts-sim'); await ensureTimes(); const { next } = prayerTimes(); return fire(next?.key || 'asr', '(simulated)') }
    if (!s.on) return;
    await ensureTimes();
    prayTimes.setMethod(timesSet.method);
    const now = new Date(), h = prayTimes.getTimes(now, [timesSet.lat, timesSet.lng], 'auto', 'auto', 'Float'), txt = prayTimes.getTimes(now, [timesSet.lat, timesSet.lng], 'auto', 'auto', timesSet.format);
    const day = new Date(now); day.setHours(0, 0, 0, 0);
    for (const k of s.prayers) {
      const at = +day + h[k] * 36e5, id = `${day.toDateString()} ${k}`;
      if (now >= at && now - at < 3 * 60e3 && localStorage['alerts-last'] !== id) { localStorage['alerts-last'] = id; return fire(k, txt[k]) }
    }
  }
  setInterval(check, 5e3); setTimeout(check, 1500);

  window.Alerts = {
    get, set: v => save('alerts', v), fire, stopSound, hasAdhan: soundFile,
    permission: async () => 'Notification' in window ? (Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission) : 'unsupported',
    simulate: secs => { localStorage['alerts-sim'] = Date.now() + secs * 1e3 },
  };
})();
