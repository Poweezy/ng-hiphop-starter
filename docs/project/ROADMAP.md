# Controlled transformation roadmap

**Prepared:** 2026-11-02  
**Status:** Phase 1 authorized on 2026-11-03 for implementation work. The owner prohibits staging/production migrations and deployments; no production configuration changes are authorized.

## Owner decisions recorded (2026-11-03)

- **Hosting target:** Vercel.
- **Database provider:** Supabase (interpreting “superbase” in the owner response as Supabase).
- **Object storage:** Supabase Storage.
- **Migration authorization:** Local disposable PostgreSQL migration tests and local edits to migrations confirmed unshipped are authorized. No staging or production migrations are authorized.
- **Migration repair (2026-11-03):** Owner confirmed the checked-in migrations had never been applied outside development. The portal schema was consolidated into `20260819_best_lyrics_portal`, with `20260820_create_lyric_competition` retained as a no-op sequence marker. All four migrations applied to a disposable PostgreSQL 17 database; Prisma schema diff was empty. Linked development database had zero public tables and was not migrated. Production state remains unverified.
- **Current production migration state, backup/restore readiness, and external worker:** Not confirmed.
- **External worker:** Unknown / not confirmed.
- **Entrant access, judging, and winner publication policy:** Unknown / owner decision pending.
- **Phase approval:** Phase 1 implementation approved. This does not authorize staging/production migrations, deployments, or production configuration changes. Migration repair remains blocked pending deployed-state and recovery information.

These decisions narrow the validation target but do not establish access to, or the state of, any live environment. Do not request or record production credentials in these documents.

## Planning assumptions

- The application remains a Next.js monolith unless measured needs justify a service boundary.
- Complexity estimates are rough engineering person-days for a small team: **S 1-3**, **M 4-8**, **L 9-15**, **XL 16+**. They exclude owner/legal decisions and unknown production remediation; re-estimate after Phase 0.
- Database migration work must use an isolated PostgreSQL environment and an owner-approved recovery plan.
- Migration repair requires confirmed deployed-state and recovery evidence. Entrant-facing behavior changes require the pending product decisions; other approved safety work can proceed without those decisions.

## Phase 0 — Owner decisions and controlled discovery (S-M, 3-8 days)

| Work item | Dependencies | Acceptance criteria |
|---|---|---|
| Confirmed: Vercel, Supabase PostgreSQL, and Supabase Storage. Still verify Node runtime, function/body limits, staging ownership, and whether an external worker exists. | Owner confirmation recorded; operator/environment evidence | A reviewed environment matrix identifies Development, CI, Staging, and Production configuration and documents any external worker. |
| Establish the deployed Supabase PostgreSQL migration history, backup/PITR configuration, and restore capability; validate the repaired history in representative staging. | Database/operations owner access; production migrations remain unauthorized | Production state is recorded read-only; a sanitized staging copy and tested restore path are available before any production migration proposal. |
| Decide entrant identity/access model, judging method, public contest rules, and winner approval/publication. | Product owner; legal review for contest terms where required | Signed-off user journey and state transitions map to current API/schema; ambiguous promises are removed or scheduled. |
| Confirm media visibility/rights, accepted audio formats/size, CDN domain, expected catalog/traffic, and whether advanced streaming is in scope. | Product/artist and operations | One supported media policy and hosting path are documented. |
| Approve ranked risk list, scope, owners, rollback criteria, and complexity estimates. | Above decisions | Phase 1 implementation approved on 2026-11-03; open product and operational decisions remain tracked above. |

## Phase 1 — Safety and release correctness (XL, estimated 45-70 days)

**Goal:** Prevent data loss and close release-blocking runtime/security gaps before broad feature work.

| Work item | Dependencies | Acceptance criteria |
|---|---|---|
| **Repaired locally:** Consolidate unshipped Prisma history and use a safe production migration/deploy procedure. | Production state, backup/restore verification, owner approval for any remote migration | `prisma migrate deploy` succeeds on an empty disposable PostgreSQL database and produces no Prisma schema diff; complete representative staging validation and rehearse recovery before production. |
| **Completed locally:** Make demo seeding fixture-scoped and add production-target safeguards. | Phase 1 approval | Focused tests verify the fixed fixture scope and production rejection; admin campaigns are no longer targeted. No live/staging seed was run. |
| Reconcile legacy subscriber records and verify consent evidence. | Phase 0 consent policy and data-retention decision | Legacy `granted` records remain excluded until consent is reverified or safely suppressed; unsubscribe/withdrawal prevents future sends; owner approves the treatment of historical records. |
| **Implemented locally:** Require real production email provider and truthful delivery status. | Hosting secret matrix; email owner | Production requires SendGrid and an explicit sender; no console fallback. Configuration tests pass, but provider delivery/retries and production secrets are not verified. |
| **Implemented locally:** Complete resilient song upload path for Vercel/Supabase Storage. | Phase 0 media policy and storage config | Direct uploads use a private quarantine bucket; server size checks, malware scanning, image optimization, and cleanup precede song publication. Storage and finalize-route tests pass; nonproduction bucket/CORS integration and playback CSP remain to verify. |
| Select a supported job worker lifecycle and make queue outcomes observable. | Confirmed host and campaign contract | Staging jobs drain through cold starts/scale-to-zero; retries are idempotent; age/failure/dead-letter signals are visible. |
| Address remaining high-severity security/release gaps approved by owner. | Security assessment; Phase 0 | Regression tests cover proxy trust, presigned upload restrictions, recovery flow, telemetry consent policy, and CSP as applicable. |

**Phase 1 exit gate:** No unresolved High risk without explicit owner acceptance; database restore and migration drill passed; core upload/email/queue paths work in staging; security and QA approve.

## Phase 2 — Reliability, observability, and test controls (L-XL, 20-40 days)

**Dependencies:** Phase 1 exit gate; selected production architecture.

| Work item | Acceptance criteria |
|---|---|
| Add critical route/database integration tests and browser journeys. | Critical API behaviors and all core listener/entrant/admin journeys execute deterministically in CI using test services/fakes. |
| Establish coverage reporting and targeted thresholds. | CI publishes baseline; critical modules meet approved statement/branch targets; no unmeasured global threshold is introduced. |
| Add durable, fleet-wide telemetry and health checks. | Liveness/readiness semantics are documented; latency/error/queue alerts reach a tested owner; SLO windows persist across restarts and instances. |
| Verify backup/restore and object lifecycle controls. | Database and object restore drill is recorded; owners, retention, RPO/RTO, access controls, and recovery steps are explicit. |
| Align configuration, supported database docs, and runtime parity. | Local, CI, staging, and production use a documented database/runtime matrix; `npm ci` and dependency/security checks are reproducible. |
| Reduce lint noise and enforce safe baselines. | Warning count is recorded and ratcheted down; new warnings fail or are explicitly waived. |

## Phase 3 — Trustworthy product journeys and UX (L-XL, 25-45 days)

**Dependencies:** Phase 0 product decisions; stable Phase 1 contracts; Phase 2 test coverage for touched flows.

| Work item | Acceptance criteria |
|---|---|
| Deliver approved entrant journey and private submission tracking/correction path. | First-time entrant can understand access, submit, receive a secure reference, check status, and follow approved correction/appeal rules. |
| Align competition publication, eligibility, schedule, and judging behavior. | Published rules match validation and server-side enforcement; schedule boundaries and configured eligibility are tested. |
| Add moderated winner publication and truthful subscriber notification flow. | Pending winners are not public; explicit publish approval is audited; notification state reflects provider result/retries and is visible to admins. |
| Improve library, loading, empty, search, and playback recovery states. | No-results/outage/loading/errors are distinct and accessible; queue labels match behavior; supported browser playback and retry are verified. |
| Standardize signup consent and preference lifecycle. | All signup surfaces capture approved consent consistently; re-subscription, unsubscribe, and suppression behavior is defined and tested. |
| Run cross-device accessibility/usability pass. | Keyboard and screen-reader core flows pass; mobile/tablet/desktop browser checks meet agreed WCAG target and have no critical usability blocker. |

## Phase 4 — Enterprise capabilities (scope-driven, XL+)

**Dependencies:** Product strategy, privacy/legal review, scale evidence, and success metrics from earlier phases.

Candidate investments:

- Artist profiles, self-service catalog/release management, and artist analytics.
- Least-privilege roles (moderator/editor/marketing/admin), broad audit trail, reviewer assignment, and escalation.
- Per-track rights evidence, territory/takedown lifecycle, and durable media operations.
- Advanced discovery, catalog scale/search, reliable playback queue, and media transcoding/adaptive delivery only where measured needs justify it.
- Community reputation, moderation policy tooling, fraud/abuse analytics, and scalable campaign preferences.
- Monetization, payments, licensing, or multi-tenant operations only after explicit product approval.

**Acceptance:** Each capability requires a separate product/security/architecture decision, success metric, data-retention/privacy review, and phased rollout/rollback criteria. None is assumed to be required by the current audit.

## Approval request

Phase 1 implementation is approved within the recorded constraints. This approval does not authorize staging/production migrations, deployments, or production configuration changes. Review and resolve the remaining Phase 0 product and operational decisions before work that depends on them.
