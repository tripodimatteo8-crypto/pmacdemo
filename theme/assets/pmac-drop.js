/* PMAC — drop programmati: countdown e sblocco automatico all'ora di apertura,
   senza ricaricare la pagina. Il blocco lato server (Liquid) vale al caricamento;
   questo script lo toglie quando il tempo scade mentre la pagina è aperta. */
(() => {
  const nodes = () => document.querySelectorAll('[data-pmac-drop], [data-pmac-drop-countdown]');
  if (!nodes().length) return;

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  const parts = (ms) => ({
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  });

  const unlock = (iso) => {
    document.querySelectorAll(`[data-pmac-drop="${CSS.escape(iso)}"]`).forEach((el) => {
      el.removeAttribute('data-pmac-drop'); // una volta sola: i tick successivi lo ignorano
      if (el.classList.contains('pmac-drop-hidden')) {
        el.classList.remove('pmac-drop-hidden');
        el.classList.add('is-pmac-unlocked');
      } else if (el.classList.contains('pmac-drop-locked')) {
        el.classList.remove('pmac-drop-locked');
        el.querySelector('.pmac-drop-veil')?.remove();
        el.querySelector('.pmac-drop-price')?.remove();
        el.classList.add('is-pmac-unlocked');
      } else {
        el.remove(); // pannello lock / "price withheld"
      }
    });
  };

  const tick = () => {
    const now = Date.now();
    const done = new Set();
    document.querySelectorAll('[data-pmac-drop-countdown]').forEach((el) => {
      const iso = el.dataset.pmacDropCountdown;
      const t = Date.parse(iso);
      if (Number.isNaN(t)) return;
      const left = t - now;
      if (left <= 0) {
        done.add(iso);
        el.removeAttribute('data-pmac-drop-countdown');
        return;
      }
      const p = parts(left);
      if (el.dataset.format === 'blocks') {
        el.querySelector('[data-d]').textContent = pad(p.d);
        el.querySelector('[data-h]').textContent = pad(p.h);
        el.querySelector('[data-m]').textContent = pad(p.m);
        el.querySelector('[data-s]').textContent = pad(p.s);
      } else {
        el.textContent = `${pad(p.d)}D ${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
      }
    });
    document.querySelectorAll('[data-pmac-drop]').forEach((el) => {
      const t = Date.parse(el.dataset.pmacDrop);
      if (!Number.isNaN(t) && t <= now) done.add(el.dataset.pmacDrop);
    });
    done.forEach(unlock);
  };

  // Data di apertura nel fuso del visitatore (es. "06.11.2026 — 18:00 CET")
  document.querySelectorAll('[data-pmac-drop-date]').forEach((el) => {
    const t = Date.parse(el.dataset.pmacDropDate);
    if (Number.isNaN(t)) return;
    const d = new Date(t);
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    let tz = '';
    try {
      tz = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
        .formatToParts(d)
        .find((x) => x.type === 'timeZoneName').value;
    } catch (e) {}
    el.textContent = `${date} — ${time}${tz ? ` ${tz}` : ''}`;
  });

  tick();
  const timer = setInterval(() => {
    tick();
    if (!document.querySelector('[data-pmac-drop], [data-pmac-drop-countdown]')) clearInterval(timer);
  }, 1000);
})();
