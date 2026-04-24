import { ensureResponseHelpers } from '../server/vercel-api';

export default async function handler(_req: any, res: any) {
  const response = ensureResponseHelpers(res);
  response.status(200).json({ ok: true });
}
