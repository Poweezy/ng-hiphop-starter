# TODO (NG HipHop)

## Current status
- ✅ Upstash-based rate limiter integrated with local dev fallback
- ✅ Next.js updated to 14.2.28
- ✅ Strict TypeScript enabled
- ✅ Shared `requireAdmin()` helper across admin routes
- ✅ Splash screen restored via client wrapper
- ✅ Admin styles moved into shared global CSS classes
- ✅ Sharp-based image optimization via `/api/uploads/optimize`
- ✅ Presigned S3 upload support via `/api/uploads/presign`
- ✅ Virus scanning scaffold (ClamAV + webhook adapters)
- ✅ Async moderation queue with retry logic
- ✅ Durable job queue using Prisma `Job` model
- ✅ Compound DB indexes applied via migration
- ✅ Security headers + CSP added to `next.config.js`
- ✅ ErrorBoundary wrapper for admin routes
- ✅ Zustand notification store replaces `react-hot-toast`
- ✅ GraffitiShowcase modal timing fixed with mountedRef guard
- ✅ Documentation updated (README, QUICKSTART, DEPLOYMENT, .env.example)
- ✅ Migrated database from Neon to Vercel Postgres
- ✅ Sentry error tracking configured (client/edge/server)
- ✅ Vercel Analytics integrated (consent-gated)
- ✅ Supabase MCP configured in `.vscode/mcp.json`
- ✅ Supabase Agent Skills installed (`.agents/skills/`)
- ✅ Agency-agents cloned and documented in README
- ✅ Agency audit pass: security, backend, code quality, infra, accessibility
- ✅ CSRF Origin enforcement (middleware rejects mutating requests without Origin in prod)
- ✅ Proxy-aware IP extraction with TRUSTED_PROXIES config (lib/ip.ts)
- ✅ Server-side encryption for S3 uploads (SSE)
- ✅ 404 handling for missing records (P2025 → 404 instead of 500)
- ✅ Transaction-safe file+DB deletion on DELETE routes
- ✅ ClamAV scanner socketRef bug fixed (uploadScanner.ts)
- ✅ Deployment zip verification script (scripts/verify-zip.ps1)
- ✅ Accessibility audit completed for admin login (docs/ACCESSIBILITY-AUDIT-ADMIN-LOGIN.md)

## Remaining
1. Review DEPLOYMENT.md for platform-specific nuances ✅
2. Consider adding GitHub Actions CI workflow ✅
3. Add Sentry or similar error tracking in production ✅
4. Consider Vercel Analytics or similar for usage insights ✅
5. Document Supabase + agency-agents integration ✅

## Open
1. Upgrade next-auth from beta to stable v5
2. Run npm audit fix for 6 dependency vulnerabilities
3. Add CSP nonce support to remove unsafe-inline from script-src
4. Set TRUSTED_PROXIES env var in production
