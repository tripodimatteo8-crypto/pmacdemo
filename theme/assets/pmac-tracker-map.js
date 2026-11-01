(function () {
  const DEFAULT_CENTER = [47, 9];
  const DEFAULT_ZOOM = 4;
  const MIN_ZOOM = 3;
  const MAX_ZOOM = 10;

  function parseCoordinates(str) {
    if (!str) return null;
    const match = str.match(
      /(\d+(?:\.\d+)?)\s*°?\s*([NS])\s*,\s*(\d+(?:\.\d+)?)\s*°?\s*([EW])/i
    );
    if (!match) return null;
    const lat = parseFloat(match[1]) * (match[2].toUpperCase() === 'S' ? -1 : 1);
    const lng = parseFloat(match[3]) * (match[4].toUpperCase() === 'W' ? -1 : 1);
    return [lat, lng];
  }

  function statusLabel(status, isTaken) {
    if (isTaken) return 'TAKEN';
    switch (status) {
      case 'located':
        return 'LOCATED';
      case 'active':
        return 'ACTIVE';
      case 'signal_lost':
        return 'SIGNAL LOST';
      default:
        return 'SIGNAL DETECTED';
    }
  }

  function pinIconHtml(status, isTaken, number, extraClass) {
    const classes = ['pmac-tracker-pin'];
    if (isTaken) classes.push('is-taken');
    if (extraClass) classes.push(extraClass);
    return (
      `<div class="${classes.join(' ')}" data-status="${status || ''}">` +
      '<span class="pmac-tracker-pin__ring" aria-hidden="true"></span>' +
      '<span class="pmac-tracker-pin__dot" aria-hidden="true"></span>' +
      `<span class="pmac-tracker-pin__number pmac-mono" aria-hidden="true">${number || ''}</span>` +
      '</div>'
    );
  }

  // target ("pin-N") -> [lat, lng], per centrare la mappa dal click su una tile
  const pinLatLngs = {};

  if (!customElements.get('pmac-tracker-map')) {
    class PmacTrackerMap extends HTMLElement {
      connectedCallback() {
        this.viewport = this.querySelector('[data-tracker-viewport]');
        const dataEl = this.querySelector('[data-tracker-pins]');
        if (!this.viewport || !dataEl || !window.L) return;

        let pins = [];
        try {
          pins = JSON.parse(dataEl.textContent);
        } catch (e) {
          pins = [];
        }

        this.map = L.map(this.viewport, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          zoomControl: false,
          worldCopyJump: true,
          scrollWheelZoom: false,
        });

        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
            maxZoom: 16,
            className: 'pmac-tracker-tiles',
          }
        ).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);

        pins.forEach((pin, index) => {
          const latlng = parseCoordinates(pin.coordinates);
          if (!latlng) return;
          const icon = L.divIcon({
            className: 'pmac-tracker-pin-icon',
            html: pinIconHtml(pin.status, pin.isTaken, pin.number),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const marker = L.marker(latlng, {
            icon,
            keyboard: false,
            alt: pin.city,
          }).addTo(this.markersLayer);
          marker.on('click', () => openCard(pin.target));
          pinLatLngs[pin.target] = latlng;

          if (pin.city) {
            marker.bindTooltip(pin.city.toUpperCase(), {
              permanent: true,
              direction: 'top',
              offset: [0, -10],
              className: 'pmac-tracker-label',
            });
          }
          marker.getElement()?.style.setProperty('--pmac-pin-delay', `${index * 70}ms`);
        });

        this.querySelector('[data-tracker-zoom-in]')?.addEventListener('click', () => this.map.zoomIn());
        this.querySelector('[data-tracker-zoom-out]')?.addEventListener('click', () => this.map.zoomOut());
        this.querySelector('[data-tracker-zoom-reset]')?.addEventListener('click', () => {
          this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        });

        this.leafletMap = this.map;
        this.L = L;

        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  this.classList.add('is-in-view');
                  this.map.invalidateSize();
                  observer.disconnect();
                }
              });
            },
            { threshold: 0.2 }
          );
          observer.observe(this);
        } else {
          this.classList.add('is-in-view');
        }

        window.addEventListener('resize', () => this.map.invalidateSize());
      }
    }
    customElements.define('pmac-tracker-map', PmacTrackerMap);
  }

  const section = document.querySelector('.pmac-tracker-map-section');
  const card = section?.querySelector('[data-tracker-card]');
  const cardContent = section?.querySelector('[data-tracker-card-content]');

  function openCard(target) {
    if (!card || !cardContent) return;
    const template = section.querySelector(`[data-tracker-template="${target}"]`);
    if (!template) return;
    cardContent.innerHTML = '';
    cardContent.appendChild(template.content.cloneNode(true));
    card.setAttribute('data-open', '');
    card.removeAttribute('aria-hidden');
  }

  function closeCard() {
    if (!card) return;
    card.removeAttribute('data-open');
    card.setAttribute('aria-hidden', 'true');
  }

  window.pmacOpenTrackerCard = openCard;

  // Tile della griglia: apre la card e porta la mappa sul pin corrispondente.
  section?.querySelectorAll('[data-tracker-open]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const target = tile.dataset.trackerOpen;
      openCard(target);
      const mapEl = section.querySelector('pmac-tracker-map');
      const latlng = pinLatLngs[target];
      if (mapEl?.leafletMap && latlng) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        mapEl.leafletMap.flyTo(latlng, 6, { animate: !reduce, duration: 1.2 });
      }
    });
  });

  section?.querySelectorAll('[data-tracker-card-close]').forEach((btn) => {
    btn.addEventListener('click', closeCard);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCard();
  });
})();
