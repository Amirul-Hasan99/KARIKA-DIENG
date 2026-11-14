import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const COOKIE = "dioleh2_admin_session";
const MAX_AGE_SECONDS = 8 * 60 * 60;

function constantTimeTextMatch(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  if (request.headers.get("origin") && request.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const key = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!key || !username || !password) {
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap." }, { status: 500 });
  }
  
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  
  // Rate Limit check
  const rateLimit = await checkRateLimit(ip, 8);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
    const body = await request.json();
    const suppliedUsername = typeof body.username === "string" ? body.username : "";
    const suppliedPassword = typeof body.password === "string" ? body.password : "";
    if (!constantTimeTextMatch(suppliedUsername, username) || !constantTimeTextMatch(suppliedPassword, password)) {
      return NextResponse.json({ error: "Username atau password tidak cocok." }, { status: 401 });
    }
    
    // Reset rate limit on success
    await resetRateLimit(ip);

    const payload = Buffer.from(JSON.stringify({ sub: username, exp: Math.floor(now / 1000) + MAX_AGE_SECONDS })).toString("base64url");
    const signature = createHmac("sha256", key).update(payload).digest("base64url");
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE, `${payload}.${signature}`, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
}
