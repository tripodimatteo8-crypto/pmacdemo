(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const init = () => {
    document.querySelectorAll('.pmac-reveal-group').forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        child.style.setProperty('--reveal-index', index);
        child.classList.add('pmac-reveal');
      });
    });

    if (prefersReducedMotion) {
      document.querySelectorAll('.pmac-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    document.querySelectorAll('.pmac-reveal').forEach((el) => observer.observe(el));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
