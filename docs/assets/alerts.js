// prayer alerts: when a prayer time arrives, show a notification and play the adhan.
// Browsers can't wake a website on their own, so this works while the site is open (a tab or the installed app).
// Settings live on the Times page; any open page keeps watching.
(() => {
  const DEF = { on: false, sound: true, prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] };
  const get = () => load('alerts', DEF);
  // a recording for each prayer (Fajr's has its extra line); sunrise and the like fall back to Dhuhr's
  const ADHAN = k => `/assets/athan/${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(k) ? k : 'dhuhr'}.mp3`;
  let audio = null;
  i18n({ timefor: ['Time for', 'حان وقت'], stop: ['Stop', 'إيقاف'], playadhan: ['Play adhan', 'تشغيل الأذان'], testalert: ['Test alert', 'تنبيه تجريبي'] });

  // prayer-time scripts: already on the Times, Dashboard and Ramadan pages; loaded here for the rest
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s) });
  const ensureTimes = async () => {
    if (typeof prayTimes === 'undefined') await loadScript('/assets/praytimes.js');
    if (typeof prayerTimes !== 'function') await loadScript('/assets/times.js');
  };

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
  // while the adhan plays, everything else goes quiet (Quran, duaa, names, read-aloud, in every open tab)
  // and whatever was playing picks up again when it ends
  const media = new Set(); // detached players (new Audio()) aren't in the page, so note each one as it plays
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this !== audio) { media.add(this); held = held.filter(m => m !== this) } // started again by hand: leave it be
    return origPlay.apply(this, arguments);
  };
  let held = [], heldSpeech = false, quiet = false, safety = 0;
  const tabs = 'BroadcastChannel' in window ? new BroadcastChannel('muslimist-adhan') : null;
  function hush() {
    if (quiet) return;
    quiet = true;
    dispatchEvent(new Event('adhan-start')); // pages with their own play buttons pause themselves
    for (const m of new Set([...media, ...document.querySelectorAll('audio, video')]))
      if (m !== audio && !m.paused) { m.pause(); held.push(m) }
    if (window.speechSynthesis?.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); heldSpeech = true }
    clearTimeout(safety); safety = setTimeout(release, 8 * 60e3); // in case the tab playing the adhan is closed
  }
  function release() {
    if (!quiet) return;
    quiet = false; clearTimeout(safety);
    held.forEach(m => m.paused && m.play().catch(() => {})); held = [];
    if (heldSpeech) speechSynthesis.resume(); heldSpeech = false;
    dispatchEvent(new Event('adhan-end'));
  }
  if (tabs) tabs.onmessage = e => e.data === 'start' ? hush() : release();
  const quietAll = () => { hush(); tabs?.postMessage('start') };
  const releaseAll = () => { release(); tabs?.postMessage('end') };

  async function play(key) {
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio = null }
    const a = audio = new Audio(ADHAN(key));
    quietAll();
    a.onended = () => { if (audio === a) { audio = null; releaseAll(); document.querySelector('.athan-toast')?.remove() } };
    try { await a.play() }
    catch (e) {
      if (audio === a) audio = null;
      if (e.name === 'NotAllowedError') { releaseAll(); throw e }
      setTimeout(releaseAll, 2600); return chime(); // chime if the file can't load
    }
  }
  function stopSound() { if (audio) { audio.onended = null; audio.pause(); audio = null } releaseAll() }

  function toast(key, text, canPlay) {
    document.querySelector('.athan-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'athan-toast glass'; el.dataset.key = key;
    el.innerHTML = `<a href="/times/">${text}</a>${canPlay ? `<button class="btn" data-play>${t('playadhan')}</button>` : ''}<button class="btn" data-stop>${t('stop')}</button>`;
    el.querySelector('[data-stop]').onclick = () => { stopSound(); el.remove() };
    el.querySelector('[data-play]')?.addEventListener('click', e => { play(el.dataset.key); e.target.remove() });
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
    if (s.sound) try { await play(key) } catch { blocked = true } // autoplay can be blocked until you've tapped the page
    toast(key, `<b>${title}</b>${timeText ? ` · ${timeText}` : ''}`, blocked);
  }

  // the next of the five daily prayers (never sunrise or the like), for the test buttons and the simulation
  function nextPrayer() {
    prayTimes.setMethod(timesSet.method);
    const now = new Date(), coords = [timesSet.lat, timesSet.lng], h = prayTimes.getTimes(now, coords, 'auto', 'auto', 'Float'), txt = prayTimes.getTimes(now, coords, 'auto', 'auto', timesSet.format);
    const k = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].find(p => atClock(now, h[p]) > now) || 'fajr';
    return { key: k, time: txt[k] };
  }
  // check every 10s whether a chosen prayer has just begun; one alert per prayer per day across all open tabs
  async function check() {
    const s = get();
    const sim = +localStorage['alerts-sim'] || 0;
    if (sim && Date.now() >= sim) { localStorage.removeItem('alerts-sim'); await ensureTimes(); return fire(nextPrayer().key, '(simulated)') }
    if (!s.on) return;
    await ensureTimes();
    prayTimes.setMethod(timesSet.method);
    const now = new Date(), h = prayTimes.getTimes(now, [timesSet.lat, timesSet.lng], 'auto', 'auto', 'Float'), txt = prayTimes.getTimes(now, [timesSet.lat, timesSet.lng], 'auto', 'auto', timesSet.format);
    for (const k of s.prayers) {
      const at = atClock(now, h[k]), id = `${now.toDateString()} ${k}`;
      if (now >= at && now - at < 3 * 60e3 && localStorage['alerts-last'] !== id) { localStorage['alerts-last'] = id; return fire(k, txt[k]) }
    }
  }
  setInterval(check, 5e3); setTimeout(check, 1500);

  window.Alerts = {
    get, set: v => save('alerts', v), fire, stopSound, next: async () => (await ensureTimes(), nextPrayer()),
    permission: async () => 'Notification' in window ? (Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission) : 'unsupported',
    simulate: secs => { localStorage['alerts-sim'] = Date.now() + secs * 1e3 },
  };
})();
