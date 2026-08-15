# NG Hip-Hop — Consolidated Design Review Executive Summary

**Date:** 2026-08-15  
**Scope:** Full-stack design review of the NG Hip-Hop Next.js application  
**Method:** 9 specialized AI agents executed parallel design reviews across security, reliability, accessibility, narrative, cultural, and discoverability domains.

---

## Reports Produced

| # | Domain | Agent | Report |
|---|--------|-------|--------|
| 1 | Application Security (Auth, AuthZ, Input Validation, CSRF, Idempotency, Sessions) | `security-appsec-engineer` | `docs/SECURITY-APPSEC-REVIEW.md` |
| 2 | SecOps (Headers, Secrets, File Uploads, Cookies, Error Handling) | `security-senior-secops` | `docs/SECURITY-OPS-REVIEW.md` |
| 3 | Cloud Security (Storage, S3, Supabase, Image Optimization, IAM) | `security-cloud-security-architect` | `docs/SECURITY-CLOUD-REVIEW.md` |
| 4 | Reliability / SRE (Queue, SLOs, Observability, Rate Limiting, Moderation) | `engineering-sre` | `docs/RELIABILITY-SRE-REVIEW.md` |
| 5 | Accessibility (WCAG 2.1 AA — all components, pages, admin) | `testing-accessibility-auditor` | `docs/ACCESSIBILITY-AUDIT.md` |
| 6 | Narrative Design (Storytelling, Voice, Pacing, Brand) | `academic-narratologist` | `docs/NARRATIVE-DESIGN-REVIEW.md` |
| 7 | Cultural Intelligence (Representation, Inclusion, Language, Appropriation) | `specialized-cultural-intelligence-strategist` | `docs/CULTURAL-INTELLIGENCE-REVIEW.md` |
| 8 | SEO & Discoverability (robots.txt, sitemap, structured data, Core Web Vitals) | `marketing-aeo-foundations` | `docs/SEO-SEO-DISCOVERABILITY-REVIEW.md` |
| 9 | Agentic Search & Task Completion (WebMCP, flow analysis, API usability) | `marketing-agentic-search-optimizer` | `docs/AGENTIC-SEARCH-AUDIT.md` |

---

## Consolidated Critical/High Findings

| # | Finding | Domain | Severity | Key File |
|---|---------|--------|----------|----------|
| 1 | **`.env` on disk + in git history** with production secrets (DB password, admin password, API tokens) | SecOps | **CRITICAL** | `.env` (all commits) |
| 2 | **Presigned S3 uploads bypass virus scanning** entirely | Cloud Security | **HIGH** | `lib/storage.ts`, `uploadScanner.ts` |
| 3 | **Stranded jobs** in `processing` state — no watchdog recovery after worker crash | SRE | **HIGH** | `lib/queue.ts` |
| 4 | **Dead-lettered moderation jobs silently lost** — admin never notified | SRE | **HIGH** | `lib/moderation.ts`, `queue.ts` |
| 5 | **`.catch(() => {})` swallows enqueue errors** — moderation system failures invisible | SRE | **HIGH** | `app/api/quotes/route.ts:111` |
| 6 | **In-memory SLO metrics** lose all data on cold start; contradict declared 30-day window | SRE | **HIGH** | `lib/slo.ts` |
| 7 | **Queue layer has zero Sentry integration** — background failures invisible | SRE | **HIGH** | `lib/queue.ts`, `queue.ts` |
| 8 | **`user/export` leaks ALL active lyrics** to any authenticated user (should scope to submitter) | AppSec | **HIGH** | `app/api/user/export/route.ts:35` |
| 9 | **Single shared `ADMIN_RESET_SECRET`** — global admin password reset, no MFA | AppSec | **HIGH** | `app/api/admin/reset-password` |
| 10 | **Missing Zod validation** on admin JSON endpoints (users PATCH, winner POST, reset-password) | AppSec | **HIGH** | All admin routes |
| 11 | **No robots.txt, no sitemap.xml** — site invisible to search engines and AI crawlers | SEO | **CRITICAL** | `public/`, `app/sitemap.ts` |
| 12 | **SplashScreen blocks LCP for 2200ms** on every navigation — destroys Core Web Vitals | SEO / Agentic | **CRITICAL** | `components/SplashScreen.tsx` |
| 13 | **No WebMCP markup** — AI agents cannot discover or initiate public forms | Agentic | **HIGH** | All form components |
| 14 | **`/api/lyrics` POST requires admin auth** while UI is public — lyric submission broken | Agentic | **HIGH** | `app/api/lyrics`, `LyricGame.tsx` |
| 15 | **Modals lack focus traps + dialog ARIA** (5 instances) — keyboard/screen reader trap risk | Accessibility | **CRITICAL** | `GraffitiShowcase.tsx`, `LyricGame.tsx`, `SongsPanel.tsx`, `CompetitionsPanel.tsx`, `ConfirmDialog.tsx` |
| 16 | **Low contrast text** (`rgba(255,255,255,0.3)` / `0.4` on black) — fails WCAG AA | Accessibility | **SERIOUS** | CommunityQuote, GraffitiShowcase, LyricGame |
| 17 | **No narrative spine** — feature catalog with no story arc; "Nerd Gauge" brand absent from UI | Narrative | **HIGH** | All pages |
| 18 | **American artist monoculture** in LyricGame + seeds; no siSwati/i18n despite SEO targeting African markets | Cultural | **HIGH** | `LyricGame.tsx`, `seed.ts`, `layout.tsx` |
| 19 | **7-day default presigned URL TTL** — excessive exposure window | Cloud Security | **HIGH** | `lib/storage.ts:160` |
| 20 | **No server-side encryption** on S3 uploads | Cloud Security | **HIGH** | `lib/storage.ts` |

---

## Consolidated P0 Action Plan (Immediate — Fix Before Next Deployment)

### Security (Secrets + Auth)
1. **Rotate ALL secrets** in `.env` immediately (DB password, admin password, API tokens, Supabase keys) — treat as compromised
2. **Purge `.env` from git history** using `git filter-repo` or BFG — non-recoverable for DB password + Supabase service role key
3. **Remove `SUPABASE_SECRET_KEY`** — keep only `SUPABASE_SERVICE_ROLE_KEY` server-side
4. **Replace shared `ADMIN_RESET_SECRET`** with per-admin, short-lived single-use tokens (1-hour expiry, hashed in DB, emailed to admin)
5. **Add Zod validation** to all admin JSON endpoints (`admin/users PATCH`, `winner POST`, `reset-password`, `change-password`)
6. **Fix `user/export`** — filter lyrics by submitting user's identity or add `submitted_by` field to `LyricGame` model
7. **Remove `trustHost: true`** from NextAuth config

### Reliability (Queue + Moderation)
8. **Add stale-job recovery** — `staleAfterMs` column + periodic sweep resetting `processing` → `pending`
9. **Wire queue + moderation into Sentry** — replace `console.error` with `Sentry.captureException` in `lib/queue.ts` and `lib/moderation.ts`
10. **Fix moderation enqueue error swallowing** — remove `.catch(() => {})`, report failures to Sentry
11. **Replace in-memory SLO store** with time-series persistence (DB table or external TSDB); implement windowed aggregation + error budget arithmetic

### SEO / Core Web Vitals
12. **Create `public/robots.txt`** with AI crawler allowances + `/admin/` and `/api/` disallow
13. **Create `app/sitemap.ts`** with static + dynamic URLs
14. **Reduce SplashScreen delay** from 2200ms → ≤600ms; remove scroll-locking

### Accessibility
15. **Build shared `Modal` component** with focus trap, `role="dialog"`, `aria-modal`, Escape handling, focus-return — replace all inline modals
16. **Add `aria-current="page"`** to active admin nav button + h1 to AdminDashboard

### Discoverability
17. **Add JSON-LD schema.org markup** — Organization + WebSite on layout, MusicRecording on library, Quotation on quotes
18. **Create `public/llms.txt`** — site structure summary for AI ingestion

---

## Consolidated P1 Action Plan (Short Term — Next Sprint)

### Security (Defense in Depth)
- Add `maxAge` to session cookie (match 8h JWT TTL)
- Reduce S3 presigned TTL to 1 hour + add content-type binding
- Add magic-number / file-signature validation before image optimization
- Add `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers
- Add `block-all-mixed-content` to CSP
- Tighten Next.js image `remotePatterns` — remove wildcard S3 hostnames

### Reliability (Operational Excellence)
- Add dead-letter alerting + admin endpoint (`/api/admin/queue/dead-letters`)
- Add exponential backoff to moderation retries (`min(5000 * 2^attempt, 300000)`)
- Add `maxEntries` cap + LRU eviction to idempotency store
- Add rate limiting to `user/export` (10/min) and `user/delete` (3/min)
- Add `payload_version` + Zod validation on queue payload deserialization

### Narrative / Cultural
- Make "NERD GAUGE" visible in Hero component
- Replace placeholder seed content (Google alarm sound, self-aware descriptions) with world-appropriate copy
- Replace American artist monoculture in LyricGame with African/underground artists
- Add siSwati (`ss`) + English (`en`) language scaffolding via `next-intl`

### Accessibility
- Add `role="status" aria-live="polite"` to all form status messages
- Fix all low-contrast text tokens (`rgba(0.3)` → `rgba(0.55)`)
- Add `role="alert"` to ErrorBoundary
- Disable JS-driven 3D tilt under `prefers-reduced-motion`

### SEO / AEO
- Add `alternates.canonical` to root layout metadata
- Migrate font loading from `@import` to `next/font/google`
- Add page-specific `metadata` export to `app/page.tsx`
- Create `app/llms-full.txt` with full page content in Markdown
- Add `noindex` to `/admin/login`

### Agentic / Task Completion
- Add declarative WebMCP attributes (`data-mcp-action`, `data-mcp-description`, `data-mcp-params`) to all 4 public forms
- Add "Subscribe" / "Play" button to MusicLibrary track cards if interactive; else confirm static
- Add `aria-label` on external links ("Spotify (opens in new tab)")
- Return JSON error responses from middleware (not plain text)

---

## Consolidated P2 Action Plan (Ongoing — Within 30 Days)

### Security
- Move idempotency store to Redis (Upstash) for multi-instance correctness
- Add `X-Requested-With` header validation as CSRF defense-in-depth
- Add `SameSite: strict` for admin session cookie
- Implement S3 Event Notifications → Lambda for post-upload scanning
- Add `scan_clean` / `scan_result` to `Song` model for audio file scanning
- Add ownership model (`ownerId` FK) to Song, GraffitiSubmission, QuoteSubmission
- Scope IAM permissions to specific S3 prefix (no `s3:*`)

### Reliability
- Replace `slice(-10000)` in SLO collector with ring buffer
- Add event loop lag / memory pressure checks in queue worker
- Make `tracesSampleRate` environment-aware (1.0 in staging)
- Add `X-RateLimit-*` response headers

### Narrative
- Restructure homepage: Hero → Manifesto → Release → Community(quotes+graffiti) → Game → Competition
- Tie LyricGame to current release + competition entry
- Reframe CompetitionBanner as climax payoff, not ad insert
- Implement auto-rotation of featured quotes
- Create verbal style guide (3 voice registers: Elevated / Street / Instructional)

### Cultural
- Add genre/style tags to submissions (kwaito-rap, Soweto drill, conscious rap)
- Add `rejection_reason` field to moderation workflow
- Publish culturally specific community guidelines + values statement
- Add graffiti legal disclaimer modal
- Add anti-hate moderation policy to Terms

### SEO
- Add `hreflang` to root layout
- Add internal contextual links + breadcrumbs
- Create dynamic song pages (`/songs/[id]`) with MusicRecording schema
- Add FAQPage schema + `/faq` page
- Verify/generate OG + Twitter image assets

### Agentic
- Publish `/mcp-actions.json` endpoint
- Add `AGENTS.md` documenting public vs. admin endpoints + payloads
- Add `GET /api/docs` returning OpenAPI 3.0 spec for public endpoints
- Add route segments to admin panel (`/admin/songs`, `/admin/quotes`)

---

## Risk Summary

| Risk Level | Count | Immediate Action Required |
|-----------|-------|---------------------------|
| **CRITICAL** | 3 | Rotate ALL secrets + purge git history; create robots.txt + sitemap; fix SplashScreen delay |
| **HIGH** | 11 | Presigned URL scanning bypass; stranded jobs; dead-letter moderation; in-memory SLO; user/export data leak; shared reset secret; missing Zod on admin endpoints; 7-day presigned TTL; no S3 encryption; no WebMCP markup; broken lyric submission; no narrative spine; American artist monoculture |
| **MEDIUM** | 25 | (details in individual reports) |
| **LOW** | 14 | (details in individual reports) |

---

## What the App Does Well (Cross-Domain)

- **Security foundation**: Prisma ORM (no SQLi), bcrypt cost 12, fail-closed rate limiting, CSRF Origin check, path traversal prevention, fail-closed virus scanning
- **Reliability foundation**: Durable Prisma job queue, build-phase suppression, atomic job claiming, JWT token versioning for session revocation
- **Frontend quality**: Semantic HTML, skip links, focus-visible styles, `prefers-reduced-motion` support, consent-gated analytics, Sentry on client+server
- **Architecture quality**: Provider abstraction (storage), centralized `requireAdmin()` helper, unified `errorResponse` utility, Zod validation library, idempotency pattern on submissions

The platform's engineering foundation is **above average**. The gaps identified are **incremental hardening and missing infrastructure**, not architectural flaws — with the exception of secrets-in-git (CRITICAL) and the broken lyric submission flow (HIGH).
