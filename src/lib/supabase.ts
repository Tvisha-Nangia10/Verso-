import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// New-style publishable key (sb_publishable_…), falling back to the legacy
// anon key so existing projects keep working.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn(
    '[TH-INK] Supabase is not configured. Copy .env.example to .env and fill in\n' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server.',
  );
}

export const supabase = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
