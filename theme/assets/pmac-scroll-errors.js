(() => {
  const el = document.getElementById('pmac-scroll-error');
  if (!el) return;
  const textEl = el.querySelector('[data-pmac-scroll-error-text]');
  if (!textEl) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const messages = [
    'ERROR // SIGNAL LOST',
    'CONNECTION UNSTABLE',
    'TRANSMISSION INTERRUPTED',
    'DATA CORRUPTED // RETRYING',
    'PACKET LOSS DETECTED',
    'REROUTING SIGNAL…',
    'SOURCE UNKNOWN',
    'DECODING FAILED',
  ];

  // Soglia di scroll (px) prima che possa comparire un nuovo messaggio.
  const baseThreshold = 900;
  let scrolled = 0;
  let nextThreshold = baseThreshold * (0.8 + Math.random() * 1.1);
  let lastY = window.scrollY;
  let cooling = false;
  let ticking = false;

  const show = () => {
    if (document.hidden) return;
    const message = messages[Math.floor(Math.random() * messages.length)];
    textEl.textContent = message;
    el.style.left = `${8 + Math.random() * 60}%`;
    el.classList.toggle('is-glitching', !prefersReducedMotion);
    el.classList.add('is-visible');

    window.setTimeout(() => {
      el.classList.remove('is-visible', 'is-glitching');
    }, 2200);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = Math.abs(y - lastY);
      lastY = y;

      if (!cooling) {
        scrolled += delta;
        if (scrolled >= nextThreshold) {
          show();
          scrolled = 0;
          nextThreshold = baseThreshold * (0.8 + Math.random() * 1.1);
          cooling = true;
          window.setTimeout(() => {
            cooling = false;
          }, 2600);
        }
      }

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();
