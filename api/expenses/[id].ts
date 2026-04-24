import { deleteExpense, updateExpense } from '../../server/services/expense-service';
import { ensureResponseHelpers, getQueryParam, handleApiError, readJsonBody, requireAuth } from '../../server/vercel-api';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    const authUser = await requireAuth(req);
    const id = getQueryParam(req.query?.id);

    if (!id) {
      response.status(400).json({ error: 'Missing expense id.' });
      return;
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const expense = await updateExpense(id, body, authUser.id);
      response.status(200).json({ expense });
      return;
    }

    if (req.method === 'DELETE') {
      await deleteExpense(id);
      response.status(204).send();
      return;
    }

    response.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    handleApiError(response, error);
  }
}
