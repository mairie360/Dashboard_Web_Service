import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { isExpiredJwt, publicOrigin } from '@mairie360/lib-components/shared';
import { createDashboardClient, type requestBff } from './bff-client';
import { configuredBffUrl, forwardToBff } from './bff-proxy';
import { selectDashboardBootstrap } from './dashboard-bootstrap';

/** One no-store generated read through the existing contract-gated proxy. */
export async function loadInitialDashboard() {
  try {
    const origin = publicOrigin(process.env.DASHBOARD_FRONT_URL);
    const baseUrl = configuredBffUrl();
    if (!origin || !baseUrl) return null;
    const access = (await cookies()).get('accessToken')?.value;
    if (isExpiredJwt(access)) return null;
    const transport: typeof requestBff = async <T>(path: string, init: RequestInit = {}) => {
      const target = new URL(path, origin);
      if (target.origin !== origin || (init.method ?? 'GET') !== 'GET') throw new Error('Read unavailable');
      const request = new NextRequest(target, { method: 'GET', cache: 'no-store',
        headers: { Accept: 'application/json', Cookie: `accessToken=${access}` } });
      // A 401 is recovered by the existing browser transport on /api, where the
      // refresh cookie is actually available. Server rendering sets no cookies.
      const response = await forwardToBff(request, configuredBffUrl(), target.pathname);
      if (!response.ok) throw new Error('Read unavailable');
      return await response.json() as T;
    };
    const bffDashboard = createDashboardClient(transport);
    const { data } = await bffDashboard.getDashboardBootstrap();
    return selectDashboardBootstrap(data);
  } catch {
    return null;
  }
}
