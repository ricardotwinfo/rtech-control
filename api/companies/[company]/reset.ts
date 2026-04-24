import { getBootstrapState, resetCompanyData } from '../../../server/services/expense-service.js';
import { ensureResponseHelpers, getQueryParam, handleApiError, requireAuth } from '../../../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    await requireAuth(req);

    if (req.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const company = getQueryParam(req.query?.company);
    if (!company) {
      response.status(400).json({ error: 'Missing company.' });
      return;
    }

    await resetCompanyData(company as any);
    const appState = await getBootstrapState();
    response.status(200).json({ appState });
  } catch (error) {
    handleApiError(response, error);
  }
}
