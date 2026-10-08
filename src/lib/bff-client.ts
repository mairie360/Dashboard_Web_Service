import { logoutAndRedirect } from './logout';

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
  const response = await fetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  init.signal?.throwIfAborted();
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !navigatingLocations.has(window.location)) {
      const location = window.location;
      navigatingLocations.add(location);
      try {
        // Login owns shared-cookie expiry. Do not replay the failed read or
        // add a Dashboard logout endpoint/second BFF client.
        await logoutAndRedirect();
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
