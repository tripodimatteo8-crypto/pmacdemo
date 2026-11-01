(() => {
  const rabbit = document.getElementById('pmac-rabbit');
  if (!rabbit) return;

  const frequencyMinutes = (window.pmacSettings && window.pmacSettings.rabbitFrequency) || 3;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Soglia di scroll (px) prima che il coniglio possa riapparire. La frequenza
  // impostata dal tema scala la soglia: valori bassi = appare più spesso.
  const baseThreshold = Math.max(300, frequencyMinutes * 220);

  const randomSpot = () => {
    const margin = 80;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge = Math.floor(Math.random() * 4);
    let top;
    let left;

    if (edge === 0) {
      top = margin;
      left = margin + Math.random() * (vw - margin * 2);
    } else if (edge === 1) {
      top = vh - margin - 140;
      left = margin + Math.random() * (vw - margin * 2);
    } else if (edge === 2) {
      top = margin + Math.random() * (vh - margin * 2 - 140);
      left = margin;
    } else {
      top = margin + Math.random() * (vh - margin * 2 - 140);
      left = vw - margin - 100;
    }

    return { top, left };
  };

  const show = () => {
    if (document.hidden) return;
    const { top, left } = randomSpot();
    rabbit.style.top = `${top}px`;
    rabbit.style.left = `${left}px`;
    rabbit.style.transform = prefersReducedMotion ? 'none' : 'translateY(12px)';
    rabbit.classList.add('is-visible');

    requestAnimationFrame(() => {
      rabbit.style.transform = 'none';
    });

    window.setTimeout(() => {
      rabbit.classList.remove('is-visible');
    }, 4200);
  };

  let scrolled = 0;
  let nextThreshold = baseThreshold * (0.7 + Math.random() * 0.8);
  let lastY = window.scrollY;
  let cooling = false;
  let ticking = false;

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
          nextThreshold = baseThreshold * (0.7 + Math.random() * 0.8);
          cooling = true;
          window.setTimeout(() => {
            cooling = false;
          }, 4200);
        }
      }

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();
