import { addCompanyYear, getBootstrapState } from '../server/services/expense-service.js';
import { ensureResponseHelpers, handleApiError, readJsonBody, requireAuth } from '../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    await requireAuth(req);

    if (req.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const body = await readJsonBody<{ company: string; year: string }>(req);
    await addCompanyYear(body.company as any, body.year);
    const appState = await getBootstrapState();
    response.status(201).json({ appState });
  } catch (error) {
    handleApiError(response, error);
  }
}
