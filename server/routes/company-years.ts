import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { addCompanyYear, getBootstrapState } from '../services/expense-service';

export const companyYearsRouter = Router();

companyYearsRouter.use(requireAuth);

companyYearsRouter.post('/', async (req, res) => {
  await addCompanyYear(req.body.company, req.body.year);
  const appState = await getBootstrapState();
  res.status(201).json({ appState });
});
