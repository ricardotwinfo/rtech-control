import { supabaseAdmin } from './supabase.js';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
}

export async function getAuthUserFromAuthorizationHeader(authorization?: string | null): Promise<AuthUser> {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    throw new Error('Missing bearer token.');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user || !data.user.email) {
    throw new Error('Invalid or expired token.');
  }

  return {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
  };
}
