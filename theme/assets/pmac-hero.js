(() => {
  class PmacHero extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('[data-pmac-hero-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-pmac-hero-dot]'));
      this.fills = this.dots.map((dot) => dot.querySelector('.pmac-progress__fill'));
      this.duration = (parseFloat(this.dataset.duration) || 6) * 1000;
      this.index = 0;
      this.timer = null;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.dots.forEach((dot, i) => {
        dot.addEventListener('click', () => this.goTo(i));
      });

      if (this.slides.length > 1 && !this.reducedMotion) {
        this.addEventListener('mouseenter', () => this.pause());
        this.addEventListener('mouseleave', () => this.play());
        this.play();
      }
    }

    disconnectedCallback() {
      this.pause();
    }

    goTo(nextIndex) {
      if (nextIndex === this.index) return;
      this.slides[this.index].classList.remove('is-active');
      this.dots[this.index]?.classList.remove('is-active');
      this.index = nextIndex;
      this.slides[this.index].classList.add('is-active');
      this.dots[this.index]?.classList.add('is-active');
      this.restartFill();
      if (!this.reducedMotion && this.slides.length > 1) this.play();
    }

    next() {
      this.goTo((this.index + 1) % this.slides.length);
    }

    restartFill() {
      this.fills.forEach((fill, i) => {
        if (!fill) return;
        fill.style.transition = 'none';
        fill.style.transform = i === this.index ? 'scaleX(0)' : 'scaleX(0)';
      });
    }

    play() {
      this.pause();
      const fill = this.fills[this.index];
      if (fill) {
        fill.style.transition = 'none';
        fill.style.transform = 'scaleX(0)';
        // Force reflow so the transition below actually animates from 0.
        // eslint-disable-next-line no-unused-expressions
        fill.offsetWidth;
        fill.style.transition = `transform ${this.duration}ms linear`;
        fill.style.transform = 'scaleX(1)';
      }
      this.timer = window.setTimeout(() => this.next(), this.duration);
    }

    pause() {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }

  customElements.define('pmac-hero', PmacHero);
})();
