const requiredServerEnv = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

type RequiredServerEnv = (typeof requiredServerEnv)[number];

const readEnv = (key: RequiredServerEnv) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const serverEnv = {
  databaseUrl: readEnv('DATABASE_URL'),
  directUrl: readEnv('DIRECT_URL'),
  supabaseUrl: readEnv('SUPABASE_URL'),
  supabaseAnonKey: readEnv('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
