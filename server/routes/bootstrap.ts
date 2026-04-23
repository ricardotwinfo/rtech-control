import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getBootstrapState } from '../services/expense-service';

export const bootstrapRouter = Router();

bootstrapRouter.get('/', requireAuth, async (_req, res) => {
  const appState = await getBootstrapState();
  res.json({ appState });
});
