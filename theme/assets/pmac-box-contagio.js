/* Carrello "Box Contagio": la box in SVG si riempie in base al numero di articoli nel
   carrello e, a ogni aggiunta, una capsula "entra" nella box con una micro-animazione.
   Si aggancia al bus di eventi cart-update già usato da Dawn (assets/pubsub.js +
   assets/constants.js), quindi non richiede modifiche alla logica di carrello esistente. */
(() => {
  // The cart drawer's markup is replaced wholesale on every cart change (Dawn's
  // section-rendering AJAX update), so DOM nodes cached at load time go stale —
  // every call below re-queries the live elements instead of closing over them.
  let lastCount = null;

  const render = (count, animateParticles) => {
    const box = document.getElementById('PmacBoxContagio');
    if (!box) return;

    const capacity = parseInt(box.dataset.capacity || '8', 10);
    const fillRect = document.getElementById('PmacBoxFill');
    const countLabel = document.getElementById('PmacBoxCount');
    const particlesHost = document.getElementById('PmacBoxParticles');

    if (lastCount === null) lastCount = parseInt(box.dataset.itemCount || '0', 10);

    const ratio = Math.min(count / capacity, 1);
    if (fillRect) fillRect.style.transform = `scaleY(${ratio})`;
    if (countLabel) {
      const padded = count < 10 ? `0${count}` : `${count}`;
      countLabel.textContent = `${padded} / 0${capacity}`;
    }
    box.classList.toggle('is-full', count >= capacity);

    if (animateParticles && count > lastCount && particlesHost) {
      spawnParticles(particlesHost, Math.min(count - lastCount, 5));
    }

    lastCount = count;
    box.dataset.itemCount = String(count);
  };

  const spawnParticles = (particlesHost, quantity) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < quantity; i++) {
      const particle = document.createElement('span');
      particle.className = 'pmac-box-contagio__particle';
      particle.style.animationDelay = `${i * 90}ms`;
      particlesHost.appendChild(particle);
      particle.addEventListener('animationend', () => particle.remove());
    }
  };

  const initialBox = document.getElementById('PmacBoxContagio');
  if (initialBox) render(parseInt(initialBox.dataset.itemCount || '0', 10), false);

  // Different publishers of cart-update hand us different payload shapes —
  // /cart/add.js (product-form) returns the added line, not the cart, so it
  // has no item_count. Rather than special-case every source, just ask the
  // Cart API ourselves for the authoritative count.
  const fetchItemCount = () => {
    const cartUrl = (typeof routes !== 'undefined' && routes?.cart_url) || '/cart';
    return fetch(`${cartUrl}.js`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data && typeof data.item_count === 'number' ? data.item_count : null))
      .catch(() => null);
  };

  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      const fromPayload = event?.cartData?.item_count;
      if (typeof fromPayload === 'number') {
        requestAnimationFrame(() => render(fromPayload, true));
        return;
      }
      fetchItemCount().then((count) => {
        if (count !== null) requestAnimationFrame(() => render(count, true));
      });
    });
  }

  // Al checkout: la box si sigilla e il razzo parte, poi si procede davvero al checkout.
  // Delegato su document perché il bottone viene ri-renderizzato a ogni update del carrello.
  document.addEventListener('click', (event) => {
    const checkoutBtn = event.target.closest('#CartDrawer-Checkout');
    if (!checkoutBtn || checkoutBtn.dataset.pmacLaunching === 'true') return;

    const box = document.getElementById('PmacBoxContagio');
    if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    event.preventDefault();
    checkoutBtn.dataset.pmacLaunching = 'true';
    box.classList.add('is-launching');

    setTimeout(() => {
      checkoutBtn.form?.requestSubmit(checkoutBtn);
    }, 1800);
  });
})();
