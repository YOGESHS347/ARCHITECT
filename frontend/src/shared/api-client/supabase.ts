import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AuthProviderType = 'jwt' | 'supabase';

/**
 * Returns the currently active authentication provider ('jwt' or 'supabase').
 * Defaults to 'jwt'.
 */
export const getAuthProvider = (): AuthProviderType => {
  const provider = (import.meta.env.VITE_AUTH_PROVIDER || 'jwt').trim().toLowerCase();
  return provider === 'supabase' ? 'supabase' : 'jwt';
};

/**
 * Convenience helper to determine if Supabase Auth is enabled.
 */
export const isSupabaseAuth = (): boolean => {
  return getAuthProvider() === 'supabase';
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

/**
 * Checks whether required Supabase credentials are present.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey);
};

/**
 * Singleton Supabase client instance.
 * Created when URL and publishable key are configured; null otherwise.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ai_architect_sb_auth',
      },
    })
  : null;

/**
 * Retrieves the Supabase client or throws a descriptive configuration error
 * if credentials have not been configured.
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env'
    );
  }
  return supabase;
};

/**
 * Asynchronously retrieves the active Supabase session access token, if any.
 */
export const getActiveSupabaseToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
};
