/* PMAC — sound design (brief: "piccoli effetti per radar, notifiche, apertura portale,
   click... disattivabili facilmente"). Sempre SPENTO di default: lo accende il visitatore
   dall'interruttore SOUND nella barra in alto; la scelta resta salvata (localStorage).
   Web Audio API: i file vengono scaricati solo dopo l'accensione. */
(() => {
  const toggle = document.querySelector('[data-pmac-sound-toggle]');
  const cfgEl = document.getElementById('PmacSoundFiles');
  if (!toggle || !cfgEl) return;
  let files;
  try {
    files = JSON.parse(cfgEl.textContent);
  } catch (e) {
    return;
  }

  const KEY = 'pmacSound';
  const store = {
    get: () => {
      try {
        return localStorage.getItem(KEY) === 'on';
      } catch (e) {
        return false;
      }
    },
    set: (v) => {
      try {
        localStorage.setItem(KEY, v ? 'on' : 'off');
      } catch (e) {}
    },
  };

  let ctx = null;
  let master = null;
  const buffers = {};
  let on = false;
  let droneTimer = null;
  let droneGain = null;

  const ensureCtx = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  };

  const load = (name) => {
    if (buffers[name]) return buffers[name];
    buffers[name] = fetch(files[name])
      .then((r) => r.arrayBuffer())
      .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .catch(() => null);
    return buffers[name];
  };

  const play = async (name, vol = 0.4) => {
    if (!on || !ensureCtx()) return;
    const buf = await load(name);
    if (!buf || !on) return;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(master);
    src.start();
  };

  // drone ambientale: due copie in dissolvenza incrociata, così il loop non "stacca"
  const startDrone = async () => {
    const buf = await load('drone');
    if (!buf || !on || droneGain) return;
    droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5);
    droneGain.connect(master);
    const FADE = 2;
    const span = Math.max(2, buf.duration - FADE);
    const voice = () => {
      if (!droneGain) return;
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      src.buffer = buf;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + FADE);
      g.gain.setValueAtTime(1, t + span - FADE);
      g.gain.linearRampToValueAtTime(0, t + span + FADE * 0.5);
      src.connect(g).connect(droneGain);
      src.start(t);
      src.stop(t + span + FADE);
      droneTimer = setTimeout(voice, (span - FADE) * 1000);
    };
    voice();
  };

  const stopDrone = () => {
    clearTimeout(droneTimer);
    if (droneGain && ctx) {
      const g = droneGain;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => g.disconnect(), 800);
    }
    droneGain = null;
  };

  const render = () => {
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    toggle.classList.toggle('is-on', on);
    const label = toggle.querySelector('[data-sound-label]');
    if (label) label.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  };

  const enable = (withWhoosh) => {
    if (!ensureCtx()) return;
    on = true;
    if (ctx.state === 'suspended') ctx.resume();
    ['click', 'ping', 'add'].forEach(load);
    if (withWhoosh) play('warp', 0.5);
    startDrone();
    render();
  };

  const disable = () => {
    on = false;
    stopDrone();
    render();
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (on) {
      disable();
      store.set(false);
    } else {
      enable(true);
      store.set(true);
    }
  });

  // preferenza salvata: i browser vietano l'audio prima di un gesto dell'utente,
  // quindi si riattiva al primo click/tocco sulla pagina
  if (store.get()) {
    render();
    toggle.classList.add('is-armed');
    const arm = () => {
      if (!on) enable(false);
    };
    window.addEventListener('pointerdown', arm, { once: true, capture: true });
    window.addEventListener('keydown', arm, { once: true, capture: true });
  }

  let lastClick = 0;
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!on) return;
      if (!e.target.closest('a, button, summary, [role="button"], input[type="submit"], .pmac-tracker-pin-icon')) return;
      const now = performance.now();
      if (now - lastClick < 70) return;
      lastClick = now;
      play('click', 0.22);
    },
    { capture: true, passive: true }
  );
  document.addEventListener('pmac:signal', () => play('ping', 0.35));
  document.addEventListener('pmac:cart-add', () => play('add', 0.4));
  document.addEventListener('pmac:launch', () => play('launch', 0.55));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on) ctx.resume();
  });
})();
