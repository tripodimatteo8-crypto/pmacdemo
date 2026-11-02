(() => {
  const initTyping = (el) => {
    if (el.dataset.pmacTypingReady) return;
    const textEl = el.querySelector('[data-pmac-typing-text]');
    if (!textEl) return;
    el.dataset.pmacTypingReady = 'true';

    const messages = (el.dataset.messages || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!messages.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textEl.textContent = messages[0];
      return;
    }

    let m = 0;
    let c = 0;

    const tick = () => {
      const msg = messages[m];
      if (c <= msg.length) {
        textEl.textContent = msg.slice(0, c);
        c += 1;
        window.setTimeout(tick, 70);
      } else {
        window.setTimeout(() => {
          c = 0;
          m = (m + 1) % messages.length;
          tick();
        }, 1600);
      }
    };

    tick();
  };

  document.querySelectorAll('[data-pmac-typing]').forEach(initTyping);
})();
