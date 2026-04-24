import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthUser } from './auth-service.js';

export type VercelLikeRequest = IncomingMessage & {
  body?: any;
  query?: Record<string, string | string[] | undefined>;
  headers: IncomingMessage['headers'];
};

export type VercelLikeResponse = ServerResponse & {
  status: (code: number) => VercelLikeResponse;
  json: (body: unknown) => void;
  send: (body?: unknown) => void;
};

export function ensureResponseHelpers(res: ServerResponse): VercelLikeResponse {
  const response = res as VercelLikeResponse;

  response.status = (code: number) => {
    response.statusCode = code;
    return response;
  };

  response.json = (body: unknown) => {
    if (!response.headersSent) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    response.end(JSON.stringify(body));
  };

  response.send = (body?: unknown) => {
    if (body === undefined) {
      response.end();
      return;
    }

    if (typeof body === 'object') {
      response.json(body);
      return;
    }

    response.end(String(body));
  };

  return response;
}

export async function readJsonBody<T = any>(req: VercelLikeRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

export function getQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function requireAuth(req: VercelLikeRequest): Promise<AuthUser> {
  const { getAuthUserFromAuthorizationHeader } = await import('./auth-service.js');
  return getAuthUserFromAuthorizationHeader(req.headers.authorization ?? null);
}

export function handleApiError(res: VercelLikeResponse, error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Internal server error.';
  const status = message === 'Missing bearer token.' || message === 'Invalid or expired token.' ? 401 : 500;
  res.status(status).json({ error: message });
}
