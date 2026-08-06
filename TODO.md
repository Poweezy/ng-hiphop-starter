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

## Remaining
1. Review DEPLOYMENT.md for platform-specific nuances ✅
2. Consider adding GitHub Actions CI workflow ✅
3. Add Sentry or similar error tracking in production ✅
4. Consider Vercel Analytics or similar for usage insights ✅
5. Document Supabase + agency-agents integration ✅
