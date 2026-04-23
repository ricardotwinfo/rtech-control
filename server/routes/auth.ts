import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { syncUserProfile } from '../services/expense-service';

export const authRouter = Router();

authRouter.post('/sync-profile', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const profile = await syncUserProfile(authReq.authUser);
  res.json({
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      isActive: profile.isActive,
    },
  });
});
