import { syncUserProfile } from '../../server/services/expense-service.js';
import { ensureResponseHelpers, handleApiError, requireAuth } from '../../server/vercel-api.js';

export default async function handler(req: any, res: any) {
  const response = ensureResponseHelpers(res);

  try {
    const authUser = await requireAuth(req);
    const profile = await syncUserProfile(authUser);
    response.status(200).json({
      profile: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        isActive: profile.isActive,
      },
    });
  } catch (error) {
    handleApiError(response, error);
  }
}
