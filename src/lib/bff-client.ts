import { sessionFetch } from '@mairie360/front-kit/browser';
import axios, { type AxiosAdapter } from 'axios';
import { getBffDashboard } from '@mairie360/bff-dashboard-openapi/endpoints/bffDashboard';
import { getLoginFrontHref } from './navigation';

const navigatingLocations = new WeakSet<Location>();

function errorMessage(body: unknown, status: number): string {
  const payload = body as { error?: { message?: unknown }; message?: unknown } | null;
  for (const message of [payload?.error?.message, payload?.message]) {
    if (typeof message === 'string' && message.trim()) return message;
  }
  return status >= 500
    ? 'Le service est momentanément indisponible. Veuillez réessayer plus tard.'
    : 'La demande n’a pas pu aboutir. Veuillez réessayer.';
}

export async function requestBff<T>(path: string, init: RequestInit = {}): Promise<T> {
  init.signal?.throwIfAborted();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await sessionFetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  init.signal?.throwIfAborted();
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !navigatingLocations.has(window.location)) {
      const location = window.location;
      navigatingLocations.add(location);
      try {
        const loginHref = getLoginFrontHref();
        if (!loginHref) throw new Error('Login frontend URL is unavailable');
        const destination = new URL(loginHref);
        const current = new URL(location.href || '');
        destination.searchParams.set('redirect', current.href);
        location.replace(destination.href);
      } catch {
        navigatingLocations.delete(location);
        throw new Error('Connexion temporairement indisponible. Veuillez contacter votre administrateur.');
      }
    }
    const body = await response.json().catch(() => null);
    throw new Error(errorMessage(body, response.status));
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

// The generated operations of the published BFF Dashboard contract own every path: axios only carries the
// request through requestBff, which keeps the same-origin cookie, 401 redirect and error handling.
export function createDashboardClient(request: typeof requestBff = requestBff) {
  const contractAdapter: AxiosAdapter = async (config) => {
    const data = await request<unknown>(axios.getUri(config), {
      method: (config.method ?? 'get').toUpperCase(),
      headers: config.headers.toJSON() as Record<string, string>,
      body: typeof config.data === 'string' ? config.data : undefined,
      signal: (config.signal as AbortSignal | undefined) ?? undefined,
    });
    return {
      data,
      status: data === undefined ? 204 : 200,
      statusText: data === undefined ? 'No Content' : 'OK',
      headers: {},
      config,
    };
  };

  return getBffDashboard(axios.create({ adapter: contractAdapter, headers: { Accept: 'application/json' } }));
}

export const bffDashboard = createDashboardClient();
