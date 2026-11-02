/* Effetto "decifrazione" per i testi di sistema in monospazio. */
(() => {
  const CHARS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/+-';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class ScrambleText {
    constructor(el) {
      this.el = el;
      this.original = el.dataset.pmacScramble || el.textContent;
      this.frame = null;
      this.queue = [];
    }

    play() {
      if (prefersReducedMotion) {
        this.el.textContent = this.original;
        return;
      }

      cancelAnimationFrame(this.frame);
      const length = this.original.length;
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const start = Math.floor(Math.random() * 8);
        const end = start + Math.floor(Math.random() * 8) + 4;
        this.queue.push({ from: '', to: this.original[i], start, end, char: '' });
      }

      let frameCount = 0;
      const update = () => {
        let output = '';
        let complete = 0;
        for (let i = 0; i < this.queue.length; i++) {
          const q = this.queue[i];
          if (frameCount >= q.end) {
            complete++;
            output += q.to;
          } else if (frameCount >= q.start) {
            if (q.to === ' ') {
              output += ' ';
            } else if (!q.char || Math.random() < 0.3) {
              q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
              output += q.char;
            } else {
              output += q.char;
            }
          } else {
            output += '';
          }
        }
        this.el.textContent = output;
        if (complete < this.queue.length) {
          frameCount++;
          this.frame = requestAnimationFrame(update);
        }
      };
      update();
    }
  }

  const instances = new WeakMap();

  const getInstance = (el) => {
    if (!instances.has(el)) instances.set(el, new ScrambleText(el));
    return instances.get(el);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          getInstance(entry.target).play();
        }
      });
    },
    { threshold: 0.4 }
  );

  const init = () => {
    document.querySelectorAll('[data-pmac-scramble]').forEach((el) => observer.observe(el));
  };

  window.pmacScramble = (el) => getInstance(el).play();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
