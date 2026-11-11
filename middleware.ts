import { NextRequest, NextResponse } from "next/server";

const COOKIE = "dioleh2_admin_session";
const encoder = new TextEncoder();

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function isAdminSessionValid(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET || "karika_dieng_super_secret_session_key_2026_wonosobo";
  const username = process.env.ADMIN_USERNAME || "karikadieng";
  if (!token || !secret || secret.length < 32 || !username) return false;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined) return false;
    const data = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as { sub?: string; exp?: number };
    if (data.sub !== username || !data.exp || data.exp <= Math.floor(Date.now() / 1000)) return false;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), encoder.encode(payload));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";
  const isLoginApi = path === "/api/admin/login" || path === "/api/admin/logout";
  const isPublicApi = path === "/api/orders/checkout" || path === "/api/midtrans/webhook";
  const publicRead =
    (path === "/api/seed" && request.method === "GET") ||
    (path === "/api/products" && request.method === "GET") ||
    (/^\/api\/orders\/[^/]+$/.test(path) && request.method === "GET") ||
    (path === "/api/orders/search" && request.method === "GET");
  const protectedPage = path === "/admin" || path.startsWith("/admin/");
  const protectedApi = path.startsWith("/api/") && !isLoginApi && !isPublicApi && !publicRead;

  const sessionToken = request.cookies.get(COOKIE)?.value;
  const isSessionValid = await isAdminSessionValid(sessionToken);

  // If already authenticated and trying to visit login page, forward to dashboard
  if (isLoginPage && isSessionValid) {
    const redirect = NextResponse.redirect(new URL("/admin", request.url));
    redirect.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return redirect;
  }

  // Not a protected route
  if (isLoginPage || isLoginApi || (!protectedPage && !protectedApi)) {
    return NextResponse.next();
  }

  // Protected route with valid session
  if (isSessionValid) {
    const response = NextResponse.next();
    // Anti-caching & anti-bfcache headers for admin pages & apis
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // Unauthorized API call
  if (protectedApi) {
    const errorResponse = NextResponse.json({ error: "Autentikasi admin diperlukan." }, { status: 401 });
    errorResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return errorResponse;
  }

  // Unauthorized page view - redirect to login with anti-cache headers
  const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
  redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  redirectResponse.headers.set("Pragma", "no-cache");
  redirectResponse.headers.set("Expires", "0");
  return redirectResponse;
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
