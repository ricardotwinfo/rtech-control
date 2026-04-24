import { createClient } from '@supabase/supabase-js';
import { serverEnv } from './env.js';

export const supabaseAdmin = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
