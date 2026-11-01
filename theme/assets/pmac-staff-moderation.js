(function () {
  const loginBox = document.querySelector('[data-staff-login]');
  const panel = document.querySelector('[data-staff-panel]');
  if (!loginBox || !panel) return;

  const loginForm = document.querySelector('[data-staff-login-form]');
  const loginStatus = document.querySelector('[data-staff-login-status]');
  const userLabel = document.querySelector('[data-staff-user]');
  const logoutBtn = document.querySelector('[data-staff-logout]');
  const list = document.querySelector('[data-staff-list]');
  const listStatus = document.querySelector('[data-staff-list-status]');

  const SUPABASE_IMG_BASE =
    (window.PMAC_SUPABASE_URL || '') + '/storage/v1/object/public/sightings/';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function waitForClient(retries) {
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

  async function renderPending(client) {
    listStatus.textContent = 'Caricamento…';
    list.innerHTML = '';

    const { data, error } = await client
      .from('sightings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      listStatus.textContent = 'Errore: ' + error.message;
      return;
    }

    if (!data.length) {
      listStatus.textContent = 'Nessun avvistamento in attesa.';
      return;
    }

    listStatus.textContent = data.length + ' in attesa di moderazione';

    data.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'pmac-staff__item';
      item.innerHTML = `
        <img class="pmac-staff__item-photo" src="${SUPABASE_IMG_BASE}${encodeURI(row.image_path)}" alt="" loading="lazy">
        <div class="pmac-staff__item-body">
          <p class="pmac-mono">${escapeHtml(row.kind)} — ${escapeHtml(row.city)}</p>
          ${row.note ? `<p>${escapeHtml(row.note)}</p>` : ''}
          <p class="pmac-staff__item-meta">${escapeHtml(row.created_at)}${row.lat ? ' — geo ✓' : ''}</p>
          <div class="pmac-staff__item-actions">
            <button type="button" class="button" data-action="approve">Approva</button>
            <button type="button" class="button button--secondary" data-action="reject">Rifiuta</button>
          </div>
        </div>
      `;

      item.querySelector('[data-action="approve"]').addEventListener('click', async () => {
        await client.from('sightings').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', row.id);
        renderPending(client);
      });
      item.querySelector('[data-action="reject"]').addEventListener('click', async () => {
        await client.from('sightings').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', row.id);
        renderPending(client);
      });

      list.appendChild(item);
    });
  }

  async function showSession(client, session) {
    loginBox.hidden = true;
    panel.hidden = false;
    userLabel.textContent = session.user.email;
    renderPending(client);
  }

  (async function init() {
    const client = await waitForClient(25).catch(() => null);
    if (!client) {
      loginStatus.textContent = 'Errore di connessione.';
      return;
    }

    const { data } = await client.auth.getSession();
    if (data?.session) {
      showSession(client, data.session);
    }

    client.auth.onAuthStateChange((_event, session) => {
      if (session) showSession(client, session);
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = new FormData(loginForm).get('email');
      loginStatus.textContent = 'Invio link…';
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      });
      loginStatus.textContent = error ? 'Errore: ' + error.message : 'Controlla la tua email per il link di accesso.';
    });

    logoutBtn?.addEventListener('click', async () => {
      await client.auth.signOut();
      panel.hidden = true;
      loginBox.hidden = false;
    });
  })();
})();
