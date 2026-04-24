import { getBootstrapState } from '../server/services/expense-service.js';
import { ensureResponseHelpers, handleApiError, requireAuth } from '../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    await requireAuth(req);
    const appState = await getBootstrapState();
    response.status(200).json({ appState });
  } catch (error) {
    handleApiError(response, error);
  }
}
