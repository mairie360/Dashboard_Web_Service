import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ---------------------------------------------------------------------------
// k6 load test of the Dashboard front (Dashboard_Web_Service).
// Targets the routes the Next.js server really serves: the page (Next.js render), /health, then
// the /dashboard/bootstrap aggregation the page fetches, relayed by the same-origin proxy
// to BFF Dashboard (fan-out User / Project / Calendar). Authentication goes through the accessToken
// cookie, like in the browser: the proxy turns it into Authorization: Bearer for the BFF.
// Besides its reads, the pinned BFF Dashboard contract declares one idempotent write, PUT
// /dashboard/onboarding (the welcome tour is done), sent once per account by the page: there is no
// write scenario here (MAIR-516); the other fronts exercise their write routes.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
// Session of the user of init-test.sql (sub=2): an EdDSA JWT signed like Core by stack_secrets.sh with
// the run's key (MAIR-680). k6 cannot sign Ed25519, so the token is passed in.
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // montée en charge
    { duration: '1m', target: 20 },  // maintien
    { duration: '10s', target: 0 },  // descente
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],                          // < 1% d'erreurs
    checks: ['rate>0.99'],                                   // une redirection (307) n'est pas une erreur HTTP : les checks la détectent
    'http_req_duration{endpoint:page}': ['p(95)<800'],       // rendu page Next.js
    'http_req_duration{endpoint:health}': ['p(95)<150'],     // proxy same-origin -> BFF /health
    'http_req_duration{endpoint:dashboard}': ['p(95)<1200'], // proxy + agrégation BFF + upstream
  },
};

function sessionToken() {
  if (!ACCESS_TOKEN) throw new Error('ACCESS_TOKEN is not set: run ./performance_test.sh, which signs it.');
  return ACCESS_TOKEN;
}

export function setup() {
  return { token: sessionToken() };
}

export default function (data) {
  const cookie = { Cookie: `accessToken=${data.token}` };
  // redirects: 0 : une redirection (ex. vers le front Login si le cookie est refusé)
  // doit faire échouer le check au lieu d'être suivie hors de la stack.
  const pageParams = { headers: cookie, redirects: 0, tags: { endpoint: 'page' } };
  const dataParams = { headers: { ...cookie, Accept: 'application/json' }, redirects: 0, tags: { endpoint: 'dashboard' } };

  group('pages', () => {
    const home = http.get(`${BASE_URL}/`, pageParams);
    check(home, { 'page / 200': (r) => r.status === 200 });
  });

  group('health', () => {
    const res = http.get(`${BASE_URL}/health`, { headers: cookie, redirects: 0, tags: { endpoint: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('dashboard reads', () => {
    // Browser path of the page (src/lib/bff-client.ts calls the BFF path as is), not the root catch-all.
    const dashboardBootstrap = http.get(`${BASE_URL}/dashboard/bootstrap`, dataParams);
    check(dashboardBootstrap, { '/dashboard/bootstrap 200': (r) => r.status === 200 });
  });

  sleep(1);
}
