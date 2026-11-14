/**
 * Rate Limiter - Production-Safe with Neon DB Backend
 * Replaces in-memory Map for serverless/multi-instance deployments
 */

import { getNeonSql } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment rate limit for an IP address
 * @param ip - Client IP address
 * @param maxAttempts - Maximum attempts allowed (default: 8)
 * @param windowMs - Time window in milliseconds (default: 10 minutes)
 */
export async function checkRateLimit(
  ip: string,
  maxAttempts = 8,
  windowMs = 10 * 60 * 1000
): Promise<RateLimitResult> {
  const sql = getNeonSql();
  
  // Fallback to in-memory if DB not available (dev only)
  if (!sql) {
    console.warn("[rate-limit] Database not available, using in-memory fallback");
    return inMemoryRateLimit(ip, maxAttempts, windowMs);
  }

  const now = Date.now();
  const resetAt = now + windowMs;

  try {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip VARCHAR(45) PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        reset_at BIGINT NOT NULL
      )
    `;

    // Get current rate limit state
    const result = await sql`
      SELECT attempts, reset_at FROM rate_limits WHERE ip = ${ip}
    `;

    if (result.length === 0) {
      // First attempt - insert new record
      await sql`
        INSERT INTO rate_limits (ip, attempts, reset_at)
        VALUES (${ip}, 1, ${resetAt})
      `;
      return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }

    const record = result[0];
    const currentResetAt = Number(record.reset_at);
    const currentAttempts = Number(record.attempts);

    // Check if window has expired
    if (currentResetAt < now) {
      // Reset the counter
      await sql`
        UPDATE rate_limits 
        SET attempts = 1, reset_at = ${resetAt}
        WHERE ip = ${ip}
      `;
      return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }

    // Check if limit exceeded
    if (currentAttempts >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentResetAt,
      };
    }

    // Increment counter
    await sql`
      UPDATE rate_limits 
      SET attempts = attempts + 1
      WHERE ip = ${ip}
    `;

    return {
      allowed: true,
      remaining: maxAttempts - currentAttempts - 1,
      resetAt: currentResetAt,
    };
  } catch (error) {
    console.error("[rate-limit] Database error, using in-memory fallback:", error);
    return inMemoryRateLimit(ip, maxAttempts, windowMs);
  }
}

/**
 * Reset rate limit for an IP (e.g., after successful login)
 */
export async function resetRateLimit(ip: string): Promise<void> {
  const sql = getNeonSql();
  if (!sql) return;

  try {
    await sql`DELETE FROM rate_limits WHERE ip = ${ip}`;
  } catch (error) {
    console.error("[rate-limit] Failed to reset rate limit:", error);
  }
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const sql = getNeonSql();
  if (!sql) return;

  const now = Date.now();
  try {
    await sql`DELETE FROM rate_limits WHERE reset_at < ${now}`;
  } catch (error) {
    console.error("[rate-limit] Failed to cleanup expired entries:", error);
  }
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(
  ip: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const attempt = memoryStore.get(ip);

  if (!attempt || attempt.resetAt < now) {
    memoryStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (attempt.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: attempt.resetAt };
  }

  attempt.count++;
  memoryStore.set(ip, attempt);

  return {
    allowed: true,
    remaining: maxAttempts - attempt.count,
    resetAt: attempt.resetAt,
  };
}
