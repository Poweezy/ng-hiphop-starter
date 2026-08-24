# Website Audit — NG Hip Hop Platform

**Date:** 2026-08-24 · **Auditor:** Loop Engineer · **Scope:** Full-stack audit of the Next.js 15 hip-hop platform (app router, Prisma/Postgres, NextAuth v5, Upstash, S3/Supabase storage, Sentry)

---

## Executive Summary

The codebase is in **good shape overall**. Security posture is unusually strong for a project of this size (defense-in-depth CSRF, fail-closed rate limiting, upload scanning, constant-time secret comparison). TypeScript compiles clean, all 15 unit tests pass, and lint has 0 errors.

The top priorities are: **(1)** patching high-severity dependency vulnerabilities — notably `sharp`, which processes user-uploaded images, **(2)** tightening the CSP, and **(3)** repo hygiene (a 7MB zip, build artifacts, and stale temp/report files are committed to git).

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, ⚠️ 62 warnings |
| `vitest run` | ✅ 15/15 tests pass |
| `next build` | ⚠️ Stalls locally — see Finding M1 |
| `npm audit` | ❌ 3 high, 1 moderate |
| Secrets in git | ✅ None found (`.env` correctly ignored) |

---

## Security Strengths (verified)

- **Auth:** NextAuth credentials provider, bcrypt cost 12, ADMIN-only login, JWT sessions capped at 8h, `tokenVersion` invalidation on password change, `__Secure-` httpOnly/sameSite=lax cookies in prod.
- **Authorization:** Shared `requireAdmin()` helper (`app/api/_lib/admin.ts`) consistently applied across admin routes — spot-checked `uploads/presign`, `subscribers/export`, `admin/*`, graffiti PATCH/DELETE: all gated.
- **CSRF:** Origin-vs-Host check in `middleware.ts` for all mutating methods; rejects missing Origin in production.
- **Rate limiting:** Fail-closed in production when Upstash is unconfigured (`lib/ratelimit.ts`); login 5/15min per IP+email, password reset 3/5min, subscribe 3/60s, exports 10/60s per admin+IP.
- **Password reset:** Constant-time comparison (`crypto.timingSafeEqual`), no user enumeration (uniform error messages).

- **Uploads:** Content-type allowlist on presign, virus scanning fail-closed in prod, image optimization pipeline.
- **Headers:** CSP, HSTS (prod), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- **Input validation:** Zod schemas on API routes; **no secrets committed** (regex sweep for AWS/OpenAI-style keys came back clean).

---

## Findings

### 🔴 High

**H1. Vulnerable dependencies (3 high, 1 moderate)** — `npm audit`
- `sharp <0.35`: inherited libvips CVEs (CVE-2026-33327/-33328/-35590/-35591). **This library decodes untrusted user-uploaded images — highest exploitation relevance.** Fix: bump to `sharp@^0.35.3`.
- `postcss <=8.5.22` (pulled by next 15): XSS + arbitrary `.map` file read advisories. Fix arrives with `next@16` (breaking).
- `uuid <11.1.1` (moderate): buffer bounds check.

**H2. Weak CSP**
- `script-src 'self' 'unsafe-inline'` negates most XSS protection; `img-src https:` and `connect-src https:` allow any remote host. The config already notes nonce-based CSP as future work for admin routes — recommend implementing it.

**H3. Admin dashboard data loading (`app/admin/page.tsx`)**
- Loads up to ~1,400 rows across 10 tables per admin page load, plus an N+1 pattern (2 extra `count` queries per user row). Degrades sharply as data grows — move to paginated panel-level fetching and grouped count queries.

### 🟡 Medium

**M1. Build-time database coupling**
- `/` and `/library` prerender at build time with direct Prisma queries; `next build` hangs/fails without a reachable `DATABASE_URL` (reproduced locally). Force dynamic rendering or add fallback data so builds never depend on live DB access.

**M2. Repo hygiene — junk tracked in git**
- Committed: `ng-hiphop-deployment.zip` (6.9 MB), `tsconfig.tsbuildinfo` (491 KB), `tmp_songs_check.txt`, `build.log`, plus stale audit reports. Remove and extend `.gitignore`.
- `.kilo/worktrees/*` contains near-complete duplicates of the app (reliability-sre, security-hardening, seo-infra…) — pollutes every search and risks edits landing in a stale copy. Archive or remove.

**M3. Pinned beta auth dependency**
- `next-auth ^5.0.0-beta.32` — pin exactly and plan the stable-v5 upgrade.

**M4. Dead code / lint debt**
- 62 warnings including genuinely dead exports (`lib/queue.ts: markJobProcessing`, `lib/moderation.ts: calculateBackoffMs`, unused `lib/storage.ts` helpers) and `any` casts in `lib/adminTypes.ts` / admin pages.

### 🟢 Low / Informational

- `X-XSS-Protection` header is deprecated/no-op in modern browsers — harmless, can be dropped.
- `dangerouslySetInnerHTML` usage is JSON-LD only with `JSON.stringify` payloads — safe pattern.
- Login rate limit keys on IP+email; IP rotation bypasses it — acceptable today, consider CAPTCHA if abused.
- Sitemap hardcodes `https://ng-hiphop.com` — derive from `APP_URL` env for env parity.
- Vitest warns about ESM/CJS mismatch in `vitest.config.ts` before Vite flips the `configLoader` default.

---

## Recommended Action Plan (priority order)

1. ✅ **DONE** (`4160d95`) — `sharp@^0.35.3` + npm override so Next's nested copy is patched too. Native binary smoke-tested (encode/resize OK). Audit: 3 high → 1 high.
2. ✅ **DONE** — CSP hardened via `middleware.ts` (single source, no duplicate headers):
   - **`/admin` routes (production):** strict per-request nonce + `strict-dynamic` script-src — Next auto-nonces all bootstrap scripts; `/admin/login` forced dynamic so it can be nonced. Verified live: header carries nonce, HTML scripts carry matching nonce, page 200.
   - **Site-wide:** wildcard `img-src https:` / `connect-src https:` replaced with explicit allowlists (Spotify/Apple/Unsplash/S3/Supabase media; Sentry/Vercel Analytics/Supabase connect); added `media-src`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
   - Non-`/admin` pages keep `script-src 'unsafe-inline'` because they are statically generated (ISR) and cannot carry per-request nonces.
3. ✅ **DONE** (`3243da3`) — Purged 256 stale files from the repo (deployment zip, tsbuildinfo, tmp scratch, build log, `.kilo` duplicates); removed 3 merged worktrees + branches. Uncommitted worktree experiments archived to `.kilo/backups/*.patch`.
4. ✅ **DONE locally** (`ce34bb7`) — Prisma client now appends `connect_timeout=5&pool_timeout=10&socket_timeout=10` when not configured, so prerendering fails in seconds instead of hanging minutes. **Note:** full local build verification is blocked by the OneDrive-synced workspace path — webpack chunks vanish mid-build (`Cannot find module './6141.js'`, a known OneDrive sync race). Compile + lint phases pass; final build verification must run in CI/Vercel.
5. 🔶 **PARTIALLY DONE** — N+1 query pattern eliminated (`groupBy` × 2 instead of 2×N per-user COUNTs), so admin page-load cost no longer scales linearly with users; also removed a masked `any` (Prisma `Decimal` now typed properly). **Deferred:** full panel-level pagination requires new list API endpoints + refactors across all ~14 panels — a dedicated task.
6. ✅ **DONE** (`58d1453`) — Dead code removed, `any` casts replaced with precise types. Warnings 62 → 47 (remainder is intentional `no-console` in the console email provider / observability).
7. ⬜ Plan Next 16 + next-auth stable upgrade (clears the remaining postcss/uuid advisories).

