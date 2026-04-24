import { payExpense } from '../../../server/services/expense-service.js';
import { ensureResponseHelpers, getQueryParam, handleApiError, readJsonBody, requireAuth } from '../../../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    const authUser = await requireAuth(req);

    if (req.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const id = getQueryParam(req.query?.id);
    if (!id) {
      response.status(400).json({ error: 'Missing expense id.' });
      return;
    }

    const body = await readJsonBody<{
      paymentDate: string;
      value?: number;
      exchangeRate?: number;
      notes?: string;
      existingNotes?: string;
    }>(req);

    const expense = await payExpense(id, body.paymentDate, body.value, body.exchangeRate, body.notes, authUser.id, body.existingNotes);
    response.status(200).json({ expense });
  } catch (error) {
    handleApiError(response, error);
  }
}
