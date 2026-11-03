# NG Hip-Hop baseline audit

**Assessment date:** 2026-11-02  
**Repository snapshot:** `main`, commit `0c69a81`  
**Assessment type:** Source/configuration review plus local verification; discovery only

## Executive assessment

NG Hip-Hop is a feature-rich Next.js application and a credible foundation for an artist-led music and community product. It already includes public music discovery and playback, community submissions, a lyric competition, subscriber/campaign tools, and an admin dashboard. It is **not yet ready to be treated as an enterprise-grade platform**: key entry and winner-notification journeys are incomplete, migration and seed operations carry significant data risk, and serverless deployment assumptions conflict with uploads and background processing.

The clearest positive baseline is that the current application type-checks, builds, and passes its existing unit suite. Those results do not establish production readiness: the test suite is small and mostly helper-level, no browser journey suite was found, the local runtime differs from CI, and migration execution and live deployment behavior were intentionally not tested.

## Repository and product scope

- The repository snapshot contains 206 tracked files, including 40 API route files, 10 test files, four Prisma migrations, and a single GitHub Actions workflow.
- Public surfaces include the homepage, music library, lyrics competition, submission status, privacy and terms pages.
- Community functionality includes quote and graffiti submissions, lyric entries, competition subscriptions, winner display, and unsubscribe handling.
- Admin functionality includes release/content management, moderation, subscribers/campaigns, users, competitions and winners.
- The runtime is a Next.js App Router monolith: server-rendered pages, client-side React providers, Prisma/PostgreSQL, NextAuth Credentials, object storage integrations, email providers, rate limiting, and a database-backed job queue.

The root `AUDIT_REPORT.md` is ignored by Git and was treated as local historical context, not as verified current findings. Findings in this audit are tied to the current source review or commands recorded below.

## Baseline verification

Commands were run from the repository root on the local Windows environment. The local `.env` file was present but its contents were not inspected.

| Check | Result | Notes |
|---|---|---|
| `npm test` | Pass | 10 test files; 60 tests passed. |
| `npx tsc --noEmit` | Pass | No diagnostics. |
| `npm run lint` | Pass with warnings | 0 errors; 43 warnings, primarily `any`, unused values, and console statements. |
| `npm run build` | Pass | Prisma Client generated and Next.js 16.4.2 production build completed. |
| Node/npm runtime | Node 24.19.0 / npm 11.17.0 | CI uses Node 22; local and CI runtimes are not aligned. |
| Dependency audit | Not rerun locally | CI defines `npm audit --omit=dev --audit-level=moderate`; this review does not certify the current dependency tree. |
| Database migration (initial audit) | Not run | Excluded by the original discovery-only mandate; a later owner-authorized disposable local test is recorded below. |
| Live deployment / browser QA | Not run | Hosting target, deployed configuration, and rendered behavior remain unverified. |

During the production build, the application logged that Upstash Redis settings were missing and rate-limited endpoints would fail closed in production. This is safe from an abuse-control perspective but will block affected flows until production configuration is validated. The build regenerated the tracked `next-env.d.ts`; that generated-only change was restored. The source worktree was clean after verification.

## Highest-priority findings

| Priority | Finding | Business impact |
|---|---|---|
| High — repaired locally; rollout not verified | The original migration chain failed on a clean PostgreSQL database and duplicated portal-table creation across the next migration. The deployment guide also recommended `prisma migrate dev`. | Unshipped migrations were consolidated and verified on a fresh disposable PostgreSQL database; the linked development database remains untouched. Production history, backup/recovery, and rollout remain unverified. |
| High | Opt-in demo seeding can delete non-demo competition records and campaigns. | Potential irreversible loss of entrant, subscriber, winner, and campaign data. |
| High | The public entrant UI gates entry behind an admin-branded login despite no public registration journey. | Competition participation and growth may be blocked for ordinary artists. |
| High | Winner records can appear publicly without a clear publish step; the “notify” route does not establish that an email was sent. | Contest trust and promised subscriber communication are at risk. |
| High | Database-backed queue work relies on an in-process polling lifecycle; song uploads pass large multipart files through an API route. | Vercel/serverless operation may leave jobs undelivered and uploads unusable. |
| Mitigated for new signups | Public subscriber intake previously trusted caller-asserted consent/status. A separately authorized follow-up now requires email confirmation and campaign delivery filters for verified consent; legacy records need owner-approved reconciliation. | Historical consent evidence and production email configuration still require review. |
| Medium | Signed S3 playback URLs can be stored as canonical song URLs; browser CSP may not allow a custom storage/CDN host. | Tracks can stop playing after expiry or be blocked by browser policy. |
| Medium | No browser journey tests, API integration baseline, coverage gate, or restore drill is evidenced. | Regressions and recovery failures can escape CI. |

See [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md), [SECURITY_ASSESSMENT.md](./SECURITY_ASSESSMENT.md), [UX_AUDIT.md](./UX_AUDIT.md), [ARCHITECTURE_ASSESSMENT.md](./ARCHITECTURE_ASSESSMENT.md), [TESTING_BASELINE.md](./TESTING_BASELINE.md), [RISK_REGISTER.md](./RISK_REGISTER.md), and [ROADMAP.md](./ROADMAP.md) for detailed evidence and proposed sequencing.

## Scope limits and approval gate

This assessment did not read the local database file or `.env`, execute production/staging migrations, change production settings, or deploy. User experience findings are based on source and responsive/accessibility styles; no live browser review was possible. The owner has since confirmed Vercel hosting, Supabase PostgreSQL, and Supabase Storage. Production database state, proxy behavior, storage policy, scanner availability, backups, and external workers must still be confirmed by the owner/operators.

On 2026-11-03, the owner confirmed **Vercel** hosting, **Supabase** PostgreSQL, and **Supabase Storage**, and approved Phase 1 implementation. A separate local disposable migration test was authorized; no staging or production migrations, deployments, or production configuration changes are authorized. Applied production migration history and backups/recovery remain unknown. Migration repair and product work requiring approval of the public entrant model, competition rules, or notification promises remain blocked pending those decisions.

### Phase 0 disposable migration verification (2026-11-03)

Initial test evidence: `npx prisma migrate deploy` against a newly initialized loopback-only PostgreSQL 18.6 database applied the initial migration then failed at `20260819_best_lyrics_portal` with `42P01` because relation `LyricCompetition` did not exist. Review also found that the next migration re-created tables already declared in the failed migration. No Supabase database was accessed during that test.

Follow-up (2026-11-03): the owner confirmed these migrations had never been applied outside development. The unshipped portal DDL was consolidated into `20260819_best_lyrics_portal`; `20260820_create_lyric_competition` remains as an explicit no-op migration to preserve sequence identity. A fresh disposable PostgreSQL 17 run applied all four migrations, and Prisma's schema diff was empty. After separate explicit approval, all four migrations were applied to the linked development database; Prisma reports it up to date with an empty schema diff. No seed data was written. Production migration history and recovery readiness remain unverified.

## Authorized security follow-up

After review, the owner separately authorized remediation of the highest-ranked security finding only. Public subscriber intake now requires explicit consent, creates a pending record, and sends a signed, expiring confirmation link; campaign delivery requires `verified` consent. This follow-up did not execute migrations or change production configuration. Existing legacy records marked `granted` are excluded from campaigns until their consent is reconciled and reverified.
