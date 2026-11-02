/* PMAC — sequenza di lancio post-ordine: box disegnata → sigillata → nastro
   giallo-nero → caricata → video del decollo → messaggi → "Mission started".
   Con "riduci movimento" mostra subito lo stato finale. */
(() => {
  const root = document.querySelector('[data-pmac-launch]');
  if (!root) return;
  const video = root.querySelector('[data-launch-video]');
  const items = [...root.querySelectorAll('[data-launch-log] li')];
  const clock = root.querySelector('[data-launch-clock]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  let start = 0;
  let raf = 0;

  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const fmt = (ms) => {
    const s = Math.abs(ms) / 1000;
    return `${ms < 0 ? 'T-' : 'T+'}${String(Math.floor(s / 60)).padStart(2, '0')}:${s % 60 < 10 ? '0' : ''}${(s % 60).toFixed(1)}`;
  };
  const rocketOnly = root.dataset.box !== 'true';
  // solo razzo: il video parte subito (accensione ~1,5s, decollo ~2,4s dall'inizio)
  const LIFTOFF = rocketOnly ? 2700 : 4500;

  const tickClock = () => {
    const t = performance.now() - start;
    if (clock) clock.textContent = fmt(t - LIFTOFF);
    if (t < 10000) raf = requestAnimationFrame(tickClock);
  };

  const logAt = (i, ms) =>
    at(ms, () => {
      const li = items[i];
      if (!li) return;
      const t = li.querySelector('[data-t]');
      if (t) t.textContent = fmt(ms - LIFTOFF);
      li.classList.add('is-on');
    });

  const reset = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    root.classList.remove('is-drawing', 'is-sealed', 'is-taped', 'is-rocket', 'is-loading', 'is-ignite', 'is-liftoff', 'is-film', 'is-done');
    items.forEach((li) => li.classList.remove('is-on'));
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const run = () => {
    reset();
    if (reduce) {
      root.classList.add('is-drawing', 'is-sealed', 'is-taped', 'is-rocket', 'is-done');
      items.forEach((li) => li.classList.add('is-on'));
      return;
    }
    start = performance.now();
    tickClock();
    if (rocketOnly) {
      at(250, () => {
        root.classList.add('is-film');
        document.dispatchEvent(new CustomEvent('pmac:launch'));
        if (video) {
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        }
      });
      logAt(0, 400);
      logAt(1, 1700);
      logAt(2, LIFTOFF + 200);
      logAt(3, 4300);
      for (let i = 4; i < items.length; i++) logAt(i, 4300 + (i - 3) * 500);
      at(5000, () => root.classList.add('is-done'));
      return;
    }
    // box → sigillo → nastro → razzo → carico → accensione → decollo → video → finale
    requestAnimationFrame(() => root.classList.add('is-drawing'));
    logAt(0, 300);
    at(1300, () => root.classList.add('is-sealed'));
    at(1750, () => root.classList.add('is-taped'));
    logAt(1, 1900);
    at(2600, () => root.classList.add('is-rocket'));
    at(3200, () => root.classList.add('is-loading'));
    logAt(2, 3300);
    at(3900, () => {
      root.classList.add('is-ignite');
      document.dispatchEvent(new CustomEvent('pmac:launch'));
    });
    at(LIFTOFF, () => root.classList.add('is-liftoff'));
    logAt(3, LIFTOFF + 150);
    at(5300, () => {
      root.classList.add('is-film');
      if (video) {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      }
    });
    logAt(4, 8400);
    at(9000, () => root.classList.add('is-done'));
  };

  root.querySelector('[data-launch-replay]')?.addEventListener('click', run);

  // parte quando la scena è visibile (la pagina può essere aperta in background)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) {
        io.disconnect();
        run();
      }
    }, { threshold: 0.35 });
    io.observe(root.querySelector('.pmac-launch__stage'));
  } else {
    run();
  }
})();
