/* PMAC — traiettoria Terra → Pianeta 121: progresso di scroll, distanza in anni
   luce (121 → 0 all'arrivo sulla sezione Planet 121) e tappa corrente. */
(() => {
  const el = document.getElementById('PmacTrajectory');
  const data = document.getElementById('PmacTrajectoryStages');
  if (!el || !data) return;

  let stages = [];
  try {
    stages = JSON.parse(data.textContent);
  } catch (e) {
    return;
  }

  const rail = el.querySelector('.pmac-traj__rail');
  const distEl = el.querySelector('[data-traj-dist]');
  const stageEl = el.querySelector('[data-traj-stage]');
  const MAX_LY = 121;

  let anchors = [];
  let arrivalY = 0;
  let lastStage = '';
  let lastY = window.scrollY;
  let lastT = performance.now();
  let ticking = false;

  const docY = (node) => node.getBoundingClientRect().top + window.scrollY;

  const measure = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    anchors = stages
      .map((s) => {
        const node = document.querySelector(s.sel);
        return node ? { ...s, y: docY(node) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.y - b.y);
    const arrival = anchors.find((a) => a.arrival);
    arrivalY = arrival ? Math.max(1, arrival.y - window.innerHeight * 0.35) : maxScroll;

    rail.querySelectorAll('.pmac-traj__tick').forEach((t) => t.remove());
    anchors.forEach((a) => {
      const t = document.createElement('span');
      t.className = 'pmac-traj__tick';
      t.style.top = `${Math.min(100, (Math.max(0, a.y - window.innerHeight * 0.35) / maxScroll) * 100)}%`;
      a.tick = t;
      rail.appendChild(t);
    });
    return maxScroll;
  };

  let maxScroll = 1;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const now = performance.now();
    const speed = Math.min(1, Math.abs(y - lastY) / Math.max(1, now - lastT) / 3);
    lastY = y;
    lastT = now;

    const p = Math.min(1, Math.max(0, y / maxScroll));
    el.style.setProperty('--p', p.toFixed(4));
    el.style.setProperty('--speed', speed.toFixed(2));

    const toArrival = Math.min(1, Math.max(0, y / arrivalY));
    const ly = MAX_LY * (1 - toArrival);
    if (distEl) distEl.textContent = ly.toFixed(3).padStart(7, '0');
    el.classList.toggle('is-arrived', toArrival >= 1);

    const probe = y + window.innerHeight * 0.4;
    let current = anchors[0];
    anchors.forEach((a) => {
      if (a.y <= probe) current = a;
      if (a.tick) a.tick.classList.toggle('is-passed', a.y <= probe);
    });
    if (current && current.label !== lastStage && stageEl) {
      lastStage = current.label;
      stageEl.textContent = current.label;
      stageEl.classList.remove('is-new');
      void stageEl.offsetWidth;
      stageEl.classList.add('is-new');
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const init = () => {
    maxScroll = measure();
    update();
    el.classList.add('is-ready');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    maxScroll = measure();
    update();
  });
  window.addEventListener('load', init);
  // le sezioni con immagini/mappa cambiano altezza mentre caricano: rimisura un paio di volte
  setTimeout(init, 300);
  setTimeout(() => {
    maxScroll = measure();
    update();
  }, 2500);
})();
