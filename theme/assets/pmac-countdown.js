(() => {
  const pad = (n) => String(Math.max(n, 0)).padStart(2, '0');

  const tick = (el) => {
    const target = new Date(el.dataset.pmacCountdown).getTime();
    if (Number.isNaN(target)) return;

    const daysEl = el.querySelector('[data-countdown-days]');
    const hoursEl = el.querySelector('[data-countdown-hours]');
    const minutesEl = el.querySelector('[data-countdown-minutes]');
    const secondsEl = el.querySelector('[data-countdown-seconds]');

    const update = () => {
      const diff = Math.max(target - Date.now(), 0);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minutesEl) minutesEl.textContent = pad(minutes);
      if (secondsEl) secondsEl.textContent = pad(seconds);

      if (diff <= 0) window.clearInterval(interval);
    };

    update();
    const interval = window.setInterval(update, 1000);
  };

  document.querySelectorAll('[data-pmac-countdown]').forEach(tick);
})();
