import cors from 'cors';
import express from 'express';
import { serverEnv } from './env';
import { authRouter } from './routes/auth';
import { bootstrapRouter } from './routes/bootstrap';
import { companiesRouter } from './routes/companies';
import { companyYearsRouter } from './routes/company-years';
import { expensesRouter } from './routes/expenses';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: serverEnv.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/bootstrap', bootstrapRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/companies', companiesRouter);
  app.use('/api/company-years', companyYearsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error.',
    });
  });

  return app;
}
