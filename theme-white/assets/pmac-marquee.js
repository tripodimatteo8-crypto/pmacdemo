(() => {
  const setup = (marquee) => {
    const track = marquee.querySelector('.pmac-marquee__track');
    if (!track || track.dataset.pmacCloned) return;

    const pxPerSecond = parseFloat(marquee.dataset.speed || '60');
    const originalWidth = track.scrollWidth;

    track.innerHTML += track.innerHTML;
    track.dataset.pmacCloned = 'true';

    const duration = Math.max(originalWidth / pxPerSecond, 8);
    track.style.setProperty('--marquee-duration', `${duration}s`);
  };

  const init = () => {
    document.querySelectorAll('.pmac-marquee').forEach(setup);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
