# Testing baseline

**Assessment date:** 2026-11-02  
**Environment:** Windows; Node 24.19.0, npm 11.17.0; local `.env` present but not inspected.

## Current verification results

| Command | Result | Detail |
|---|---|---|
| `npm test` | Pass | Original audit baseline: Vitest 10 files, 60 tests passed. |
| `npx tsc --noEmit` | Pass | No diagnostics. |
| `npm run lint` | Pass with warnings | 0 errors and 43 warnings. |
| `npm run build` | Pass | Prisma Client generation and Next.js 16.4.2 production build succeeded. |
| `npm audit --omit=dev` | Findings remain | 2026-11-03: 9 advisories (4 low, 5 moderate; 0 high/critical) after non-forced compatible updates; see [SECURITY_ASSESSMENT.md](./SECURITY_ASSESSMENT.md). |
| Migration / live integration tests | Not run | No migration was executed and no live service was contacted. |

After the separately authorized consent remediation, the full suite passed with **12 files and 68 tests**; type-check and production build passed, and lint remained at **0 errors / 43 warnings**. The baseline above preserves the pre-change result for comparison.

After Phase 1 local seed, email, and upload changes, the full suite passed with **16 files and 85 tests**, and `npx tsc --noEmit` passed. Targeted ESLint reported no errors; seed console/no-explicit-any warnings remain. `npm run build` was blocked during `prisma generate` by a Windows `EPERM` rename of the generated query-engine DLL; `npx next build` using the existing generated Prisma client completed successfully. No real email, Supabase bucket, or production/staging integration was exercised.

The build emitted warnings that Upstash Redis environment values were missing, so rate-limited endpoints would fail closed in production. The build used the local `.env` without reading or recording its contents. It regenerated `next-env.d.ts`; that generated-only change was restored after the check.

## Verification after latest audit remediation (2026-11-03)

- `npm test`: **18 files / 97 tests passed** after adding PostgreSQL URL validation coverage and fixing a flaky tamper-test mutation.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with 0 errors and the existing 43 warnings.
- `npm run build`: passed; the build completed with local Upstash values absent, so rate-limited endpoints reported fail-closed behavior. No live integrations were exercised.
- `npm audit --omit=dev`: 9 advisories (4 low, 5 moderate; 0 high/critical). The non-forced `npm audit fix` did not use breaking changes.

## Phase 0 disposable migration tests (2026-11-03)

The first authorized local disposable PostgreSQL 18.6 test exposed a clean-install failure: `20260729123554_init` applied, then `20260819_best_lyrics_portal` failed with `42P01` because `LyricCompetition` did not exist. Review also found the following migration duplicated the portal tables created by the prior migration.

After the owner confirmed these migrations had never been applied outside development, the unshipped history was consolidated: `20260819_best_lyrics_portal` now creates the complete portal schema before the retained `20260820` no-op migration; the portal DDL was aligned with Prisma's declared defaults and indexes. Production deployment history remains unknown.

A fresh PostgreSQL 17 disposable database then applied all **4 migrations** successfully with `npx prisma migrate deploy`. `npx prisma migrate status` reported the database up to date, and `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --script` returned an empty migration. The linked Supabase development database was checked read-only and has no public tables; no remote migration was applied. A `migrate reset` test also applied all migrations, but Prisma Client generation afterward hit the known Windows `EPERM` rename issue; this did not affect migration execution or the clean schema-diff result.

## Existing test and CI coverage

- Vitest uses Node environment and V8 coverage reporters (`vitest.config.mts:10-23`); package scripts expose `npm test` and watch mode, but no coverage command or threshold is configured (`package.json:28-30`).
- The 10 test files cover shared API helpers, credentials, idempotency, IP handling, proxy checks, queue timing, unsubscribe, upload scanning, and admin authorization.
- CI runs typecheck, lint, tests, build, and a production-dependency audit on Node 22 (`.github/workflows/ci.yml:1-68`).
- The repository has 40 API route files. The reviewed test inventory contains no component tests, Playwright/Cypress setup, or browser tests.
- No measured coverage result was produced; reporter configuration alone does not collect coverage in the current `npm test` command.

## Gaps ranked by release risk

1. **High — Core routes and user journeys lack integration/browser verification.** Tests do not establish complete submission, subscription, moderation, campaign, upload, export/deletion, or playback behavior.
2. **High — No coverage baseline or enforced threshold.** CI cannot show whether critical security/domain code has meaningful test protection.
3. **High — No real database migration smoke test.** Migration history is suspect by static review; no disposable PostgreSQL test is wired into the local baseline or CI.
4. **Medium — Concurrency and failure behavior are weakly covered.** Submission limits, winner assignment, job retry/idempotency, storage/email failures, and provider outages need deterministic integration tests.
5. **Medium — Environment isolation may be brittle.** Some tests manipulate process environment without consistently restoring original state in `finally` blocks (`lib/__tests__/uploadScanner.test.ts:6-38`; `lib/__tests__/ip.test.ts:16-19`).
6. **Medium — Runtime parity is unproven.** Local Node 24 differs from CI Node 22. CI should remain the authoritative supported runtime until the support matrix changes.
7. **Low — Lint baseline is noisy.** 43 warnings mask regression signals; set a ratcheting cleanup plan rather than mixing unrelated lint cleanup into a release blocker.

## Proposed testing gates

- Keep a clean `npm ci` on the declared CI Node version; run typecheck, lint, tests, production build, and dependency audit on every pull request.
- Collect coverage in CI and publish a baseline. Start with **at least 80% statement and 70% branch coverage on designated critical modules** (auth, authorization, consent/subscription, upload validation, moderation, queue state transitions) after measuring feasibility; do not impose an unmeasured global threshold.
- Add isolated API/database integration tests for all critical routes. Maintain a route inventory for all 40 handlers and document exclusions.
- Use fakes for email, object storage, scanner, and queue integrations; never use production credentials or real recipients in tests.
- Add browser journeys for library playback, entrant submission/status, subscription/unsubscribe, moderation, winner publication, and admin login. Cover narrow phone and desktop viewports, keyboard navigation, validation, error/loading states, and no-results states.
- Test migration history from an empty disposable PostgreSQL database and representative staging snapshots only after owner approval and a recovery plan.
- Acceptance: three consecutive CI passes on the selected supported Node version, deterministic tests independent of ambient `.env`, and a recorded coverage report before enforcing thresholds.
