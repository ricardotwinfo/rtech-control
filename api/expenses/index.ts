import { createExpense, getFilteredExpenses } from '../../server/services/expense-service.js';
import { ensureResponseHelpers, getQueryParam, handleApiError, readJsonBody, requireAuth } from '../../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    const authUser = await requireAuth(req);

    if (req.method === 'GET') {
      const expenses = await getFilteredExpenses({
        company: getQueryParam(req.query?.company),
        year: getQueryParam(req.query?.year),
        month: getQueryParam(req.query?.month),
        status: getQueryParam(req.query?.status),
        currency: getQueryParam(req.query?.currency),
        costCenter: getQueryParam(req.query?.costCenter),
        cardLast4: getQueryParam(req.query?.cardLast4),
        search: getQueryParam(req.query?.search),
      });

      response.status(200).json({ expenses });
      return;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const expense = await createExpense(body, authUser.id);
      response.status(201).json({ expense });
      return;
    }

    response.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    handleApiError(response, error);
  }
}
