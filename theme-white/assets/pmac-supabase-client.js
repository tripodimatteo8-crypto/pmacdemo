window.PMAC_SUPABASE_URL = 'https://qajseswjsmqzyqxixbal.supabase.co';
window.PMAC_SUPABASE_ANON_KEY = 'sb_publishable_r0RAtpR2FYcSZMjBr3pHRA_iXsbz9BE';

window.pmacGetSupabase = function () {
  if (window.__pmacSupabaseClient) return window.__pmacSupabaseClient;
  if (!window.supabase || !window.supabase.createClient) return null;
  window.__pmacSupabaseClient = window.supabase.createClient(
    window.PMAC_SUPABASE_URL,
    window.PMAC_SUPABASE_ANON_KEY
  );
  return window.__pmacSupabaseClient;
};
