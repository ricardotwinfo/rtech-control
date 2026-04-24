import { ensureResponseHelpers } from '../server/vercel-api';

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default async function handler(_req: any, res: any) {
  const response = ensureResponseHelpers(res);

  const diagnostics: Record<string, unknown> = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DIRECT_URL: Boolean(process.env.DIRECT_URL),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    },
  };

  try {
    await import('../server/env');
    diagnostics.serverEnvImport = 'ok';
  } catch (error) {
    diagnostics.serverEnvImport = `error: ${toMessage(error)}`;
  }

  try {
    await import('../server/prisma');
    diagnostics.prismaImport = 'ok';
  } catch (error) {
    diagnostics.prismaImport = `error: ${toMessage(error)}`;
  }

  try {
    const { getBootstrapState } = await import('../server/services/expense-service');
    diagnostics.expenseServiceImport = 'ok';

    try {
      const appState = await getBootstrapState();
      diagnostics.bootstrapQuery = {
        ok: true,
        companies: Object.keys(appState),
      };
    } catch (error) {
      diagnostics.bootstrapQuery = `error: ${toMessage(error)}`;
    }
  } catch (error) {
    diagnostics.expenseServiceImport = `error: ${toMessage(error)}`;
  }

  response.status(200).json(diagnostics);
}
