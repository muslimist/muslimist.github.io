[![Generic badge](https://img.shields.io/badge/ad--free-yes-brightgreen.svg)](#)
[![Generic badge](https://img.shields.io/badge/open_source-yes-brightgreen.svg)](#)
[![Generic badge](https://img.shields.io/badge/spyware-no-brightgreen.svg)](#)
[![Maintenance](https://img.shields.io/badge/maintained-yes-brightgreen.svg)](https://github.com/muslimist/muslimist.github.io/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/muslimist/muslimist.github.io.svg)](https://github.com/muslimist/muslimist.github.io/issues)
[![GitHub pull-requests](https://img.shields.io/github/issues-pr/muslimist/muslimist.github.io.svg)](https://github.com/muslimist/muslimist.github.io/pulls)
[![Website monip.org](https://img.shields.io/website-up-down-brightgreen-red/https/muslimist.com.svg)](https://muslimist.com)


<br />
<p align="center">
  <a href="https://github.com/muslimist/muslimist.github.io">
    <img src="https://raw.githubusercontent.com/muslimist/muslimist.github.io/master/docs/assets/icons/apple-icon-180.png" alt="Logo" width="80" height="80">
  </a>

  <h1 align="center">muslimist</h1>

  <p align="center">
    an ad-free, open source, non-spying collection of tools for muslims
  </p>
</p>



Plain HTML, CSS and JS in `docs/` (served by GitHub Pages). No build step, no dependencies, no third-party requests: the only outside request is Quran recitation audio from everyayah.com, and only after you press play.

- `docs/assets/site.css`, `site.js`: shared look, translation (English/Arabic), light/dark, glass/solid
- `docs/<page>/index.html`: each page with its own script inline
- `scripts/`: checks for the duaa page (`python3 scripts/check-duaa.py`, `node scripts/check-duaa-audio.cjs`)

Local preview (supports seeking in audio recordings):

```sh
npx --yes http-server docs -a 127.0.0.1 -p 8081 -c-1
```

## Photos

Each page's background is a random photo from its set (`docs/assets/img/bg-<page>-<n>.webp`), and each duaa category card has its own photo (`cat-<n>.webp`). Photo 0 of each set is the original site photo; the rest are from [Unsplash](https://unsplash.com/license):

- home 1–6: [Mosquegrapher](https://unsplash.com/photos/uouvblwaQs4), [Pegah Moghadas](https://unsplash.com/photos/F6eF6B31U8k), [Alim](https://unsplash.com/photos/kVwhz550_s4), [Esmonde Yong](https://unsplash.com/photos/7_COgbItdkQ), [Evgeny Matveev](https://unsplash.com/photos/2qjyxJhhK-U), [İlayda Öztürk](https://unsplash.com/photos/kwiB75M_cA4)
- quran 1–5: [Malik Shibly](https://unsplash.com/photos/lKbz2ejxYbA), [Ashkan Forouzani](https://unsplash.com/photos/7blIFp0kFP4), [Abdullah Arif](https://unsplash.com/photos/Dxi6KbpvUgA), [The Dancing Rain](https://unsplash.com/photos/_KPuV9qSSlU), [Jawad Jawahir](https://unsplash.com/photos/N2n2skjSpq0)
- duaa 1–5: [Masjid MABA](https://unsplash.com/photos/QhzQfD0ihnI), [Hamza Lahlimi](https://unsplash.com/photos/_HVARV69ABQ), [Masjid MABA](https://unsplash.com/photos/GN-C7cDq1C8), [Masjid MABA](https://unsplash.com/photos/uD8LmeylrPI), [Sinan Toy](https://unsplash.com/photos/s8xjo4yjnHc)
- times 1–5: [David Billings](https://unsplash.com/photos/EwcvNe53bdM), [Simon Infanger](https://unsplash.com/photos/ECctP9oPtio), [adam hilles](https://unsplash.com/photos/Bh_NL4I4GI0), [nurhan](https://unsplash.com/photos/yC70QqvrPRk), [Dimitris Asproloupos](https://unsplash.com/photos/GitzSoxKSjs)
- qibla 1–5: [Untung Bekti Nugroho](https://unsplash.com/photos/6Aa4EeZTdqw), [ekrem osmanoglu](https://unsplash.com/photos/FLFjAn3gQI8), [Sam Riz](https://unsplash.com/photos/ceNCWYqL8DY), [Rumman Amin](https://unsplash.com/photos/tvEDhFhBhXM), [Izuddin Helmi Adnan](https://unsplash.com/photos/JFirQekVo3U)
- hadith 0–4: [Abdullah Faraz](https://unsplash.com/photos/fj-p_oVIhYE), [Defrino Maasy](https://unsplash.com/photos/P1ONhK15-to), [Haci](https://unsplash.com/photos/uyDdZgW3q-M), [Fey Marin](https://unsplash.com/photos/InicS-5dMO4), [Haci](https://unsplash.com/photos/qfm19-jIzwg)
- names 0–4: [Husien Bisky](https://unsplash.com/photos/7BJLevWXr5c), [Nazreen Banu](https://unsplash.com/photos/e7SCNFRC3OE), [Daniel Silva](https://unsplash.com/photos/9Bn_LU3TPFM), [Thomas George](https://unsplash.com/photos/sjHv7DyantQ), [Abdullah Habib](https://unsplash.com/photos/IRt-IePyqiA)
- salah 0–4: [Alim](https://unsplash.com/photos/s8fQHF9rxMo), [Alim](https://unsplash.com/photos/oHsMklLpCdw), [ekrem osmanoglu](https://unsplash.com/photos/6tLQ3kz0QV0), [ekrem osmanoglu](https://unsplash.com/photos/y8ZC0PwFOYU), [ekrem osmanoglu](https://unsplash.com/photos/_1xLgMnaL1U)
- calendar 0–4: [Benjamin Voros](https://unsplash.com/photos/U-Kty6HxcQc), [Martin Adams](https://unsplash.com/photos/LuH6F1tgdB8), [Rob Wicks](https://unsplash.com/photos/1tOk5nBvUV0), [Ijaz Rafi](https://unsplash.com/photos/tBR4sct4gm4), [Aastik Maurya](https://unsplash.com/photos/rX7EsMuyTn0)
- ramadan 0–4: [Ján Čorba](https://unsplash.com/photos/Ueis6yE3zUI), [Craig Manners](https://unsplash.com/photos/dl-CPiekQug), [Kasem Sleem](https://unsplash.com/photos/4MicXpCNRVY), [Astrid Schaffner](https://unsplash.com/photos/DI0kcDamUZI), [hidefumi ohmichi](https://unsplash.com/photos/19g3MKYV8yE)
- zakat 0–4: [Andrew Moca](https://unsplash.com/photos/olmY3NkTY_M), [National Cancer Institute](https://unsplash.com/photos/BxXgTQEw1M4), [Claudia Love](https://unsplash.com/photos/-v9tsExFF9w), [Matheus Ferrero](https://unsplash.com/photos/yfmjALh1S6s), [Tucker  Tangeman](https://unsplash.com/photos/SnXraH8PaQ4)
- duaa categories: [Zach Reiner](https://unsplash.com/photos/2vKgG0pSKkM) (daily), [Mustafa akın](https://unsplash.com/photos/5LXejuCs-qE) (thikr), [Kelli McClintock](https://unsplash.com/photos/wBgAVAGjzFg) (people), [Nathan Anderson](https://unsplash.com/photos/L95xDkSSuWw) (iman), [Marcelo Leal](https://unsplash.com/photos/6pcGTJDuf6M) (illness); the other four reuse photos credited above

## Adhan

Prayer alerts play the adhan recorded in Doha, Qatar (2013–2014), one for each prayer, from the Internet Archive's [Adhan Recordings from Doha, Qatar](https://archive.org/details/adhan.recordings.from.doha.qatar) (Public Domain Mark). The files in `docs/assets/athan/` are trimmed, loudness-matched and converted to mono.
