import type { NextFunction, Request, Response } from 'express';
import { getAuthUserFromAuthorizationHeader, type AuthUser } from '../auth-service';

export interface AuthenticatedRequest extends Request {
  authUser: AuthUser;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = await getAuthUserFromAuthorizationHeader(req.headers.authorization ?? null);
    (req as AuthenticatedRequest).authUser = authUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
