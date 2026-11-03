# Controlled transformation roadmap

**Prepared:** 2026-11-02  
**Status:** Proposed for owner approval; no implementation phase is authorized by this report.

## Planning assumptions

- The application remains a Next.js monolith unless measured needs justify a service boundary.
- Complexity estimates are rough engineering person-days for a small team: **S 1-3**, **M 4-8**, **L 9-15**, **XL 16+**. They exclude owner/legal decisions and unknown production remediation; re-estimate after Phase 0.
- Database migration work must use an isolated PostgreSQL environment and an owner-approved recovery plan.
- **Phase 1 must not begin until the owner approves the target hosting/runtime, current database state/recovery approach, entrant model, competition rules, and prioritized scope.**

## Phase 0 — Owner decisions and controlled discovery (S-M, 3-8 days)

| Work item | Dependencies | Acceptance criteria |
|---|---|---|
| Confirm production host, Node runtime, function/body limits, background-worker lifecycle, staging environments, and deployment ownership. | None | A reviewed environment matrix identifies Development, CI, Staging, and Production configuration and documents any external worker. |
| Establish database provider, migration history, current schema state, backup/PITR configuration, object storage and restore capability. | Database/operations owner access | No production data is changed; a sanitized staging copy and tested restore path are available before any migration proposal. |
| Decide entrant identity/access model, judging method, public contest rules, winner approval/publication, subscriber promise, and consent policy. | Product owner; legal review for contest terms where required | Signed-off user journey and state transitions map to current API/schema; ambiguous promises are removed or scheduled. |
| Confirm media visibility/rights, accepted audio formats/size, CDN domain, expected catalog/traffic, and whether advanced streaming is in scope. | Product/artist and operations | One supported media policy and hosting path are documented. |
| Approve ranked risk list, scope, owners, rollback criteria, and complexity estimates. | Above decisions | Written owner approval recorded before Phase 1 work begins. |

## Phase 1 — Safety and release correctness (XL, estimated 45-70 days)

**Goal:** Prevent data loss and close release-blocking runtime/security gaps before broad feature work.

| Work item | Dependencies | Acceptance criteria |
|---|---|---|
| Reconcile Prisma migration history and create a safe production migration/deploy procedure. | Phase 0 database state, backup/restore, owner approval | `prisma migrate deploy` succeeds on an empty disposable PostgreSQL database and representative staging state; no unexplained schema drift; recovery procedure is rehearsed. |
| Make demo seeding fixture-scoped and add production-target safeguards. | Migration state and owner approval | Tests prove non-fixture competitions/campaigns/submissions/subscribers/winners remain unchanged when demo data is enabled. |
| Reconcile legacy subscriber records and verify consent evidence. | Phase 0 consent policy and data-retention decision | Legacy `granted` records remain excluded until consent is reverified or safely suppressed; unsubscribe/withdrawal prevents future sends; owner approves the treatment of historical records. |
| Require real production email provider and truthful delivery status. | Hosting secret matrix; email owner | Misconfiguration prevents campaign execution; console logging is never a production fallback; provider success/failure, retries, and logs are tested without PII leakage. |
| Complete resilient song upload path for the chosen host. | Phase 0 media policy and storage config | Direct upload or verified server path handles policy maximum size; type/size constraints and quarantine scanning occur before publication; failure cleanup and CSP playback are tested. |
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

Review the findings, confirm the Phase 0 decisions and owners, then approve or revise the roadmap. Until that approval is explicit, this document is a discovery deliverable only; no Phase 1 code, migration, production configuration, or deployment work should commence.
