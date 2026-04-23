import { createClient } from '@supabase/supabase-js';
import { clientEnv } from './env';

export const supabase = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);
