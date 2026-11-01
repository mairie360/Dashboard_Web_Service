import { NextRequest } from 'next/server';
import { proxyPublishedBffRequest } from '@mairie360/lib-components/next';
import contract from '../../contracts/openapi.json';

type RouteContext = { params: Promise<{ path: string[] }> };

export function configuredBffUrl() {
  const value = (process.env.DASHBOARD_BFF_URL ?? process.env.BFF_DASHBOARD_BASE_URL)?.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    return value.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export async function forwardToBff(request: NextRequest, baseUrl: string, path: string | string[]) {
  // Browser authorization never substitutes for the server's HttpOnly cookie.
  request.headers.delete('authorization');
  return proxyPublishedBffRequest(request, typeof path === 'string' ? path.slice(1).split('/') : path, {
    baseUrl: () => baseUrl,
    paths: contract.paths,
    loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',
    frontUrl: () => process.env.DASHBOARD_FRONT_URL?.trim() ?? '',
  });
}

export async function proxyBffRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardToBff(request, configuredBffUrl(), path);
}
