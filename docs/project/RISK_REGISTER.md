# Project risk register

**Assessment date:** 2026-11-02  
**Ranking:** Severity reflects potential impact; probability is based on repository evidence and remains conditional where production configuration is unknown.

| ID | Priority | Probability | Risk / business impact | Owner to confirm | Mitigation and verification |
|---|---|---|---|---|---|
| R-01 | High | High | Migration history may fail on a clean PostgreSQL database or diverge from deployed state, preventing safe releases or causing data loss. | Database + DevOps | Compare migration history to isolated clean/staging copies; approve forward repair/baseline; run `migrate deploy`; verify schema diff and restore. |
| R-02 | High | Medium | Demo seed cleanup can delete non-demo contests, related submissions/subscribers/winners, and campaigns. | Database + Product | Restrict cleanup to explicit fixture IDs; test with non-fixture records; prohibit demo seed on production targets. |
| R-03 | High | Medium | Recommended Vercel runtime may not sustain in-process background queue work. | DevOps/SRE | Confirm actual host and worker lifecycle; use managed worker/scheduler; demonstrate drain after scale-to-zero and monitor queue age/retries. |
| R-04 | High | High | Large song multipart upload exceeds documented Vercel request-body limit; direct presigned flow is not wired into song admin. | Streaming + DevOps | Implement constrained direct upload, finalize/scan/metadata flow; test supported maximum size on actual host. |
| R-05 | High | Medium | Entrant login directs artists to admin-only portal; public registration is absent. | Product + UX | Approve entrant identity policy; implement coherent public/authenticated flow; test a first-time entrant journey. |
| R-06 | High | Medium | Winner can be public before an explicit publish action; notification endpoint may not send email despite success wording. | Product + Backend | Define review/publish/notify state machine; verify provider acceptance, delivery result, retries, and visible status. |
| R-07 | High | Medium | Production console email fallback may log recipient/message content and mark campaigns successful without delivery. | DevOps + Backend | Require explicit production provider; fail closed; redact logs; test success and failure transitions in staging. |
| R-08 | Medium | High | Public intake can assert consent/subscription status, allowing unverified addresses into campaign eligibility. | Security + Product | Double opt-in/verification, immutable consent evidence, throttling, duplicate/withdrawal tests. |
| R-09 | Medium | Medium | S3 presigned URL lacks bound type/size and bypasses scanning; exposure depends on bucket policy. | Security + Streaming | Private quarantine, constraints, scan-before-publish, short TTL; test public access and rejected content. |
| R-10 | Medium | Medium | Stored signed playback URL may expire; custom CDN may be blocked by CSP. | Streaming + DevOps | Store durable key or public URL; align CSP; test playback, reload, seek, range responses after TTL. |
| R-11 | Medium | Medium | Contest rules, judging method, dates, and configured eligibility are inconsistent between UI and enforcement. | Product + Backend | Approve rules; publish full terms; enforce server-side; add boundary tests. |
| R-12 | Medium | Medium | Backups/restore, fleet-wide monitoring, and actionable alerting are not demonstrated in repository. | DevOps/SRE | Verify provider settings; conduct database/object restore drill; durable metrics and tested alerts; set RPO/RTO only afterward. |
| R-13 | Medium | Medium | Submission/winner concurrent operations can leave inconsistent status/counters. | Database + Backend | Transactions, constraints, concurrency tests, reconciliation metrics. |
| R-14 | Medium | Medium | CI/local runtime mismatch and limited tests leave end-to-end regressions undetected. | QA | Select supported Node version; route integration/browser tests; coverage baseline; repeatable CI gate. |
| R-15 | Medium | Conditional | IP rate limits can be bypassed if deployed proxy accepts untrusted forwarding headers. | Security + DevOps | Validate proxy chain; test spoofed headers against actual host; ensure Redis configured. |
| R-16 | Medium | Conditional | Reusable reset secret or optional Sentry replay may not match recovery/privacy expectations if mismanaged. | Security + Product | Short-lived recovery flow, alerting, telemetry consent/retention policy and staging verification. |
| R-17 | Low | High | Search, loading, and playback errors lack clear feedback; mobile player lacks progress/seek controls. | UX + Frontend | Add accessible states; validate keyboard/screen-reader/mobile behavior in browser tests. |

## Immediate risk controls

- Do not run `SEED_DEMO_DATA=true` against any database that might contain non-demo records.
- Do not run or repair production migrations until actual migration state, backup/restore, and owner-approved plan are established.
- Do not assume database-backed queue rows guarantee work will execute on serverless infrastructure.
- Do not declare campaign success until the configured provider confirms acceptance and delivery state is tracked.
- Do not provide security or availability sign-off based solely on a successful local build.

The owner should confirm hosting, database state, object storage, worker lifecycle, production email provider, and backup/restore status before approving Phase 1.

## Authorized follow-up status

R-08 was mitigated for new intake in a separately authorized follow-up: public subscriber creation now requires email confirmation and campaign delivery accepts only verified consent. Existing legacy `granted` records are intentionally excluded until the owner approves a reconfirmation/data-reconciliation plan. Other risks remain open.
