/* PMAC — Sightings log: filtri (tutti / statuette / community) e avvistamenti
   community approvati da Supabase aggiunti in coda al database. */
(() => {
  const root = document.querySelector('[data-pmac-slog]');
  if (!root) return;
  const grid = root.querySelector('[data-pmac-slog-grid]');

  const esc = (s) => {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  };

  const updateCounts = () => {
    const items = [...grid.children];
    const count = (k) => (k === 'all' ? items.length : items.filter((i) => i.dataset.kind === k).length);
    root.querySelectorAll('[data-count]').forEach((el) => {
      el.textContent = String(count(el.dataset.count)).padStart(2, '0');
    });
  };

  root.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('is-active', b === btn));
      const f = btn.dataset.filter;
      [...grid.children].forEach((item, i) => {
        const show = f === 'all' || item.dataset.kind === f;
        item.hidden = !show;
        if (show) {
          item.style.animation = 'none';
          void item.offsetWidth;
          item.style.animation = '';
          item.style.setProperty('--i', i % 6);
        }
      });
    });
  });

  updateCounts();

  if (root.dataset.community !== 'true') return;

  const loadCommunity = async (attempt = 0) => {
    const client = window.pmacGetSupabase && window.pmacGetSupabase();
    if (!client) {
      if (attempt < 25) setTimeout(() => loadCommunity(attempt + 1), 300);
      return;
    }
    const { data, error } = await client
      .from('sightings')
      .select('id, kind, city, note, lat, lng, image_path, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error || !data || !data.length) return;

    const base = (window.PMAC_SUPABASE_URL || '') + '/storage/v1/object/public/sightings/';
    data.forEach((s, n) => {
      const li = document.createElement('li');
      li.className = 'pmac-slog__item';
      li.dataset.kind = 'community';
      li.style.setProperty('--i', n % 6);
      const when = s.created_at ? new Date(s.created_at).toISOString().slice(0, 19).replace('T', ' ') : '';
      const coords =
        s.lat != null && s.lng != null
          ? `${Math.abs(s.lat).toFixed(4)}° ${s.lat >= 0 ? 'N' : 'S'}, ${Math.abs(s.lng).toFixed(4)}° ${s.lng >= 0 ? 'E' : 'W'}`
          : '';
      const code = `PMAC-C-${String(s.id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      li.innerHTML = `
        <article class="pmac-slog__card">
          <div class="pmac-slog__media">
            ${s.image_path ? `<img src="${base}${encodeURI(s.image_path)}" alt="" loading="lazy">` : ''}
            <span class="pmac-slog__osd pmac-mono"><span><span class="pmac-slog__rec"></span>REC</span><span>COMMUNITY</span></span>
            <span class="pmac-slog__stamp pmac-mono">${esc(when)}</span>
            <span class="pmac-slog__scan"></span>
          </div>
          <div class="pmac-slog__body">
            <div class="pmac-slog__row pmac-mono"><span class="pmac-slog__code">${esc(code)}</span>
              <span class="pmac-slog__status" data-status="spotted">${s.kind === 'community_outfit' ? 'PMAC SPOTTED' : 'COMMUNITY SIGNAL'}</span></div>
            <h2 class="pmac-slog__city">${esc(s.city || 'Unknown')}</h2>
            <p class="pmac-slog__coords pmac-mono">${esc(coords)}</p>
            ${s.note ? `<p class="pmac-slog__desc">${esc(s.note)}</p>` : ''}
          </div>
        </article>`;
      grid.appendChild(li);
    });
    updateCounts();
  };
  loadCommunity();
})();
