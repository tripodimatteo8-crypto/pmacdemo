(function () {
  const section = document.querySelector('.pmac-tracker-map-section');
  const trackerEl = section?.querySelector('pmac-tracker-map');
  const card = section?.querySelector('[data-tracker-card]');
  const cardContent = section?.querySelector('[data-tracker-card-content]');
  if (!section || !trackerEl || !card || !cardContent) return;

  const SUPABASE_IMG_BASE =
    (window.PMAC_SUPABASE_URL || '') + '/storage/v1/object/public/sightings/';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function openCommunityCard(sighting) {
    cardContent.innerHTML = `
      <div class="pmac-tracker-card__media">
        <img src="${SUPABASE_IMG_BASE}${encodeURI(sighting.image_path)}" alt="" loading="lazy">
      </div>
      <div class="pmac-tracker-card__body">
        <p class="pmac-system-label pmac-system-label--static">SIGHTING — ${escapeHtml(sighting.city)}</p>
        <span class="pmac-tracker-card__status pmac-mono">
          ${sighting.kind === 'community_outfit' ? 'PMAC SPOTTED' : 'COMMUNITY SIGNAL'}
        </span>
        ${sighting.note ? `<p class="pmac-tracker-card__clue">${escapeHtml(sighting.note)}</p>` : ''}
      </div>
    `;
    card.setAttribute('data-open', '');
    card.removeAttribute('aria-hidden');
  }

  function waitForMap(callback, attempts) {
    attempts = attempts || 0;
    if (trackerEl.leafletMap && trackerEl.L) {
      callback(trackerEl.leafletMap, trackerEl.L);
      return;
    }
    if (attempts > 50) return;
    setTimeout(() => waitForMap(callback, attempts + 1), 200);
  }

  async function loadCommunitySightings(map, L) {
    const client = window.pmacGetSupabase && window.pmacGetSupabase();
    if (!client) {
      setTimeout(() => loadCommunitySightings(map, L), 300);
      return;
    }

    const { data, error } = await client
      .from('sightings')
      .select('id, kind, city, note, lat, lng, image_path')
      .eq('status', 'approved')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(200);

    if (error || !data) return;

    data.forEach((sighting) => {
      const icon = L.divIcon({
        className: 'pmac-tracker-pin-icon',
        html:
          '<div class="pmac-tracker-pin pmac-tracker-pin--community">' +
          '<span class="pmac-tracker-pin__ring" aria-hidden="true"></span>' +
          '<span class="pmac-tracker-pin__dot" aria-hidden="true"></span>' +
          '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([sighting.lat, sighting.lng], {
        icon,
        keyboard: false,
        alt: sighting.city || 'Avvistamento community',
      }).addTo(map);
      marker.on('click', () => openCommunityCard(sighting));
    });
  }

  let attempts = 0;
  const waitForSupabaseLib = setInterval(() => {
    attempts += 1;
    if (window.supabase || attempts > 25) {
      clearInterval(waitForSupabaseLib);
      waitForMap(loadCommunitySightings);
    }
  }, 200);
})();
