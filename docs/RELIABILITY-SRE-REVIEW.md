# SRE Design Review: NG Hip-Hop Next.js Application

**Date:** 2026-08-15

---

## Summary of Findings by Severity

| # | Finding | Severity | Area |
|---|---------|----------|------|
| 1 | Stranded jobs in `processing` state with no watchdog recovery | **HIGH** | Queue |
| 2 | Dead-lettered moderation jobs are silently lost | **HIGH** | Moderation |
| 3 | `.catch(() => {})` swallows enqueue errors | **HIGH** | Moderation |
| 4 | In-memory SLO metrics lose data on cold start, contradict 30d window | **HIGH** | SLO |
| 5 | Queue layer has zero Sentry integration | **HIGH** | Observability |
| 6 | No per-endpoint or time-windowed SLO aggregation | MEDIUM | SLO |
| 7 | Unbounded `while(true)` concurrency in queue worker | MEDIUM | Queue |
| 8 | Silent failure on `markJobDone` / `incrementJobAttempt` DB errors | MEDIUM | Queue |
| 9 | No error budget arithmetic or burn-rate alerting | MEDIUM | SLO |
| 10 | SLO endpoint self-referentially pollutes metrics | MEDIUM | SLO |
| 11 | No user-level rate limiting, IP-only trust boundary | MEDIUM | Rate Limiting |
| 12 | No queue span/transaction in Sentry for handler duration | MEDIUM | Observability |
| 13 | Idempotency Map has no size cap | MEDIUM | Memory |
| 14 | No dead-letter alerting, purge, or retry mechanism | MEDIUM | Queue |
| 15 | Moderation retry uses fixed 5s backoff, no exponential | MEDIUM | Moderation |
| 16 | No memory pressure or event loop lag checks | MEDIUM | Queue |
| 17 | Non-null assertion on Upstash env vars | LOW | Rate Limiting |
| 18 | Percentile calculation lacks interpolation | LOW | SLO |
| 19 | `silent: true` on Sentry build config hides failures | LOW | Observability |

---

## 1. Job Queue Reliability (`lib/queue.ts` + `prisma/schema.prisma`)

### Good
- Durable persistence via Prisma `Job` model — survives cold starts
- Atomic claim via `updateMany({ where: { id, status: "pending" } })` — prevents duplicate execution
- Exponential backoff on polling (1s → 30s cap) reduces DB load when idle
- Dead-letter status exists
- `NEXT_PHASE` suppresses tick during `next build`
- `maxAttempts` is data-driven

### HIGH: No stranded job recovery

**Severity: HIGH.** If a worker crashes after `markJobProcessing` but before completing/incrementing attempts, the job stays in `processing` forever — `claimNextJob` only looks at `pending`. No watchdog exists.

**Fix**: Add `staleAfterMs` column (e.g., 5 min). A periodic sweep resets `processing` jobs older than `staleAfterMs` back to `pending`.

### HIGH: No dead-letter observability

Jobs that exhaust retries are silently dropped into `deadLetter`. No admin endpoint, no alert, no scheduled surfacing. Moderation webhooks that fail = admin never sees content needing review.

**Fix**: Expose `/api/admin/queue/dead-letters` endpoint; alert on dead-letter accumulation.

### MEDIUM: Unbounded concurrency

The `while(true)` loop drains the queue as fast as handlers return with no concurrency limit. A burst of 100 jobs processes all sequentially in one event loop tick.

**Fix**: Bound the loop (e.g., 5 jobs per tick, `Promise.all` with concurrency control); yield between batches via `setTimeout(r, 0)`.

### MEDIUM: Silent failure swallowing

`markJobDone`, `markJobProcessing`, `incrementJobAttempt` all `catch` and `console.error` only. If DB write fails after handler succeeded, job reverts to incorrect state and reprocesses (duplicate work).

**Fix**: Report queue failures to Sentry with job ID and type as context.

### MEDIUM: No job TTL or cleanup

Completed/dead-letter jobs accumulate indefinitely. Only index is `[status, createdAt]`.

**Fix**: Add `deletedAt` soft-delete or cron purging `completed`/`deadLetter` jobs older than 7 days.

### LOW: Untyped JSON payload

No schema validation on payload deserialization — corrupt `payload` throws `JSON.parse` and crashes the worker loop.

**Fix**: Add `payload_version` column; validate against Zod schema on deserialization.

---

## 2. SLO Design (`lib/slo.ts` + `app/api/slo/route.ts`)

### Good
- Three distinct SLIs (availability, latency, error rate) with numeric targets
- `/api/slo` endpoint admin-gated, returns metrics + `healthy` boolean
- `recordRequest` decoupled from collector

### HIGH: In-memory state contradicts 30d window

SLO definitions declare `window: '30d'` but `SloCollector` caps at 10k samples with no time-based eviction. On a high-traffic site, 10k samples = minutes, not 30 days. Data lost entirely on cold start.

**Fix**: Replace in-memory buffer with a time-series store (push to `request_metrics` table or external TSDB). Each record carries timestamp for windowed aggregates.

### HIGH: No time-windowed aggregation

`getMetrics()` returns a single global average — no "last 1h" or "last 7d." Cannot compute burn rates or detect spikes.

**Fix**: Implement time-windowed aggregation so you can compute burn-rate alerting thresholds.

### MEDIUM: No error budget calculation

Reports `healthy: boolean` but not error budget remaining — the core SRE signal.

**Fix**: Add `(target - current) / target` as a percentage with burn-rate thresholds.

### MEDIUM: Self-referential metrics inflation

`/api/slo` endpoint calls `recordRequest`, polluting the buffer with polling traffic.

**Fix**: Exclude internal/admin routes from metrics buffer; tag with `internal: true`.

### MEDIUM: Aggregate-only, no per-endpoint breakdown

`getMetrics()` computes global p95/p99 across all paths. Slow `/api/songs` invisible if `/api/quotes` fast.

**Fix**: Add per-path aggregation so you can alert on individual endpoint latency.

### LOW: Brittle percentile calculation

`Math.floor(durations.length * 0.95)` returns same index for p95/p99 on small datasets; no interpolation.

**Fix**: Implement `percentile(values, p)` with linear interpolation.

---

## 3. Error Handling and Sentry Integration

### Good
- Sentry initialized on server (`instrumentation.ts`) + client (`instrumentation-client.ts`)
- `onRequestError` and `onRouterTransitionStart` hooks capture App Router + client navigation errors
- Replay: 10% session sampling, 100% on-error
- `withSentryConfig` wraps Next.js config
- `app/error.tsx` + `app/global-error.tsx` capture unhandled React boundary errors

### HIGH: Queue layer is blind to Sentry

`lib/queue.ts` and `lib/moderation.ts` log only to `console.error`. Repeated handler failures, DB write failures, webhook timeouts never surface in Sentry.

**Fix**: Wrap queue worker in Sentry transaction; emit spans per job type. Report failures with `Sentry.captureException(error, { tags: { jobId, jobType, attempt } })`.

### MEDIUM: No Sentry scope enrichment

Request IDs generated + logged but never attached to Sentry events. No `setUser(...)`.

**Fix**: Create `withSentryScope` helper attaching `requestId`, `userId`, `path` to every event.

### LOW: Hardcoded `tracesSampleRate: 0.1`

No environment-aware override (e.g., `1.0` in staging).

**Fix**: `process.env.NODE_ENV === 'development' ? 1.0 : 0.1`.

### LOW: `silent: true` on `withSentryConfig`

Source map upload failures suppressed.

**Fix**: Remove `silent: true` or pipe to build-status check.

---

## 4. Rate Limiting Reliability (`lib/ratelimit.ts` + `lib/ip.ts`)

### Good
- Fail-closed by design — denies in production when Upstash not configured
- Sliding window algorithm
- Login-specific rate limit (`login:${ip}:${email}`)
- `AbortSignal.timeout` and fallback logging

### MEDIUM: IP spoofing trust boundary

`getClientIp` falls back to `x-forwarded-for` first hop, client-controlled unless hosting proxy overwrites.

**Fix**: Document trust model; list which proxy headers are trusted.

### MEDIUM: No user-level rate limiting

Rate limits are IP-keyed only. Compromised account behind NAT = unlimited submissions.

**Fix**: Add authenticated-user rate limiting: `checkRateLimit({ key: 'user:${userId}:quotes' })`.

### LOW: Non-null assertion on env vars

`new Redis({ url: redisRestUrl!, token: redisRestToken! })` — invalid instance if env vars are empty strings. Failure manifests as cryptic error on first use.

**Fix**: Validate Upstash env vars at module load with explicit type check.

### LOW: No rate limit headers

No `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` for frontend UX.

**Fix**: Return standard `X-RateLimit-*` headers.

---

## 5. Moderation Workflow Reliability (`lib/moderation.ts` + `lib/queue.ts`)

### Good
- Fire-and-forget via queue decouples from request path
- `AbortSignal.timeout(10000)` prevents hung webhooks
- Graceful fallback to `console.info` when `MODERATION_WEBHOOK_URL` unset

### HIGH: Swallowed enqueue errors

`.catch(() => {})` on `notifyAdminModeration(...)` — if DB down or Prisma throws, moderation notification lost with zero visibility.

**Fix**: Remove `.catch(() => {})` — at minimum report to Sentry.

### HIGH: Dead-lettered moderation = invisible to admins

3 retries within ~10 seconds, then job dead-lettered. No fallback channel (email, in-app, Slack).

**Fix**: Add fallback notification path (email via Resend/Postmark) or in-app notification to admins.

### MEDIUM: No exponential backoff

Fixed 5-second delay between retries. 5-minute downstream outage = all 3 retries fail.

**Fix**: `min(5000 * 2^attempt, 300000)` — up to 5 min between retries.

### LOW: No delivery confirmation

Handler checks `res.ok` only — no verification receiver processed payload.

**Fix**: Implement webhook delivery confirmation (e.g., HMAC signature verification, response payload acknowledgment).

---

## 6. Resource Cleanup and Memory Management

### Good
- SLO collector caps at 10k with FIFO eviction
- Idempotency store has 24h TTL
- Queue polling backs off to 30s when idle
- Idempotency key trimmed + validated

### MEDIUM: Idempotency store no size cap

`Map` grows without limit. Under heavy traffic, 100k+ entries with large responses = memory exhaustion before TTL eviction.

**Fix**: Add `maxEntries` cap (5,000) with LRU eviction.

### LOW: SLO collector reallocation

`slice(-10000)` allocates new array on every overflow — frequent GC pauses.

**Fix**: Replace with ring buffer or deque.

### MEDIUM: Queue memory pressure

Unbounded `while(true)` holds all in-flight state simultaneously.

**Fix**: Add event loop lag check (`process.hrtime`); if >100ms lag, yield + back off.

---

## Priority Action Plan

1. **Fix 3 HIGH priority**: stranded job recovery, dead-letter moderation visibility, queue Sentry integration
2. **Fix SLO in-memory issue** (HIGH) — implement time-series store
3. **Address dead-letter alerting + purge** (MEDIUM)
4. **Add queue Sentry spans + scope enrichment** (MEDIUM)
5. **Bound idempotency Map + queue concurrency** (MEDIUM)
6. **Implement exponential backoff for moderation** (MEDIUM)