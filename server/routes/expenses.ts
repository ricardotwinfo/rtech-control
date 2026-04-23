import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import {
  createExpense,
  deleteExpense,
  generateRecurringExpenses,
  getBootstrapState,
  getFilteredExpenses,
  payExpense,
  updateExpense,
} from '../services/expense-service';

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get('/', async (req, res) => {
  const expenses = await getFilteredExpenses({
    company: typeof req.query.company === 'string' ? req.query.company : undefined,
    year: typeof req.query.year === 'string' ? req.query.year : undefined,
    month: typeof req.query.month === 'string' ? req.query.month : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    currency: typeof req.query.currency === 'string' ? req.query.currency : undefined,
    costCenter: typeof req.query.costCenter === 'string' ? req.query.costCenter : undefined,
    cardLast4: typeof req.query.cardLast4 === 'string' ? req.query.cardLast4 : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  });

  res.json({ expenses });
});

expensesRouter.post('/', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const expense = await createExpense(req.body, authReq.authUser.id);
  res.status(201).json({ expense });
});

expensesRouter.put('/:id', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const expense = await updateExpense(req.params.id, req.body, authReq.authUser.id);
  res.json({ expense });
});

expensesRouter.delete('/:id', async (req, res) => {
  await deleteExpense(req.params.id);
  res.status(204).send();
});

expensesRouter.post('/:id/pay', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const expense = await payExpense(
    req.params.id,
    req.body.paymentDate,
    req.body.value,
    req.body.exchangeRate,
    req.body.notes,
    authReq.authUser.id,
  );

  res.json({ expense });
});

expensesRouter.post('/recurring/generate', async (req, res) => {
  const generated = await generateRecurringExpenses(req.body.company, req.body.targetMonth, req.body.targetYear);
  const appState = await getBootstrapState();
  res.json({ generated, appState });
});
