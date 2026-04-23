import { Router } from 'express';
import type { Company } from '../../src/lib/finance-service';
import { requireAuth } from '../middleware/auth';
import { cleanupDuplicates, getBootstrapState, resetCompanyData } from '../services/expense-service';

export const companiesRouter = Router();

companiesRouter.use(requireAuth);

companiesRouter.post('/:company/reset', async (req, res) => {
  await resetCompanyData(req.params.company as Company);
  const appState = await getBootstrapState();
  res.json({ appState });
});

companiesRouter.post('/:company/cleanup-duplicates', async (req, res) => {
  const removed = await cleanupDuplicates(req.params.company as Company);
  const appState = await getBootstrapState();
  res.json({ removed, appState });
});
