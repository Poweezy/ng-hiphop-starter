# NG Hip-Hop Next.js — AppSec Design Review

**Scope**: Authentication, authorization, rate limiting, CSRF, input validation, SQL injection, idempotency, session management, credential handling.  
**Date**: 2026-08-15

---

## Executive Summary

The AppSec posture is **strong** — Prisma ORM eliminates SQL injection, bcrypt (cost 12) protects passwords, fail-closed rate limiting prevents abuse when Redis is down, and middleware Origin-checking blocks CSRF on mutating methods. However, several **High-severity gaps** exist in admin JSON endpoint validation, credential reset design, session error handling, and data leakage in the user export endpoint.

**Critical/High Findings: 4** | **Medium Findings: 6** | **Low Findings: 3**

---

## 1. Authentication

### Good
- NextAuth v5 with `trustHost` + `NEXTAUTH_SECRET`/`NEXTAUTH_URL` enforcement
- bcrypt cost factor 12 for password hashing
- Login rate-limited per `ip:email` (5/15min), fail-closed
- `tokenVersion` field — incremented on password change/reset, invalidates all JWTs
- Production cookie flags: `__Secure-` prefix, `HttpOnly`, `SameSite: Lax`, `Secure`

### Issues

**A1 — Medium**: `trustHost: true` disables NextAuth host-header validation. Vulnerable to host-header injection if reverse proxy doesn't sanitize.
- **Fix**: Remove `trustHost: true` or ensure proxy strips/overwrites `Host` header before forwarding.

**A2 — Low**: Authorize callback leaks email existence via timing side-channel (early return on DB miss vs. bcrypt mismatch).
- **Fix**: Always run `bcrypt.compare` against a dummy hash for missing users to normalize timing.

---

## 2. Authorization (Admin vs. Public)

### Good
- Centralized `requireAdmin()` helper across all admin routes
- Admin self-protection: cannot delete self or change own role
- Public GET endpoints properly scoped (approved + featured only)
- Pagination enforced on admin lists (max 100/page)

### Issues

**B1 — Medium**: `/api/user/export` authenticates with `auth()` but doesn't verify `role === 'ADMIN'`. Only safe because `authorize` callback checks role, but semantically wrong.
- **Fix**: Replace `session?.user?.email` checks with `requireAdmin()` on all admin-only endpoints including `user/export` and `user/delete`. Add re-authentication for self-deletion.

**B2 — Medium**: No audit trail for sensitive admin actions (role change, password change, user deletion, winner declaration). Console logs only.
- **Fix**: Add structured audit logging: `{ actorId, action, targetId, timestamp, ip }` to an append-only `audit_logs` table.

---

## 3. Rate Limiting

### Good
- Upstash Redis sliding-window with `failClosed()` in production
- Endpoint-specific limits: login (5/15min), quotes (3/min), graffiti (3/min), subscribe (3/min), reset-password (3/5min)
- IP extraction respects `x-forwarded-for` first hop

### Issues

**C1 — Medium**: `user/export` and `user/delete` have **no rate limiting** — bulk exfiltration/deletion risk.
- **Fix**: Add rate limiting: export (10/min), delete (3/min).

**C2 — Low**: In-memory `Map` idempotency store — fails across instances in multi-instance deployments.
- **Fix**: Move to Redis-backed store using existing Upstash instance.

---

## 4. CSRF Protection

### Good
- Middleware enforces `Origin === Host` for mutating methods (POST, PUT, PATCH, DELETE)
- `X-Request-Id` correlation ID on every response
- NextAuth built-in CSRF token protects auth routes

### Issues

**D1 — Low**: No `X-Requested-With` check as defense-in-depth.
- **Fix**: Add `X-Requested-With: XMLHttpRequest` validation for mutating methods (exception for multipart uploads).

**D2 — Low**: Consider `SameSite: strict` for admin-only session cookie.
- **Fix**: Admin sessions don't need cross-site navigation; use `strict`.

---

## 5. Input Validation

### Good
- Zod schemas on all public-facing inputs (quotes, graffiti, lyrics, songs, competitions, slogans)
- Length limits, CUID format validation, enum constraints

### Issues

**E1 — High**: Multiple admin JSON endpoints skip Zod validation:
- `admin/users PATCH`: validates `role` enum but not `id` as CUID
- `competitions/[id]/winner POST`: `const { winnerId } = body as { winnerId?: string }` — no validation at all
- `admin/change-password POST`: inline `length >= 8` check, no schema
- `admin/reset-password POST`: no Zod validation
- `graffiti POST` (JSON branch): no validation on `imageUrl`, `imageKey`, `artistName`

- **Fix**: Apply Zod schemas to every admin JSON endpoint. Use `z.string().cuid()` for IDs, `z.enum()` for constrained fields.

**E2 — Medium**: No URL validation on `fileUrl`, `coverUrl`, `imageUrl`, `distributionLinks`, `publisherLink` — admins can inject arbitrary external URLs.
- **Fix**: Add `z.string().url()` to all URL fields; consider domain allowlisting.

**E3 — Medium**: `presign` endpoint validates `folder` length but doesn't restrict to allowed values.
- **Fix**: `z.enum(['songs', 'covers', 'graffiti', 'uploads'])`.

---

## 6. SQL Injection

### Finding
- **No issues.** Prisma ORM used exclusively. No `$queryRaw`, no string concatenation. CUIDs validated by Zod.

---

## 7. Idempotency

### Good
- Idempotency keys on quote submission, lyric creation, slogan update
- 24h TTL on cache

### Issues

**F1 — Medium**: In-memory `Map` store — fails across instances.
- **Fix**: Move to Redis-backed store (same Upstash instance). Key: `idempotency:{key}`, TTL: 24h.

**F2 — Low**: No idempotency key format validation — any string accepted, enabling memory exhaustion.
- **Fix**: Validate key as UUID/CUID, max 128 chars.

---

## 8. Session Management

### Good
- JWT strategy, 8-hour `maxAge`
- `tokenVersion` invalidation on password change/reset
- JWT callback re-fetches `role` and `tokenVersion` from DB each request

### Issues

**G1 — Medium**: JWT callback catches DB errors but returns stale token — stale `role` persists if DB unreachable.
- **Fix**: If `dbUser` undefined or error, invalidate token (`token.sub = undefined`) rather than returning stale token.

**G2 — Low**: No absolute session timeout beyond `maxAge`.
- **Fix**: Store `iat` in JWT and reject tokens older than absolute window (e.g., 24h).

---

## 9. Credential Handling

### Good
- bcrypt cost 12
- `ADMIN_RESET_SECRET` compared with `crypto.timingSafeEqual`
- Rate-limited reset endpoint (3/5min per IP)
- `tokenVersion` increment on all password changes

### Issues

**H1 — High**: Single shared `ADMIN_RESET_SECRET` for all admins — global admin bypass if compromised.
- **Fix**: Replace with per-admin, short-lived, single-use reset tokens (1-hour expiry, stored hashed in DB, sent to email).

**H2 — Medium**: No password complexity policy — only min 8 chars.
- **Fix**: Require min 10 chars, reject top 10k common passwords (zxcvbn or blocklist), display requirements.

**H3 — Medium**: No email notification when admin password changed via reset.
- **Fix**: Email notification on password change.

---

## 10. Data Leakage in user/export

**I1 — High**: `/api/user/export` returns ALL active lyrics regardless of requesting user identity:
```typescript
const lyrics = await prisma.lyricGame.findMany({ where: { is_active: true } });
```
Quotes and graffiti correctly scoped to `submitted_by`, but lyrics are not.

- **Fix**: Filter lyrics by user's own submissions. If no `submitted_by` field exists on `LyricGame`, add one or scope by competition the user subscribed to.

---

## Critical/High Summary

| Priority | Finding | Location |
|----------|---------|----------|
| **High** | `user/export` leaks all active lyrics to any authenticated user | `app/api/user/export/route.ts:35` |
| **High** | Single shared `ADMIN_RESET_SECRET` allows global admin password reset | `app/api/admin/reset-password/route.ts` |
| **High** | Missing Zod validation on admin JSON endpoints | `admin/users PATCH`, `winner POST`, `reset-password` |
| **Medium** | `trustHost: true` disables host-header validation | `lib/auth.ts:19` |
| **Medium** | No audit logging for sensitive admin actions | All admin routes |
| **Medium** | In-memory idempotency store fails across instances | `lib/idempotency.ts:9` |
| **Medium** | JWT callback returns stale token on DB error | `lib/auth.ts:78-94` |
| **Medium** | No password complexity enforcement | `admin/change-password`, `admin/reset-password` |
