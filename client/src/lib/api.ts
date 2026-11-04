export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * All requests go through the Next.js /api proxy, so the session cookie is
 * first-party and no CORS or credentials flags are needed in the browser.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`/api${path}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { error?: string; message?: string; code?: string };
    throw new ApiError(
      data.error ?? data.message ?? `Request failed (${response.status})`,
      response.status,
      data.code,
    );
  }

  return payload as T;
}

export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });
export const get = <T>(path: string) => api<T>(path);
