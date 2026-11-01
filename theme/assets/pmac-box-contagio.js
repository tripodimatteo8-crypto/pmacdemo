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

    // Stato narrativo + barra a segmenti (brief: CONTAMINATION IN PROGRESS, BOX LOADING...)
    const stateEl = document.getElementById('PmacBoxState');
    if (stateEl && !box.classList.contains('is-launching')) {
      let state = 'BOX EMPTY // AWAITING SPECIMENS';
      if (count > 0) state = ratio < 0.34 ? 'CONTAMINATION IN PROGRESS' : ratio < 0.67 ? 'BOX LOADING' : ratio < 1 ? 'PACKAGE PREPARING' : 'READY FOR LAUNCH';
      if (stateEl.textContent !== state) {
        stateEl.textContent = state;
        stateEl.classList.remove('is-new');
        void stateEl.offsetWidth;
        stateEl.classList.add('is-new');
      }
    }
    box.querySelectorAll('.pmac-box-contagio__seg').forEach((seg, i) => seg.classList.toggle('is-on', i < count));

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
      // parte dopo lo slide del drawer, così si vede davvero
      particle.style.animationDelay = `${420 + i * 110}ms`;
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

  /* ---------- Movimento drawer (vedi component-pmac-cart-motion.css) ---------- */
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ingresso a cascata solo quando il drawer si apre: la classe viene tolta
  // subito dopo, così gli update di quantità non ri-animano tutto.
  const drawer = document.querySelector('cart-drawer');
  let enteringTimer = null;
  let enteringSince = 0;
  if (drawer && 'MutationObserver' in window) {
    let wasActive = drawer.classList.contains('active');
    new MutationObserver(() => {
      const isActive = drawer.classList.contains('active');
      if (isActive && !wasActive && !reduceMotion()) {
        drawer.classList.add('pmac-entering');
        enteringSince = performance.now();
        clearTimeout(enteringTimer);
        enteringTimer = setTimeout(() => drawer.classList.remove('pmac-entering', 'pmac-settled'), 1300);
      }
      // NB: classList.remove riscrive l'attributo anche se la classe non c'è,
      // il che ri-scatenerebbe questo observer all'infinito: controlla prima.
      if (!isActive && drawer.classList.contains('pmac-entering')) drawer.classList.remove('pmac-entering', 'pmac-settled');
      wasActive = isActive;
    }).observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  const bumpCartIcon = () => {
    const icon = document.getElementById('cart-icon-bubble');
    if (!icon || reduceMotion()) return;
    icon.classList.remove('pmac-bump');
    void icon.offsetWidth; // riavvia l'animazione
    icon.classList.add('pmac-bump');
    setTimeout(() => icon.classList.remove('pmac-bump'), 700);
  };

  // Dawn ri-renderizza il drawer due volte dopo un'aggiunta (risposta di /cart/add
  // e poi refresh di cart-drawer-items): per ~2s ri-marchiamo la riga nuova a ogni
  // re-render, così l'evidenza sopravvive. Dawn ordina le righe dalla più recente.
  let justAdded = null;
  const applyJustAdded = () => {
    if (!justAdded || performance.now() > justAdded.until) return;
    const rows = document.querySelectorAll('#CartDrawer .cart-item');
    if (!rows.length) return;
    let row = rows[0];
    if (justAdded.variantId) {
      const input = document.querySelector(
        `#CartDrawer .cart-item input[data-quantity-variant-id="${justAdded.variantId}"]`
      );
      if (input) row = input.closest('.cart-item') || row;
    }
    if (!row.classList.contains('pmac-just-added')) row.classList.add('pmac-just-added');
  };

  if (drawer && 'MutationObserver' in window) {
    new MutationObserver((mutations) => {
      const replacedContent = mutations.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1));
      if (!replacedContent) return; // es. testo della macchina da scrivere
      // Dawn sostituisce il contenuto anche a drawer già aperto (secondo refresh):
      // gli elementi nuovi non devono rifare l'ingresso da zero, appaiono già fermi.
      if (
        drawer.classList.contains('pmac-entering') &&
        !drawer.classList.contains('pmac-settled') &&
        performance.now() - enteringSince > 120
      ) {
        drawer.classList.add('pmac-settled');
      }
      if (justAdded) applyJustAdded();
    }).observe(drawer, { childList: true, subtree: true });
  }

  const markJustAdded = (variantId) => {
    justAdded = { variantId, until: performance.now() + 2000 };
    setTimeout(() => { justAdded = null; }, 2100);
    requestAnimationFrame(() => requestAnimationFrame(applyJustAdded));
    bumpCartIcon();
  };

  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event?.source === 'product-form') markJustAdded(event.productVariantId);
      else bumpCartIcon();
    });
  }

  // Rimozione: l'articolo esce subito, il drawer si aggiorna quando risponde il server.
  document.addEventListener('click', (event) => {
    const remove = event.target.closest('cart-drawer cart-remove-button');
    if (!remove) return;
    remove.closest('.cart-item')?.classList.add('pmac-removing');
  });

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
    const stateEl = document.getElementById('PmacBoxState');
    if (stateEl) stateEl.textContent = 'BOX SEALED // PMAC DELIVERY IN PROGRESS';

    setTimeout(() => {
      checkoutBtn.form?.requestSubmit(checkoutBtn);
    }, 1800);
  });
})();
