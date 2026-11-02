(() => {
  const canRun = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cursor = document.getElementById('pmac-cursor');
  if (!canRun || !cursor) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let cx = x;
  let cy = y;
  const EASE = 0.18;

  const tick = () => {
    cx += (x - cx) * EASE;
    cy += (y - cy) * EASE;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.classList.add('is-ready');
  });

  const hoverTargets = 'a, button, [role="button"], .pmac-sheen, input, textarea, select, summary';

  document.addEventListener('mouseover', (event) => {
    if (event.target.closest && event.target.closest(hoverTargets)) {
      cursor.classList.add('is-hover');
    }
  });

  document.addEventListener('mouseout', (event) => {
    if (event.target.closest && event.target.closest(hoverTargets)) {
      cursor.classList.remove('is-hover');
    }
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('is-ready'));

  requestAnimationFrame(tick);
})();
