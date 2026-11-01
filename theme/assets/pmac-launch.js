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
  const LIFTOFF = 4600;

  const tickClock = () => {
    const t = performance.now() - start;
    if (clock) clock.textContent = fmt(t - LIFTOFF);
    if (t < 9000) raf = requestAnimationFrame(tickClock);
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
    root.classList.remove('is-drawing', 'is-sealed', 'is-taped', 'is-loading', 'is-film', 'is-done');
    items.forEach((li) => li.classList.remove('is-on'));
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const run = () => {
    reset();
    if (reduce) {
      root.classList.add('is-drawing', 'is-sealed', 'is-taped', 'is-done');
      items.forEach((li) => li.classList.add('is-on'));
      return;
    }
    start = performance.now();
    tickClock();
    requestAnimationFrame(() => root.classList.add('is-drawing'));
    logAt(0, 300);
    at(1300, () => root.classList.add('is-sealed'));
    at(1750, () => root.classList.add('is-taped'));
    logAt(1, 1900);
    at(2800, () => root.classList.add('is-loading'));
    logAt(2, 3000);
    at(3300, () => {
      root.classList.add('is-film');
      if (video) {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      }
    });
    logAt(3, LIFTOFF + 200);
    logAt(4, 7000);
    at(7800, () => root.classList.add('is-done'));
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
