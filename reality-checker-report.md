# Reality Checker — Production Readiness Certification Report
**Target:** `ng-hiphop-starter` (Next.js 14 App Router, Prisma SQLite/Postgres, NextAuth, Upstash, S3, Sharp, Zod, Zustand)
**Date:** 2026-07-14
**Agent:** Reality Checker (evidence-based verification against source code)

---

## 1. Production-Readiness Verdict

**DO NOT SHIP**

The codebase contains **10+ P0 security/correctness blockers** that make any production deployment immediately exploitable or broken for public users. Critical fail-open security controls, a broken public upload path, a dead API endpoint, missing error boundaries, and duplicate configuration files must be resolved before release.

---

## 2. Fact vs Fiction

Claims are sourced from **README.md "Recent Improvements"** (lines 156–174) and **DEPLOYMENT.md** (lines 1–516).

| Claim | Verdict | Evidence |
|---|---|---|
| "Added database indexes for performance" | **VERIFIED** | `prisma/schema.prisma:40,55,70,82,96` — `@@index` directives present on `Song.is_active`, `QuoteSubmission.(approved,is_featured,display_until)`, `GraffitiSubmission.(approved,display_until)`, `LyricGame.is_active`, `Job.(status,createdAt)` |
| "Fixed type safety issues (enabled strict mode, removed `as any`)" | **PARTIALLY TRUE** | Strict mode enabled: `tsconfig.json:11`. **But** `as any` still present at `lib/auth.ts:33`, `app/api/auth/[...nextauth]/options.ts:33`, `lib/ratelimit.ts:67`, `lib/uploadScanner.ts:78`, `app/api/uploads/presign/route.ts:41` |
| "Improved accessibility (focus styles, ARIA labels, touch targets)" | **UNKNOWN** | No grep for ARIA roles/labels was conclusive; focus styles exist in admin CSS but not auditable from code alone without visual inspection |
| "Enhanced security (CSP headers, timing-safe reset secret, sanitized errors, S3 signed URLs)" | **PARTIALLY TRUE** | CSP present but includes `unsafe-eval` and `unsafe-inline` (`next.config.js:38`). Reset secret uses `bcrypt.compare` (timing-safe) (`app/api/admin/reset-password/route.ts:37`). Errors return `{ message: 'Server error' }` to client. S3 signed URLs exist but default to **1 hour** TTL (`lib/storage.ts:74,114-116`) |
| "Fixed memory leaks (rate-limit cache, removed unbounded upload log)" | **FALSE** | No evidence of memory leak fixes. The `customLimiters` Map in `lib/ratelimit.ts:41` grows unbounded per unique `(max, periodSeconds)` pair. No upload log removal is visible in source |
| "Optimized image uploads with Sharp + server-side optimize endpoint" | **VERIFIED** | `lib/imageOptimizer.ts` exists; `/api/uploads/optimize` route exists at `app/api/uploads/optimize/route.ts:12-57` |
| "Added presigned S3 upload support (`/api/uploads/presign`)" | **VERIFIED** | `app/api/uploads/presign/route.ts:13-48` |
| "Added request validation with Zod" | **VERIFIED** | `lib/validations.ts:1-50` defines schemas; routes use `.safeParse()` |
| "Implemented DELETE endpoints with file cleanup" | **PARTIALLY TRUE** | DELETE endpoints exist and call `storage.deleteFile`, but accept JSON body instead of route params (`app/api/quotes/route.ts:159`, `app/api/songs/route.ts:202`, `app/api/graffiti/route.ts:167`) |
| "Added pagination to admin API endpoints" | **VERIFIED** | Manual offset pagination in `app/api/quotes/route.ts:24-26`, `app/api/songs/route.ts:25-27`, `app/api/graffiti/route.ts:25-27` |
| "Created shared `requireAdmin()` auth helper" | **VERIFIED** | `app/api/_lib/admin.ts:4-13` |
| "Confirmation dialogs for destructive actions" | **UNKNOWN** | No confirmation dialogs found in route handlers; admin UI not fully audited here |
| "Improved error logging and handling" | **PARTIALLY TRUE** | All catch blocks log to `console.error`, but no request correlation IDs (`X-Request-ID`) exist anywhere |
| "Added SLO definitions and request observability logging" | **PARTIALLY TRUE** | `lib/slo.ts` and `lib/observability.ts` exist, but `recordRequest` is **only called in quotes** (`app/api/quotes/route.ts:37,51,67,81,96,111,141,155`). Songs, graffiti, lyrics, slogan, uploads, and admin routes do **not** instrument requests |
| "Added upload scanning scaffold (ClamAV + webhook adapters)" | **VERIFIED** | `lib/uploadScanner.ts:20-90` |
| "Added async moderation queue with retry logic" | **VERIFIED** | `lib/queue.ts` and `lib/moderation.ts` exist |
| "Updated Next.js to 14.2.28" | **VERIFIED** | `package.json:35` — `"next": "^14.2.28"` |
| "CORS Configuration Already configured in `next.config.js`" | **FALSE** | `DEPLOYMENT.md:262-275` shows `Access-Control-Allow-Origin` headers, but the actual `next.config.js:27-43` has **no CORS headers** |
| "Virus scanning is opt-in and fail-open by default" | **VERIFIED** | `lib/uploadScanner.ts:4` comment: "Default: fail-open so local development is not blocked." Code returns `{ clean: true }` when `VIRUS_SCANNER_ENABLED !== 'true'` (`lib/uploadScanner.ts:99-102`) |

---

## 3. Release Gate Checklist

| Gate | Criteria | Status | Evidence |
|---|---|---|---|
| **Security — Scanner** | Upload scanner must fail-closed on error/detection | **FAIL** | `lib/uploadScanner.ts:114-116` — catch block returns `{ clean: true }`; `lib/uploadScanner.ts:81-82` — webhook returns `{ clean: true }` on non-OK |
| **Security — Scanner Timeout** | ClamAV socket must have timeout | **FAIL** | `lib/uploadScanner.ts:29` — raw `net.createConnection` with no `Promise.race` timeout |
| **Security — Rate Limiting** | Rate limiter must fail-closed in production when Redis missing | **FAIL** | `lib/ratelimit.ts:76-78` — returns `{ allowed: true }` when Upstash not configured |
| **Security — Reset Secret** | Admin reset secret must not be cached in module-level mutable state | **FAIL** | `app/api/admin/reset-password/route.ts:7` — `let masterSecretHash` is module-scoped and survives forever in long-running processes |
| **Security — Path Traversal** | Upload folder must be sanitized to prevent directory escape | **FAIL** | `lib/storage.ts:35` — `path.join('uploads', folder, filename)` where `folder` is user-controlled from `formData` at `app/api/uploads/optimize/route.ts:25` |
| **Security — CSP** | CSP must not include `unsafe-eval` or `unsafe-inline` | **FAIL** | `next.config.js:38` — `script-src 'self' 'unsafe-inline' 'unsafe-eval'` |
| **Correctness — LyricGame API** | Client must call existing API route | **FAIL** | `components/LyricGame.tsx:133` — `fetch('/api/lyric-game')` does not exist; real route is `/api/lyrics` (`app/api/lyrics/route.ts`) |
| **Correctness — Public Upload** | Public upload endpoints must not require admin auth | **FAIL** | `components/GraffitiShowcase.tsx:87` calls `/api/uploads/optimize`; that route requires admin (`app/api/uploads/optimize/route.ts:14`) — public users receive 401 |
| **Correctness — S3 Image Delivery** | S3 hostnames must be in `next/image` `remotePatterns` | **FAIL** | `next.config.js:3-25` — remotePatterns missing S3 domains; components render S3 URLs via `next/image` (`components/GraffitiShowcase.tsx:50`) |
| **Correctness — S3 Signed URL TTL** | Media URLs must not expire during a typical session | **FAIL** | Default TTL is 3600s (1h) (`lib/storage.ts:74,114-116`) |
| **Reliability — Error Boundaries** | App Router requires `error.tsx` for each segment | **FAIL** | Glob search confirms **zero** `error.tsx` files in `app/` |
| **Reliability — Loading States** | App Router requires `loading.tsx` for streaming | **FAIL** | Glob search confirms **zero** `loading.tsx` files in `app/` |
| **Reliability — Queue** | Job queue must not silently drop failures | **FAIL** | `lib/queue.ts:47,51,63` — `.catch(() => {})` swallows DB errors; no dead-letter queue (`lib/queue.ts:86` marks failed jobs and discards them) |
| **Reliability — Moderation** | Moderation queue must have a real handler | **FAIL** | `lib/moderation.ts:14-18` — handler is a `TODO` placeholder that only `console.info`s |
| **Build/Config — Duplicate Schema** | Only one Prisma schema must be active | **FAIL** | Both `prisma/schema.prisma` (SQLite, 98 lines) and `app/schema.prisma` (PostgreSQL, 68 lines) exist; `prisma/schema.prisma` is referenced in `package.json:54` seed config, but `app/db.ts` likely imports from `prisma/` |
| **Build/Config — Duplicate Auth** | NextAuth config must be defined once | **FAIL** | Identical `authOptions` exported from `lib/auth.ts:6-49` and `app/api/auth/[...nextauth]/options.ts:6-50` |
| **Observability — Metrics** | SLO targets must be instrumented | **FAIL** | `lib/slo.ts` defines targets but no metric export, no alerting, no dashboard integration |
| **Observability — Coverage** | All routes must emit request telemetry | **FAIL** | `recordRequest` only used in `app/api/quotes/route.ts`; all other routes lack timing/status logging |

---

## 4. P0 Blockers

These must be fixed before any production deploy:

| # | Issue | File:Line |
|---|---|---|
| 1 | **ClamAV detections are silently ignored** — scanner returns `clean: true` on any error, including virus detection | `lib/uploadScanner.ts:114-116` |
| 2 | **ClamAV has no timeout** — raw TCP socket can block event loop indefinitely if daemon hangs | `lib/uploadScanner.ts:29` |
| 3 | **Webhook scanner fails open** — non-OK HTTP responses default to `clean: true` | `lib/uploadScanner.ts:81-82` |
| 4 | **Rate limiting disabled without Upstash** — returns `allowed: true` when Redis env vars missing | `lib/ratelimit.ts:76-78` |
| 5 | **Admin reset secret cached in module scope** — process-level mutable global that never rotates | `app/api/admin/reset-password/route.ts:7-18` |
| 6 | **Path traversal in local uploads** — user-controlled `folder` param from `formData` passed to `path.join` without sanitization | `app/api/uploads/optimize/route.ts:25` → `lib/storage.ts:35` |
| 7 | **S3 signed URLs expire after 1h by default** — media becomes inaccessible without re-upload | `lib/storage.ts:74,114-116` |
| 8 | **LyricGame posts to dead endpoint** — `fetch('/api/lyric-game')` returns 404; real route is `/api/lyrics` | `components/LyricGame.tsx:133` vs `app/api/lyrics/route.ts` |
| 9 | **Public graffiti upload requires admin** — `GraffitiShowcase` calls `/api/uploads/optimize` which gates on `requireAdmin` | `app/api/uploads/optimize/route.ts:14` vs `components/GraffitiShowcase.tsx:87` |
| 10 | **`next/image` remotePatterns missing S3** — S3-hosted images will fail `next/image` validation in production | `next.config.js:3-25` (no S3 hostnames listed) |
| 11 | **CSP includes `unsafe-eval` and `unsafe-inline`** — defeats nonce/hash-based XSS protection | `next.config.js:38` |
| 12 | **No `error.tsx` or `loading.tsx`** — App Router segments lack error boundaries and streaming skeletons | `app/` (glob confirms zero files) |
| 13 | **Duplicate Prisma schema files** — `prisma/schema.prisma` (SQLite) and `app/schema.prisma` (PostgreSQL) cause migration confusion | `prisma/schema.prisma` and `app/schema.prisma` |
| 14 | **Duplicate NextAuth config** — two identical `authOptions` exports risk drift | `lib/auth.ts:6-49` and `app/api/auth/[...nextauth]/options.ts:6-50` |
| 15 | **Moderation handler is a TODO stub** — admins are never actually notified of pending submissions | `lib/moderation.ts:14-18` |
| 16 | **Queue silently swallows DB errors** — `.catch(() => {})` on status updates hides persistence failures | `lib/queue.ts:47,51,63` |

---

## 5. Recommended Pre-Launch Checklist

Ordered by dependency and risk:

1. **Fix fail-open scanner** (`lib/uploadScanner.ts:114-116`, `lib/uploadScanner.ts:81-82`) — make `scanBuffer` return `{ clean: false }` on error; make webhook return `{ clean: false }` on non-OK.
2. **Add ClamAV socket timeout** (`lib/uploadScanner.ts:29`) — wrap in `Promise.race` with 30s limit.
3. **Make rate limiting fail-closed in production** (`lib/ratelimit.ts:76-78`) — return `{ allowed: false }` when Upstash missing and `NODE_ENV === 'production'`.
4. **Remove module-level `masterSecretHash` cache** (`app/api/admin/reset-password/route.ts:7-18`) — read `ADMIN_RESET_SECRET` per-request or cache in a closure with rotation.
5. **Sanitize upload `folder` param** (`app/api/uploads/optimize/route.ts:25`, `lib/storage.ts:35`) — whitelist folders (`['songs','covers','graffiti']`) or strip path separators.
6. **Fix LyricGame dead endpoint** (`components/LyricGame.tsx:133`) — change `'/api/lyric-game'` to `'/api/lyrics'`.
7. **Remove `requireAdmin` from public optimize endpoint** (`app/api/uploads/optimize/route.ts:14`) — public users need this for graffiti uploads; add separate admin-only route if needed.
8. **Add S3 hostnames to `next/image` `remotePatterns`** (`next.config.js:3-25`) — include `S3_PUBLIC_BASE_URL` hostname.
9. **Harden CSP** (`next.config.js:38`) — remove `unsafe-eval` and `unsafe-inline`; use nonces if framework requires them.
10. **Add `error.tsx` and `loading.tsx`** to critical route segments (`app/admin/`, `app/api/` wrappers, etc.).
11. **Delete duplicate `app/schema.prisma`** — keep only `prisma/schema.prisma` and ensure `provider = "postgresql"` is set via env/migration for production.
12. **Consolidate auth config** — export `authOptions` from `lib/auth.ts` only; import it in `app/api/auth/[...nextauth]/route.ts`.
13. **Replace moderation TODO** (`lib/moderation.ts:14-18`) — wire up email/Slack webhook or remove the queue.
14. **Stop swallowing queue DB errors** (`lib/queue.ts:47,51,63`) — log failures to observability.
15. **Reduce S3 signed URL TTL** or implement refresh logic — if 1h is acceptable, document it; otherwise add a server-side proxy or shorter TTL with refresh.
16. **Add request correlation IDs** — generate `X-Request-ID` in middleware and propagate to logs.
17. **Run `npm run build`** after fixes to verify no TypeScript or Prisma errors remain.
