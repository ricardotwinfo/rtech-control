const readClientEnv = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_API_BASE_URL') => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const clientEnv = {
  supabaseUrl: readClientEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readClientEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: readClientEnv('VITE_API_BASE_URL'),
};
