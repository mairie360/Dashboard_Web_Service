const fs = require('node:fs');
const path = require('node:path');
const { SRC } = require('./load-ts.cjs');
const { NextRequest } = require('next/server');

// Front exécuté en mémoire, sans `next start` : les appels same-origin du navigateur sont routés vers les
// route handlers de src/app comme le ferait l'App Router (segments statiques avant le catch-all), et tout
// appel réseau sortant est journalisé. Seules les origines des mocks déclarés sont joignables : un appel
// vers une autre origine échoue et est relevé dans `violations`.

const APP = path.join(SRC, 'app');
const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

function listRoutes(dir = APP, segments = []) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return listRoutes(path.join(dir, entry.name), [...segments, entry.name]);
    return entry.name === 'route.ts' ? [{ file: path.join(dir, entry.name), segments }] : [];
  });
}

const ROUTES = listRoutes();

/** Route handler correspondant à un chemin concret, avec les `params` que Next.js lui passerait. */
function matchRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const exact = ROUTES.find(({ segments }) => segments.length === parts.length && segments.every((segment, i) => segment === parts[i]));
  if (exact) return { ...exact, params: {} };
  const catchAll = ROUTES.find(({ segments }) => {
    const last = segments.at(-1) ?? '';
    return /^\[\.\.\.\w+\]$/.test(last) && parts.length >= segments.length
      && segments.slice(0, -1).every((segment, i) => segment === parts[i]);
  });
  if (!catchAll) return undefined;
  const name = catchAll.segments.at(-1).slice(4, -1);
  return { ...catchAll, params: { [name]: parts.slice(catchAll.segments.length - 1) } };
}

async function dispatch(request) {
  const route = matchRoute(request.nextUrl.pathname);
  if (!route) return new Response('Not Found', { status: 404 });
  const handler = require(route.file)[request.method];
  if (typeof handler !== 'function') {
    return new Response(null, { status: 405, headers: { Allow: HTTP_METHODS.filter((method) => typeof require(route.file)[method] === 'function').join(', ') } });
  }
  return handler(request, { params: Promise.resolve(route.params) });
}

class FrontApp {
  constructor({ origin = 'http://dashboard.front.test' } = {}) {
    this.origin = origin;
    this.cookies = {};
    /** Appels réseau observés : `browser` (same-origin) ou `server` (sortants du serveur Next.js). */
    this.calls = [];
    this.violations = [];
    this.allowedOrigins = new Set();
    this.realFetch = undefined;
  }

  allow(url) { this.allowedOrigins.add(new URL(url).origin); return this; }

  install() {
    this.realFetch = global.fetch;
    const realFetch = this.realFetch;
    global.fetch = async (input, init = {}) => {
      const url = new URL(input instanceof Request ? input.url : String(input), this.origin);
      const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (url.origin === this.origin) {
        this.calls.push({ side: 'browser', method, url });
        const headers = new Headers(init.headers);
        const cookie = Object.entries(this.cookies).map(([name, value]) => `${name}=${value}`).join('; ');
        if (cookie && init.credentials !== 'omit') headers.set('cookie', cookie);
        // `credentials` / `cache` n'ont pas de sens côté serveur : le cookie est posé ci-dessus.
        const { credentials: _credentials, cache: _cache, ...rest } = init;
        return dispatch(new NextRequest(url, { ...rest, method, headers }));
      }
      this.calls.push({ side: 'server', method, url });
      if (!this.allowedOrigins.has(url.origin)) {
        this.violations.push(`appel réseau vers une origine non autorisée : ${method} ${url}`);
        throw new TypeError(`fetch failed: ${url.origin} n'est pas un service déclaré`);
      }
      return realFetch(input, init);
    };
    return this;
  }

  uninstall() { if (this.realFetch) global.fetch = this.realFetch; }

  reset() { this.calls.length = 0; this.violations.length = 0; this.cookies = {}; }

  /** Fetch d'une URL du front, tel qu'émis par le navigateur (cookies de la page inclus). */
  browserFetch(pathname, init) { return global.fetch(pathname, init); }
}

module.exports = { FrontApp, ROUTES, matchRoute };
