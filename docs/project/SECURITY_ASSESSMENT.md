# Security assessment

**Assessment date:** 2026-11-02  
**Scope:** Source-level security and control review; no exploit reproduction or live deployment testing.

## Executive summary

The codebase has useful baseline controls: admin authorization helpers, bcrypt credential verification, token-version session invalidation, origin checks on mutations, security headers, production fail-closed rate limiting, validation schemas, upload scanning hooks, and signed unsubscribe links.

One confirmed public-input vulnerability was identified: an unauthenticated subscriber endpoint accepts caller-asserted consent/subscription state and can make other people's addresses campaign-eligible. Additional control gaps affect presigned uploads, proxy-derived rate-limit identity, password recovery, optional telemetry consent, and public-page CSP. Severity of conditional items depends on actual configuration; this assessment does not establish that any production secret, proxy, storage bucket, or monitoring service is exposed.

No dependency vulnerability scan was rerun for this assessment. CI config includes a production dependency audit; its current result is not certified here.

## Findings ranked by severity and business impact

| ID | Severity | Confidence | Finding and evidence | Business impact |
|---|---|---:|---|---|
| S1 | Medium | 9/10 | Public `POST /api/subscribers` accepts caller-supplied consent and subscription statuses without authentication, ownership verification, or route-level throttling. `app/api/subscribers/route.ts:58-95`; defaults in `lib/validations.ts:125-132` and `prisma/schema.prisma:209-210`; campaign eligibility in `lib/email/campaign-service.ts:59-95,140-153`. | Unverified recipients can become eligible for campaign email, leading to abuse, complaints, and unreliable consent records. |
| S2 | Medium (conditional) | High | Presigned S3 URL signs only bucket/key; content type/size are not bound, scanner/optimizer are bypassed, and default TTL is 86,400 seconds. Endpoint is admin-gated. `app/api/uploads/presign/route.ts:23-62`; `lib/storage.ts:142-149,207-216`. | A URL holder can upload outside validated/scanned paths; cost and public-serving impact depend on bucket/CDN policy. |
| S3 | Medium (conditional) | Medium | `getClientIp` trusts `x-real-ip` before the trusted-proxy logic and can use the first XFF value when no trusted proxies are configured. `lib/ip.ts:46-57`. | If the edge does not overwrite/validate these headers, IP-keyed rate limits can be evaded. |
| S4 | Medium (conditional) | High | Password reset uses an unauthenticated, reusable deployment-wide master secret; it is rate-limited and compared in constant time. `app/api/admin/reset-password/route.ts:14-66`. | A compromised/mishandled reset secret can enable admin password replacement; exposure itself was not established. |
| S5 | Medium (conditional) | High | Client Sentry initialization and replay sampling do not consult the site's analytics consent state. `instrumentation-client.ts:6-10`; analytics consent gating in `components/ConsentAwareAnalytics.tsx:15-22`. | Optional telemetry may not match the user's expressed preference; effect depends on DSN, SDK configuration, and applicable policy. |
| S6 | Low | High | Public-route CSP allows `'unsafe-inline'` scripts, unlike the nonce-based admin policy. `proxy.ts:37-45`. | Defense in depth is weaker if script injection is introduced; this is not evidence of an XSS vulnerability. |

The dedicated security review classified S1 as a confirmed data-integrity/consent issue, not as proof of campaign delivery abuse in a deployed environment. The security-lead review treated S2-S6 as control gaps or conditional risks, not demonstrated exploitation.

## Existing controls to preserve

- Admin role checks and common admin route wrappers are present in `app/api/_lib/` and `lib/auth.ts`.
- Password verification, session limits, and token-version invalidation are implemented in `lib/credentials.ts` and `lib/auth.ts`.
- Mutation origin checks and CSP construction are centralized in `proxy.ts`; security headers are also configured in `next.config.js`.
- Rate-limited operations fail closed in production when Upstash settings are absent (`lib/ratelimit.ts`).
- Application-mediated uploads use allowlists, size checks, scanning hooks, and image processing (`app/api/graffiti/`, `app/api/songs/`, `lib/uploadScanner.ts`).
- Unsubscribe links use signed, expiring tokens (`lib/email/unsubscribe.ts`).

## Prioritized remediation and release acceptance

1. **Marketing intake:** public submissions must not set trusted consent/status. Use verified opt-in; record verification timestamp, source, and consent text/version. Ensure unverified rows cannot receive campaigns. Add abuse throttling and regression tests for repeated submissions and analytics.
2. **Presigned media:** constrain content type, size, key prefix, and expiry; use private quarantine; scan/validate server-side before publication. Test that rejected objects cannot become publicly addressable.
3. **Proxy/rate-limit identity:** only trust forwarding headers from known proxy hops; test spoofed, trusted, and missing-header cases on the actual intended host. Confirm production Upstash configuration.
4. **Recovery and telemetry:** replace or tightly govern the reusable reset secret; alert on reset events without logging secrets. Document the consent/legal basis for Sentry and replay, masking, retention, and sampling.
5. **CSP:** evaluate nonce/hash policy for public pages and verify headers on representative production routes without weakening required framework behavior.
6. **Release sign-off:** verify deployed secrets, proxy chain, storage/IAM policy, scanner health, Redis, and email configuration in a controlled staging environment. Confirm data export/deletion and retention procedures.

## Assessment limits

Production secret strength, deployed proxy behavior, cloud storage/IAM policy, scanner availability, email-provider credentials, and Sentry settings were not verifiable from repository source. No database rows were inspected and no exploit reproduction was performed. These limits prevent a production security sign-off.

## Authorized follow-up status

The owner separately authorized remediation of S1 after the discovery review. Both public subscriber intake routes now require an explicit consent signal, place records in `pending`, and send a signed confirmation token that expires after 24 hours. Confirmation is an explicit POST action; campaign and welcome/winner email paths now require `consentStatus: verified` and `subscriptionStatus: active`. Intake is rate-limited, production console-email fallback is rejected for verification messages, and the public response does not reveal whether an address was already subscribed.

No schema migration was executed. Legacy records whose consent is only `granted` are not campaign-eligible under the updated sender filters; they require an owner-approved reconciliation/reconfirmation plan. This source-level remediation does not constitute a production security sign-off.
