/**
 * API client for ChangePath Enterprise backend.
 *
 * In development, requests are proxied by Vite to localhost:3001.
 * Session auth is local-storage backed in the web app and bearer-token backed
 * at the API. The API still supports `x-user-id` as a legacy test/dev escape
 * hatch, but the UI now goes through the login/session flow.
 */

const SESSION_STORAGE_KEY = 'changepath-session';

export interface StoredSession {
  token: string;
  expiresAt: string;
}

export function getStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasStoredSession(): boolean {
  return getStoredSession() !== null;
}

export function storeSession(session: { token: string; expiresAt: Date | string }) {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token: session.token,
      expiresAt:
        session.expiresAt instanceof Date ? session.expiresAt.toISOString() : new Date(session.expiresAt).toISOString(),
    } satisfies StoredSession),
  );
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function shouldRefreshSession(session: StoredSession): boolean {
  return new Date(session.expiresAt).getTime() - Date.now() <= 2 * 60 * 1000;
}

async function refreshStoredSession(session: StoredSession): Promise<StoredSession | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const body = (await response.json()) as {
    session: { token: string; expiresAt: string };
  };

  const refreshed: StoredSession = {
    token: body.session.token,
    expiresAt: new Date(body.session.expiresAt).toISOString(),
  };
  storeSession(refreshed);
  return refreshed;
}

async function getHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const existingSession = getStoredSession();
  if (!existingSession) {
    return headers;
  }

  const activeSession = shouldRefreshSession(existingSession)
    ? ((await refreshStoredSession(existingSession)) ?? existingSession)
    : existingSession;

  headers.Authorization = `Bearer ${activeSession.token}`;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    const err = new Error(body.error ?? `HTTP ${response.status}`) as Error & {
      status?: number;
      conflict?: { code: string; serverUpdatedAt: string };
    };
    err.status = response.status;
    if (response.status === 401) {
      clearStoredSession();
    }
    if (response.status === 409 && body.code === 'ASSESSMENT_CONFLICT') {
      err.conflict = { code: body.code, serverUpdatedAt: body.serverUpdatedAt };
    }
    throw err;
  }
  return response.json() as Promise<T>;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(path, { headers: await getHeaders() });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },
};
