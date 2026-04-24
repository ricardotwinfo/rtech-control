const readRequiredClientEnv = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const clientEnv = {
  supabaseUrl: readRequiredClientEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readRequiredClientEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};
