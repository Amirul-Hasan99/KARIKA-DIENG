# 🔒 KARIKA Security & Clean Code Audit Report
**Date**: 2026-11-14  
**Status**: CRITICAL FINDINGS & RECOMMENDATIONS  
**Reviewed By**: E2E Test & Security Audit

---

## 📋 Executive Summary

| Category | Status | Priority |
|----------|--------|----------|
| **Security** | 🔴 CRITICAL | HIGH |
| **Clean Code** | 🟡 WARNING | MEDIUM |
| **Performance** | 🟢 GOOD | LOW |
| **Bug Fixes** | 🟡 FOUND | MEDIUM |

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. Hardcoded Secrets in Code
**Files Affected:**
- `middleware.ts` (line 13)
- `app/api/admin/login/route.ts` (lines 19-21)

**Risk**: Default secrets exposed in repository. If `.env.local` is committed, these are compromised.

**Current Code:**
```typescript
// middleware.ts:13
const secret = process.env.ADMIN_SESSION_SECRET || "karika_dieng_super_secret_session_key_2026_wonosobo";
const username = process.env.ADMIN_USERNAME || "karikadieng";

// app/api/admin/login/route.ts:19-21
const key = process.env.ADMIN_SESSION_SECRET || "karika_dieng_super_secret_session_key_2026_wonosobo";
const username = process.env.ADMIN_USERNAME || "karikadieng";
const password = process.env.ADMIN_PASSWORD || "karikadieng000";
```

**Risk Level**: 🔴 CRITICAL  
**Action**: Remove fallback values. Require env vars to be set.

---

### 2. In-Memory Rate Limiting (Not Production-Safe)
**File Affected:**
- `app/api/admin/login/route.ts` (line 6, 24-27)

**Current Code:**
```typescript
const attempts = new Map<string, { count: number; resetAt: number }>();
// ...
if (attempt && attempt.resetAt > now && attempt.count >= 8) {
  return NextResponse.json({ error: "Terlalu banyak percobaan..." }, { status: 429 });
}
```

**Risk**: 
- In serverless (Vercel), each function invocation gets a fresh Map
- Rate limiting is bypassed when multiple instances serve traffic
- Distributed attack is easy

**Risk Level**: 🔴 CRITICAL  
**Action**: Use Neon DB to store rate limit state (recommended for current setup).

---

### 3. Missing Security Headers
**File Affected:**
- Global middleware (no CSP, no HSTS, no X-Frame-Options)

**Risk**: 
- XSS attacks possible
- Clickjacking possible
- MIME type confusion attacks possible

**Risk Level**: 🔴 CRITICAL  
**Action**: Add security headers to all responses.

---

### 4. Order API Missing Authorization Check
**File Affected:**
- `app/api/orders/[orderId]/route.ts` (PATCH endpoint)

**Risk**: Any user can update any order status without authorization.

**Risk Level**: 🔴 CRITICAL  
**Action**: Add ownership/admin check before PATCH operations.

---

### 5. No CSRF Protection
**File Affected:**
- Order checkout endpoint (`app/api/orders/checkout/route.ts`)

**Risk**: Cross-site request forgery possible from other domains.

**Risk Level**: 🟡 HIGH  
**Action**: Validate origin header or use CSRF tokens.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Error Messages Leaking Internal Details
**Files Affected:**
- All API routes that use try-catch

**Example:**
```typescript
// BAD - leaks internal info
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// GOOD - generic message
catch (error) {
  console.error("[error-context]", error); // Log internally
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

**Risk Level**: 🟡 MEDIUM  
**Action**: Standardize error responses (no stack traces to client).

---

### 7. Missing Input Validation on Patch Endpoint
**File Affected:**
- `app/api/orders/[orderId]/route.ts` (PATCH)

**Current**: No validation on `delivery_status` payload.

**Risk Level**: 🟡 MEDIUM  
**Action**: Validate enum values (pending, assigned, picked_up, delivered).

---

### 8. Midtrans API Keys in Code
**File Affected:**
- `.env.local` (lines 2-4)

**Current:**
```
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-sample-key
MIDTRANS_SERVER_KEY=SB-Mid-server-sample-key
```

**Risk**: Sample keys exposed (acceptable for sandbox, but use real keys in production).

**Risk Level**: 🟡 MEDIUM  
**Action**: Rotate keys before production. Use `.env.example` for reference only.

---

## 🟢 CLEAN CODE ISSUES

### 9. Duplicated Auth Logic
**Files Affected:**
- `middleware.ts` (isAdminSessionValid)
- `app/api/admin/login/route.ts` (constantTimeTextMatch)

**Issue**: Auth validation is duplicated.

**Recommendation**: Extract to `lib/auth.ts` (shared utility).

---

### 10. Magic Strings & Numbers
**Files Affected:**
- Multiple files use `"dioleh2_admin_session"`, `8 * 60 * 60`, `429`, `413`

**Recommendation**: Move to constants file `lib/constants.ts`.

---

### 11. No Input Schema Validation
**Files Affected:**
- `app/api/orders/checkout/route.ts` (manual validation)

**Recommendation**: Use Zod schema for all inputs.

---

## 📊 SUMMARY TABLE

| Issue | File(s) | Risk | Action |
|-------|---------|------|--------|
| Hardcoded secrets | middleware.ts, login/route.ts | 🔴 CRITICAL | Remove fallback values |
| In-memory rate limiting | login/route.ts | 🔴 CRITICAL | Use Neon DB |
| Missing security headers | middleware.ts | 🔴 CRITICAL | Add CSP, HSTS headers |
| No authorization on PATCH | orders/[orderId]/route.ts | 🔴 CRITICAL | Check admin auth |
| No CSRF protection | checkout/route.ts | 🟡 HIGH | Validate origin |
| Error leakage | All API routes | 🟡 MEDIUM | Generic error messages |
| Missing input validation | orders/[orderId]/route.ts | 🟡 MEDIUM | Validate enum values |
| Duplicated auth logic | middleware.ts, login/route.ts | 🟡 MEDIUM | Extract to lib/auth.ts |
| Magic strings/numbers | Multiple | 🟡 MEDIUM | Use constants |
| No schema validation | checkout/route.ts | 🟡 MEDIUM | Use Zod |

---

## ✅ NEXT STEPS (IN ORDER OF PRIORITY)

1. **Remove hardcoded secrets** (5 mins)
2. **Add security headers** (10 mins)
3. **Add authorization check to PATCH** (15 mins)
4. **Move rate limiting to Neon DB** (30 mins)
5. **Extract auth logic to lib/auth.ts** (20 mins)
6. **Add input schema validation** (30 mins)
7. **Standardize error responses** (20 mins)

**Estimated Total Time**: ~2 hours

---

