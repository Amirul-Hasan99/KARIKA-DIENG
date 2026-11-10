import { NextRequest, NextResponse } from "next/server";

const COOKIE = "dioleh2_admin_session";
const encoder = new TextEncoder();

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function isAdminSessionValid(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
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
  // Customer-facing legacy reads are explicitly public; remaining operational APIs are private.
  const publicRead = (path === "/api/seed" && request.method === "GET") ||
    (/^\/api\/orders\/[^/]+$/.test(path) && request.method === "GET");
  const protectedPage = path === "/admin" || path.startsWith("/admin/");
  const protectedApi = path.startsWith("/api/") && !isLoginApi && !isPublicApi && !publicRead;
  if (isLoginPage || isLoginApi || (!protectedPage && !protectedApi)) return NextResponse.next();
  if (await isAdminSessionValid(request.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (protectedApi) return NextResponse.json({ error: "Autentikasi admin diperlukan." }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
