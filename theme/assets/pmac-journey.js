/* PMAC — The Journey: su desktop il binario delle tappe scorre in orizzontale
   mentre si scrolla in verticale (sezione "pinnata"); su mobile resta lo swipe nativo.
   Barra di avanzamento sincronizzata in entrambi i casi. */
(() => {
  const root = document.querySelector('[data-pmac-journey]');
  if (!root) return;
  const track = root.querySelector('[data-journey-track]');
  const viewport = root.querySelector('.pmac-journey__viewport');
  const bar = root.querySelector('[data-journey-bar]');
  const mq = window.matchMedia('(min-width: 990px) and (prefers-reduced-motion: no-preference)');
  let distance = 0;
  let ticking = false;

  const setBar = (p) => bar && bar.parentElement.style.setProperty('--jp', p.toFixed(4));

  const layout = () => {
    track.style.transform = '';
    if (!mq.matches) {
      root.classList.remove('is-pinned');
      root.style.removeProperty('--pin-h');
      return;
    }
    root.classList.add('is-pinned');
    const vpStyle = getComputedStyle(viewport);
    const padR = parseFloat(vpStyle.paddingRight) || 0;
    distance = Math.max(0, track.scrollWidth + padR * 2 - window.innerWidth);
    root.style.setProperty('--pin-h', `${window.innerHeight + distance}px`);
    update();
  };

  const update = () => {
    ticking = false;
    if (!root.classList.contains('is-pinned')) return;
    const r = root.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
    setBar(p);
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  viewport.addEventListener('scroll', () => {
    if (root.classList.contains('is-pinned')) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    setBar(max > 0 ? viewport.scrollLeft / max : 0);
  }, { passive: true });

  window.addEventListener('resize', layout);
  mq.addEventListener ? mq.addEventListener('change', layout) : mq.addListener(layout);
  window.addEventListener('load', layout);
  layout();
})();
