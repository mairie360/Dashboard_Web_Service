import { NextRequest, NextResponse } from "next/server";
import { readFrontUrlsFromEnv } from "./lib/front-urls";
import { validatedFrontHref } from "./lib/navigation";
import {
  buildContentSecurityPolicy,
  createNonce,
  NONCE_REQUEST_HEADER,
} from "./lib/content-security-policy";

// Presence/known-expiry UX guard only: authenticity and permissions remain the BFF's job.
function isExpiredJwt(token: string) {
  const segments = token.split(".");
  if (segments.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(segments[1].replace(/-/g, "+").replace(/_/g, "/")
      .padEnd(Math.ceil(segments[1].length / 4) * 4, "="))) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function refuseSession(request: NextRequest, expired: boolean) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
      ["/health", "/check_apis", "/openapi.json", "/swagger.json"].includes(pathname)) {
    return NextResponse.json({ error: { message: "Votre session a expiré. Veuillez vous reconnecter." } }, {
      status: 401, headers: { "Cache-Control": "no-store" },
    });
  }
  const loginHref = validatedFrontHref(readFrontUrlsFromEnv().LOGIN_FRONT_URL);
  // A rejected existing cookie must be expired by central Login before signing
  // in again, not locally by a second cookie-domain configuration.
  const destination = loginHref && (expired ? new URL("/logout", loginHref).href : loginHref);
  const response = destination ? NextResponse.redirect(destination,
    ["GET", "HEAD"].includes(request.method) ? 307 : 303) : new NextResponse(
    "Connexion temporairement indisponible. Veuillez contacter votre administrateur.",
    { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

// Après la garde, le middleware pose une Content-Security-Policy avec un nonce par
// requête. Next.js lit la CSP de la requête pour poser le nonce sur ses propres
// scripts : les pages doivent donc être rendues à la demande (voir src/app/layout.tsx).
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken || isExpiredJwt(accessToken)) return refuseSession(request, Boolean(accessToken));
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_REQUEST_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/openapi.json", "/swagger.json"],
};
