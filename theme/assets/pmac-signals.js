/* PMAC — notifiche di sistema ("NEW SIGNAL DETECTED — MILAN" ...).
   Messaggi, intervallo e massimo per sessione da Impostazioni tema.
   Non compaiono durante l'intro, con il carrello o la card del Tracker aperti,
   né con la scheda del browser in background. Stato in sessionStorage. */
(() => {
  const host = document.getElementById('PmacSignals');
  const dataEl = document.getElementById('PmacSignalsData');
  if (!host || !dataEl) return;

  let cfg;
  try {
    cfg = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  const messages = (cfg.messages || []).filter(Boolean);
  if (!messages.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) {
      try {
        const v = sessionStorage.getItem(k);
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        sessionStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };

  const intervalMs = Math.max(10, cfg.interval || 25) * 1000;
  const max = Math.max(1, cfg.max || 4);
  const LIFE = 6000;

  const busy = () =>
    document.documentElement.classList.contains('pmac-intro-on') ||
    document.querySelector('cart-drawer.active') ||
    document.querySelector('[data-tracker-card][data-open]') ||
    document.querySelector('menu-drawer details[open], .menu-drawer-container[open]') ||
    document.hidden;

  const scramble = (el, text) => {
    if (reduce) {
      el.textContent = text;
      return;
    }
    const glyphs = '01#/<>_—=+*';
    let frame = 0;
    const total = Math.min(28, text.length + 8);
    const step = () => {
      const revealed = Math.floor((frame / total) * text.length);
      let out = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) requestAnimationFrame(step);
      else el.textContent = text;
    };
    requestAnimationFrame(step);
  };

  const dismiss = (toast) => {
    if (!toast || toast.classList.contains('is-leaving')) return;
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), reduce ? 0 : 380);
  };

  const show = () => {
    const shown = store.get('pmacSignalsShown', 0);
    if (shown >= max) return false;
    if (busy()) return false;

    const idx = store.get('pmacSignalsIdx', 0) % messages.length;
    store.set('pmacSignalsIdx', idx + 1);
    store.set('pmacSignalsShown', shown + 1);
    store.set('pmacSignalsLast', Date.now());

    const toast = document.createElement('div');
    toast.className = 'pmac-signal';
    toast.style.setProperty('--life', `${LIFE}ms`);
    const time = new Date().toISOString().slice(11, 19);
    toast.innerHTML =
      '<div class="pmac-signal__head"><span class="pmac-signal__dot"></span>' +
      `<span>INCOMING // ${time} UTC</span>` +
      '<button type="button" class="pmac-signal__close" aria-label="Close">×</button></div>' +
      '<div class="pmac-signal__text"></div><span class="pmac-signal__life"></span>';
    host.appendChild(toast);
    scramble(toast.querySelector('.pmac-signal__text'), messages[idx]);
    toast.querySelector('.pmac-signal__close').addEventListener('click', () => dismiss(toast));
    setTimeout(() => dismiss(toast), LIFE);
    return true;
  };

  const schedule = (delay) => {
    setTimeout(() => {
      if (store.get('pmacSignalsShown', 0) >= max) return;
      // se il momento non è adatto riprova presto, senza consumare il messaggio
      schedule(show() ? intervalMs : 4000);
    }, delay);
  };

  const last = store.get('pmacSignalsLast', 0);
  const sinceLast = Date.now() - last;
  const first = last ? Math.max(6000, intervalMs - sinceLast) : 9000;
  schedule(first);
})();
