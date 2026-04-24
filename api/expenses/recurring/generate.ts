import { generateRecurringExpenses, getBootstrapState } from '../../../server/services/expense-service';
import { ensureResponseHelpers, handleApiError, readJsonBody, requireAuth } from '../../../server/vercel-api';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    await requireAuth(req);

    if (req.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const body = await readJsonBody<{ company: string; targetMonth: string; targetYear: string }>(req);
    const generated = await generateRecurringExpenses(body.company as any, body.targetMonth, body.targetYear);
    const appState = await getBootstrapState();
    response.status(200).json({ generated, appState });
  } catch (error) {
    handleApiError(response, error);
  }
}
