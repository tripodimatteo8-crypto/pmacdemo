(function () {
  const form = document.querySelector('[data-sighting-form]');
  if (!form) return;

  const statusEl = form.querySelector('[data-sighting-status]');
  const submitBtn = form.querySelector('[data-sighting-submit]');
  const geoBtn = form.querySelector('[data-sighting-geo]');
  const geoStatus = form.querySelector('[data-sighting-geo-status]');
  const latInput = form.querySelector('[data-sighting-lat]');
  const lngInput = form.querySelector('[data-sighting-lng]');

  geoBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      geoStatus.textContent = 'Geolocalizzazione non disponibile';
      return;
    }
    geoStatus.textContent = 'Rilevamento…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latInput.value = pos.coords.latitude;
        lngInput.value = pos.coords.longitude;
        geoStatus.textContent = 'Posizione acquisita';
      },
      () => {
        geoStatus.textContent = 'Posizione non disponibile';
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  });

  function waitForSupabase(retries) {
    return new Promise((resolve, reject) => {
      const tryGet = (n) => {
        const client = window.pmacGetSupabase && window.pmacGetSupabase();
        if (client) return resolve(client);
        if (n <= 0) return reject(new Error('Supabase non disponibile'));
        setTimeout(() => tryGet(n - 1), 200);
      };
      tryGet(retries);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso…';

    try {
      const client = await waitForSupabase(25);
      const formData = new FormData(form);
      const photo = formData.get('photo');
      const city = (formData.get('city') || '').toString().trim();
      const kind = formData.get('kind') || 'user_photo';
      const note = (formData.get('note') || '').toString().trim();
      const lat = latInput.value ? parseFloat(latInput.value) : null;
      const lng = lngInput.value ? parseFloat(lngInput.value) : null;

      if (!photo || !(photo instanceof File) || photo.size === 0) {
        throw new Error('Carica una foto');
      }
      if (!city) {
        throw new Error('Inserisci la città');
      }

      const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

      const { error: uploadError } = await client.storage.from('sightings').upload(path, photo, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await client.from('sightings').insert({
        kind,
        city,
        note: note || null,
        lat,
        lng,
        image_path: path,
      });
      if (insertError) throw insertError;

      form.reset();
      statusEl.textContent = 'Avvistamento inviato! Comparirà sulla mappa dopo l\'approvazione.';
      submitBtn.textContent = 'Invia avvistamento';
      submitBtn.disabled = false;
    } catch (err) {
      statusEl.textContent = 'Errore: ' + (err && err.message ? err.message : 'invio non riuscito, riprova.');
      submitBtn.textContent = 'Invia avvistamento';
      submitBtn.disabled = false;
    }
  });
})();
