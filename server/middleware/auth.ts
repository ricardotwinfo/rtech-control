import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
}

export interface AuthenticatedRequest extends Request {
  authUser: AuthUser;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user || !data.user.email) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  (req as AuthenticatedRequest).authUser = {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
  };

  next();
};
