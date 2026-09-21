(function () {
  const config = window.PENOMBRA_CONFIG;

  if (!config?.SUPABASE_URL || !config?.SUPABASE_PUBLISHABLE_KEY) {
    console.error('Configurazione Supabase mancante.');
    return;
  }

  const script = document.createElement('script');

  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  script.onload = function () {
    window.supabaseClient = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    window.dispatchEvent(
      new CustomEvent('penombra:supabase-ready')
    );
  };

  document.head.appendChild(script);
})();
