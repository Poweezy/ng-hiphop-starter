# Architecture assessment

**Assessment date:** 2026-11-02  
**System boundary:** Repository implementation and deployment documentation. The owner confirmed Vercel hosting, Supabase as the database provider, and Supabase Storage on 2026-11-03; live settings and separately operated services remain unverified.

## Current architecture

NG Hip-Hop is a conventional Next.js App Router monolith. Public pages use server-side data access and revalidation; API Route Handlers implement admin, content, competition, upload, subscriber, and user operations. Shared libraries provide Prisma access, authentication, validation, storage, email, rate limiting, queueing, and observability.

### Main runtime flows

- **Web/API:** Root layout composes NextAuth and audio providers (`app/layout.tsx`); pages render public content; route handlers call Prisma and integrations. Common response and admin wrappers exist (`lib/api.ts`; `app/api/_lib/withAdmin.ts`), though route patterns are not fully uniform.
- **Authentication:** NextAuth Credentials uses an admin user/password model, bcrypt, JWT sessions, token version, and admin role checks (`lib/auth.ts`, `lib/credentials.ts`). There is no documented public registration flow.
- **Data:** Prisma schema targets PostgreSQL (`prisma/schema.prisma:8-10`). Four migration folders are checked in. The schema covers users, songs, submissions, competitions, subscribers, campaigns, jobs, winners, and moderation.
- **Audio:** The homepage and library render native `<audio>` pointed at stored `file_url`; `lib/audioContext.tsx` coordinates inline and headless playback and exposes Media Session actions. No transcoding, HLS/DASH manifest, application media proxy, or playback authorization flow is evidenced.
- **Media storage:** Provider abstraction supports local development, S3, and Supabase. Admin song uploads now use signed direct uploads into private quarantine storage, then server-side size checks, malware scanning, optimization, and promotion to public media storage. Provider and finalize-route tests pass, but the code path has not been exercised against the owner's Supabase project. Signed GET URLs can still be stored rather than resolved from durable object keys at playback time.
- **Email and jobs:** Email providers include console and SendGrid. Campaign work is persisted in the database, but polling/recovery runs in process-local timers (`lib/queue.ts`); no external worker/scheduler deployment is defined in this repository.
- **Deployment:** The owner confirmed Vercel as the hosting target, Supabase as the database provider, and Supabase Storage. The original clean-install migration failure and duplicate portal DDL were repaired in the unshipped migration history and verified against a disposable PostgreSQL 17 database. The linked Supabase development database now has all four migrations applied and an empty Prisma schema diff; it contains no seed data. Production migration state, worker, backup setup, and deployed values remain unverified.

## Strengths

- A clear, single-repository monolith is understandable for the current product scale.
- Prisma/PostgreSQL, environment validation, shared rate limiting, upload scanning hooks, error tracking hooks, and an existing CI quality workflow provide useful foundations.
- Native audio controls and browser Media Session integration avoid unnecessary custom playback primitives.
- Storage-provider abstraction and database-backed job records create seams for an eventual service/worker split.
- Existing moderation history and token-version invalidation address meaningful domain/security needs.

## Ranked architecture risks

| Priority | Risk | Evidence and impact | Recommendation |
|---|---|---|---|
| High — repaired locally; deployment state unverified | Original migration chain failed on an empty database and duplicated portal DDL; deployment instructions used a development command. | A fresh disposable PostgreSQL 17 database applies the consolidated history and produces no Prisma schema diff. Production history and restore readiness remain unverified. | Use `prisma migrate deploy` for releases; inspect deployed migration history and backup/restore readiness before any remote migration. |
| High | Serverless target conflicts with long-lived queue polling and large upload requests. | Queue timers run in-process; song upload allows 50 MB while deployment guide documents a 4.5 MB Vercel request cap. | Select actual runtime. Use a managed queue or explicit worker lifecycle; direct upload to object storage with server finalize/scan. |
| High | Email provider can report success when only logging. | Provider selection can use console and the console provider returns after logging; campaign workflows rely on provider result. | Fail production startup or sending when provider is missing/misconfigured; make delivery state observable. |
| High | Product workflow requirements are not reflected consistently in domain/API/UI. | Entrant auth, contest dates/rules, judging method, winner publication, and notification behavior diverge. | Resolve domain decisions before schema expansion; define explicit states and cross-layer contract tests. |
| Medium | Durable song addressing is ambiguous. | S3 can return a signed URL with 24-hour default TTL; `file_url` is persisted and rendered directly. | Store object key plus media visibility; resolve renewable signed playback URLs or a durable public CDN URL; test byte ranges and CSP. |
| Medium | Data invariants live mostly in API code. | Free-form status/role strings, separate writes for submission/winner workflows, and some missing actor relations. | Add transactions, constraints, typed domain states, and concurrency tests as data is reconciled. |
| Medium | Deployment/environment assumptions conflict. | PostgreSQL schema versus SQLite guide; Vercel config versus long-running worker model. | Remove unsupported database guidance, publish one supported runtime/configuration matrix, and validate it in staging. |
| Medium | Observability is not fleet-wide or durable by repository evidence. | SLO collector uses process memory and persistence stub; no health route or deployment alert workflow is evidenced. | Define durable metrics, liveness/readiness semantics, alerts, and error budgets. |

## Audio design assessment

The present player is suitable for a small catalog of public releases when files are browser-compatible and served from durable, correctly configured storage/CDN. It is not a full streaming service: there is no adaptive bitrate/transcoding pipeline, catalog rights lifecycle, protected media entitlement, or robust queue/error state. Do not introduce HLS or a separate media microservice without measured scale/compatibility needs. First stabilize upload, durable URL, browser/CSP, supported-format, and takedown behavior.

## Architecture decisions needed from the owner

1. Verify the Vercel runtime/limits, staging environment, and whether a worker exists outside this repository.
2. Read-only confirmation of the Supabase PostgreSQL migration history and backup/PITR state. A clean local database test is authorized and has confirmed the migration-order failure; no repair or production migration is authorized.
3. Decide whether media is intentionally public, whether CDN URLs are canonical, and what audio formats/sizes are accepted.
4. Decide whether lyric entries are public or account-based, the judging method, eligibility rules, and winner publication/notification states.
5. Confirm whether multi-artist profiles, role-based admin teams, paid access, or licensing are within product scope.

No architecture replacement is recommended before these decisions and Phase 1 safety work are approved.
