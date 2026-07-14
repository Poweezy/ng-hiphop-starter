# Backend Architecture Report — NG Hip Hop Platform
*Date: 2026-07-14*

---

## 1. API Surface Inventory

| Route | Methods | Auth | Purpose | Source |
|---|---|---|---|---|
| `/api/quotes` | GET, POST, PATCH, DELETE | Public (GET/POST); Admin (PATCH/DELETE) | CRUD for quote submissions with moderation | `app/api/quotes/route.ts:15-170` |
| `/api/songs` | GET, POST, PATCH, DELETE | Public (GET single); Admin (POST/PATCH/DELETE, admin list) | Song CRUD with file uploads, cover optimization, single-active constraint | `app/api/songs/route.ts:17-218` |
| `/api/graffiti` | GET, POST, PATCH, DELETE | Public (GET/POST); Admin (PATCH/DELETE) | Graffiti artwork submissions with image optimization + moderation | `app/api/graffiti/route.ts:18-181` |
| `/api/uploads/presign` | POST | Admin only | Generate S3 presigned upload URLs | `app/api/uploads/presign/route.ts:13-48` |
| `/api/uploads/optimize` | POST | Admin only | Optimize + scan + upload a single image | `app/api/uploads/optimize/route.ts:12-57` |
| `/api/admin/change-password` | POST | Admin only | Self-service password change | `app/api/admin/change-password/route.ts:8-48` |
| `/api/admin/reset-password` | POST | Rate-limited public (secret-gated) | Admin password reset via master secret | `app/api/admin/reset-password/route.ts:21-67` |
| `/api/slogan` | GET, POST | Public GET; Admin POST | Single-row slogan CRUD | `app/api/slogan/route.ts:6-42` |
| `/api/lyrics` | GET, POST, PATCH, DELETE | Public GET (active only); Admin write | Lyric game CRUD | `app/api/lyrics/route.ts:6-99` |
| `/api/auth/[...nextauth]` | GET, POST | Credentials | NextAuth session/JWT issuance (admin-only authorize) | `app/api/auth/[...nextauth]/route.ts:4`; `lib/auth.ts:6-47` |

**Missing standard endpoints:** No `OPTIONS` handler, no explicit CORS headers, no health-check route.

---

## 2. API Design Quality

### RESTfulness
- Routes are mostly resource-oriented (`/quotes`, `/songs`, `/graffiti`, `/lyrics`).
- **Non-standard:** DELETE endpoints accept a JSON body (`app/api/quotes/route.ts:159`, `app/api/songs/route.ts:202`, `app/api/graffiti/route.ts:167`). RFC 7231 does not forbid bodies on DELETE, but many clients/proxies drop them; IDs should be path parameters.
- **Non-standard:** PATCH is used for admin bulk state updates (approve/feature) rather than true partial-resource updates.
- **No content negotiation** — single JSON response shape.

### Status Codes & Error Envelopes
- **Inconsistent error envelopes:**
  - `{ message: '...' }` — `app/api/quotes/route.ts:56`
  - `{ error: '...' }` — `app/api/admin/change-password/route.ts:11`, `app/api/admin/reset-password/route.ts:27`
  - `{ message: '...', errors: [...] }` — `app/api/quotes/route.ts:121`
  - `{ message: 'Server error' }` — generic 500 everywhere.
- **Inconsistent 200 on DELETE:** `app/api/quotes/route.ts:163`, `app/api/songs/route.ts:213` return `200` with a message. Standard practice is `204 No Content`.

### Pagination
- Admin list endpoints implement manual offset pagination (`page`, `limit`) in `app/api/quotes/route.ts:24-26`, `app/api/songs/route.ts:25-27`, `app/api/graffiti/route.ts:25-27`.
- **Missing:** cursor-based pagination, `total` count is unbounded on large tables, no `maxLimit` cap.

### Idempotency & Safety
- **No idempotency keys** on POST endpoints (quotes, graffiti, songs). Duplicate submissions are possible on retry.
- `POST /api/songs` with `application/json` (direct S3 upload path) is idempotent only if the client deduplicates — no server-side guard (`app/api/songs/route.ts:61-83`).

---

## 3. Request Handling

### Zod Validation Coverage
- **Good:** Most write endpoints validate with Zod (`quoteSubmissionSchema`, `songUpdateSchema`, etc. in `lib/validations.ts:1-49`).
- **Gaps:**
  - `app/api/songs/route.ts:63` — JSON body fields (`title`, `fileUrl`, `coverUrl`) are destructured without Zod validation.
  - `app/api/quotes/route.ts:73-76` — manual field normalization before Zod, but `quoteUpdateSchema` does not validate `display_until` format beyond `datetime` string.
  - `app/api/lyrics/route.ts:66-68` — `lyric_text` and `correct_artist` are conditionally updated only if truthy, which silently drops empty-string updates even if the schema allows them.

### Error Sanitization
- All catch blocks log the raw error to console (`console.error`) and return `{ message: 'Server error' }`. This is safe for client exposure but **leaks internal details in server logs** without correlation IDs.
- No `requestId` or `traceId` is attached to requests or logs.

### Edge Cases
- **Missing content-type guards:** `app/api/songs/route.ts:61`, `app/api/graffiti/route.ts:69` branch on `contentType.includes('application/json')`, but `app/api/quotes/route.ts:71` calls `req.json()` unconditionally. If a client sends malformed JSON, the error is caught generically.
- **Memory risk:** Uploads read entire file into `Buffer` in memory (`app/api/songs/route.ts:112`, `app/api/graffiti/route.ts:104`, `app/api/uploads/optimize/route.ts:40`). A 50MB audio file + 5MB image = 55MB per request; no streaming/chunked handling.
- **No request size limits** enforced at the route handler level (relies on Next.js defaults).

---

## 4. Background Work & Queues

### Durability
- Jobs are persisted to SQLite via Prisma (`lib/queue.ts:32-41`) — survives cold starts.
- `lib/queue.ts:116-119` runs `setInterval(processQueue, 5000)` in Node.js only. **Not durable across process restarts beyond DB persistence.**

### Retry Logic
- `lib/queue.ts:106` — fixed 5-second backoff, no jitter.
- `maxAttempts` defaults to 3 (`lib/queue.ts:28`, `prisma/schema.prisma:90`).
- **No dead-letter queue** — jobs that exhaust retries are marked `failed` (`lib/queue.ts:86`) and silently dropped.

### Failure Modes & Concurrency
- `lib/queue.ts:15` — `processing` flag is a module-level boolean. In a multi-instance deployment, **every instance polls simultaneously**, causing thundering herd. No distributed locking.
- `lib/queue.ts:83-108` — jobs are processed serially within a single `processQueue` call, but `setInterval` can overlap if a previous run takes >5s (the `processing` guard prevents re-entry, so backlog grows).
- `lib/queue.ts:46-64` — `markJobDone`, `markJobProcessing`, `incrementJobAttempt` swallow errors with `.catch(() => {})`. DB failures on status updates are invisible.

### Moderation Queue
- `lib/moderation.ts:9-11` enqueues a task but the handler (`lib/moderation.ts:14-18`) is a `TODO` placeholder that only `console.info`s.
- **No real notification channel** — admins are not actually notified.

---

## 5. Integration Points

### S3 / Storage
- `lib/storage.ts` — dual provider: `LocalStorageProvider` (dev) and `S3StorageProvider` (prod) selected by env vars (`lib/storage.ts:153-162`).
- Presigned uploads are properly gated behind `getPresignedUploadUrl` capability check (`app/api/uploads/presign/route.ts:34-39`).
- **Bug:** `LocalStorageProvider.uploadFile` uses `contentType.split('/')[1]` but `contentType` is often undefined for Buffers, falling back to file extension — acceptable.
- **Bug:** `S3StorageProvider.deleteFile` (`lib/storage.ts:131-150`) attempts to parse signed URLs to extract keys, which is unreliable. Signed URLs contain query parameters; parsing via `pathname` may return the wrong key or fail silently.

### Upstash Rate Limiting
- `lib/ratelimit.ts` — uses `@upstash/ratelimit` sliding window.
- **Critical:** If Upstash is not configured, `checkRateLimit` returns `{ allowed: true }` (`lib/ratelimit.ts:76-78`). This means **rate limiting is effectively disabled in local/dev** and any environment missing env vars.
- Custom limiters are created per unique `(max, periodSeconds)` pair but share the same Redis connection — acceptable.

### ClamAV Scanner
- `lib/uploadScanner.ts:20-67` — raw TCP socket with **no timeout** (`lib/uploadScanner.ts:29`). A hung ClamAV daemon will block the event loop indefinitely.
- No connection pooling; a new socket per scan.
- `clamavAdapter.scan` returns `{ clean: true }` even if `reject` was called but the promise chain logic is inverted: `reject` throws, which is caught by the outer try/catch in `scanBuffer`, returning `{ clean: true }` (`lib/uploadScanner.ts:114-116`). **ClamAV detections are silently ignored!**

### Webhook Scanner
- `lib/uploadScanner.ts:69-90` — `fetch(url)` has **no timeout** and **no AbortController**.
- Non-OK responses (`!res.ok`) default to `{ clean: true }` (`lib/uploadScanner.ts:81-82`), so scanner downtime = no scans.
- No retry logic.

### External Calls
- S3 SDK calls have no explicit timeout configuration (`lib/storage.ts:99-106`, `lib/storage.ts:124-128`).
- `sharp` operations (`lib/imageOptimizer.ts:30-48`) are CPU-bound and run synchronously on the event loop; large images can block other requests.

---

## 6. Observability & SLOs

### Logging
- `lib/observability.ts:1-12` — `recordRequest` logs JSON to `console.log`. This is unstructured in practice unless captured by a log aggregator.
- **Used only in quotes** (`app/api/quotes/route.ts:37,51,67,81,96,111,141,155`). Songs, graffiti, lyrics, slogan, uploads, and admin routes do **not** call `recordRequest`.
- No request IDs, no user context, no span/trace IDs.

### Metrics
- `lib/slo.ts:1-23` defines SLO targets (availability 99.95%, p95 < 500ms, p99 < 1s, error rate < 1%).
- **SLOs are not measured or enforced anywhere.** No metric export, no alerting, no dashboard integration.

### Missing Observability
- No distributed tracing (OpenTelemetry, etc.).
- No error-rate aggregation (only per-request `recordRequest` logs).
- No latency histograms.
- No queue-depth or job-failure metrics.
- No S3 upload/download size/duration tracking.

---

## 7. Prioritized Recommendations

### P0 — Security & Correctness

| # | Finding | File:Line | Recommendation |
|---|---|---|---|
| 1 | **ClamAV detections ignored** — scanner fails open on error | `lib/uploadScanner.ts:114-116` | Make scanner fail-closed (`clean: false` on error) or surface a configurable policy. |
| 2 | **ClamAV has no timeout** — event-loop blocking | `lib/uploadScanner.ts:29` | Wrap socket in `Promise.race` with a configurable timeout (e.g., 30s). |
| 3 | **Webhook scanner has no timeout** | `lib/uploadScanner.ts:80` | Use `AbortController.timeout()` or similar. |
| 4 | **Rate limiting disabled without env vars** | `lib/ratelimit.ts:76-78` | In production, fail-closed. Add `NODE_ENV === 'production'` guard that returns `{ allowed: false }` when Upstash is missing. |
| 5 | **Admin reset secret is cached in module scope** — process-level mutable global | `app/api/admin/reset-password/route.ts:7-18` | Move to env-var comparison only, or cache in a closure with rotation support. Current `masterSecretHash` survives forever in long-running processes. |
| 6 | **S3 delete parses signed URLs unreliably** | `lib/storage.ts:131-150` | Store S3 object keys in the database alongside URLs. Never parse keys from signed URLs. |

### P1 — Reliability & Robustness

| # | Finding | File:Line | Recommendation |
|---|---|---|---|
| 7 | **Queue has no distributed lock / dead-letter queue** | `lib/queue.ts:66-113` | Add a DB-level `lockedAt` / `lockedBy` field with TTL, and a `deadLetter` status for jobs exceeding `maxAttempts`. |
| 8 | **Queue polling causes thundering herd** | `lib/queue.ts:116-119` | Replace `setInterval` with an exponential backoff or use a proper job runner (e.g., BullMQ) or cron-based trigger. |
| 9 | **Queue error swallowing** | `lib/queue.ts:47,51,63` | Log DB failures; at minimum, emit to observability. |
| 10 | **In-memory `processing` flag in queue** | `lib/queue.ts:15,67` | Use a DB advisory lock or distributed mutex for multi-instance safety. |
| 11 | **No request size limits** | All upload routes | Add `config.maxBodySize` or Next.js `bodySizeLimit` to prevent memory exhaustion. |
| 12 | **Full-file buffering in memory** | `app/api/songs/route.ts:112`, `app/api/graffiti/route.ts:104` | Stream uploads to S3/local disk instead of loading entire file into `Buffer`. |
| 13 | **DELETE with JSON body** | `app/api/quotes/route.ts:159`, `app/api/songs/route.ts:202`, `app/api/graffiti/route.ts:167` | Accept IDs as route parameters (`/api/quotes/[id]`) or query strings. |
| 14 | **No idempotency on writes** | All POST endpoints | Accept `Idempotency-Key` header and deduplicate via a unique DB constraint or Redis cache. |

### P2 — API Design & Developer Experience

| # | Finding | File:Line | Recommendation |
|---|---|---|---|
| 15 | **Inconsistent error envelopes** | Multiple routes | Standardize on `{ success, data, error: { code, message, details } }`. |
| 16 | **Partial observability** — only quotes use `recordRequest` | `app/api/songs/route.ts`, `app/api/graffiti/route.ts`, etc. | Wrap route handlers in a shared HOF or move to Next.js middleware for automatic timing + logging. |
| 17 | **SLOs defined but not instrumented** | `lib/slo.ts:1-23` | Export metrics (Prometheus, OpenTelemetry) and alert on breaches. |
| 18 | **No 204 on DELETE** | `app/api/quotes/route.ts:163`, `app/api/songs/route.ts:213` | Return `NextResponse.json(null, { status: 204 })`. |
| 19 | **No request correlation** | All handlers | Generate `X-Request-ID` at the edge or in middleware and propagate to logs + downstream calls. |
| 20 | **Admin pagination lacks limits** | `app/api/quotes/route.ts:25`, `app/api/songs/route.ts:26` | Clamp `limit` to a maximum (e.g., 100) to prevent full-table scans. |

### P3 — Code Hygiene

| # | Finding | File:Line | Recommendation |
|---|---|---|---|
| 21 | **Duplicate auth config** — `lib/auth.ts` and `app/api/auth/[...nextauth]/options.ts` are identical | `lib/auth.ts:1-49`, `app/api/auth/[...nextauth]/options.ts:1-50` | Consolidate to a single exported `authOptions` to avoid drift. |
| 22 | **Inconsistent `NextRequest` typing** | `app/api/slogan/route.ts:6`, `app/api/lyrics/route.ts:6` | Use `NextRequest` for all App Router route handlers. |
| 23 | **TODO in production code** | `lib/moderation.ts:16` | Replace placeholder with actual notification (email, webhook, or push) or remove the queue entirely. |

---

*End of report.*
