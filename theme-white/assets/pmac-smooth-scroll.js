/* Scroll fluido leggero (alternativa custom a Lenis, zero dipendenze esterne).
   Attivo solo su desktop con mouse e se l'utente non ha richiesto reduced motion. */
(() => {
  const canRun =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canRun) return;

  const EASE = 0.085;
  let current = window.scrollY;
  let target = window.scrollY;
  let lastSet = window.scrollY;
  let rafId = null;
  let active = false;

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  const onWheel = (event) => {
    if (event.ctrlKey) return; // let browser/page zoom gestures through
    target = Math.min(Math.max(target + event.deltaY, 0), maxScroll());
    event.preventDefault();
    start();
  };

  const onScroll = () => {
    if (Math.abs(window.scrollY - lastSet) > 2) {
      // Scroll came from somewhere else (anchor link, keyboard, scrollIntoView).
      current = window.scrollY;
      target = window.scrollY;
    }
  };

  const tick = () => {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      active = false;
    }
    lastSet = Math.round(current);
    window.scrollTo(0, lastSet);
    if (active) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const start = () => {
    if (!active) {
      active = true;
      rafId = requestAnimationFrame(tick);
    }
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    target = Math.min(target, maxScroll());
  });
})();
