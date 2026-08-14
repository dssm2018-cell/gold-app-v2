export function getConfig(){
  return window.GOLD_APP_CONFIG || {};
}

let client = null;

export async function getSupabase(){
  if (client) return client;
  const cfg = getConfig();
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_URL.includes('YOUR-PROJECT')) return null;
  const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client = mod.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  return client;
}

export async function requireSession(){
  const sb = await getSupabase();
  if (!sb) return {supabase:null, session:null, demo:true};
  const {data:{session}} = await sb.auth.getSession();
  return {supabase:sb, session, demo:false};
}
