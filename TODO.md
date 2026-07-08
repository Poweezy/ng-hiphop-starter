# TODO (NG HipHop)

## Current status
- ✅ Upstash-based rate limiter integrated with local dev fallback
- ✅ `lib/ratelimit.ts` allows all requests when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing
- ✅ Next.js updated to 14.2.28
- ✅ Strict TypeScript enabled
- ✅ Shared `requireAdmin()` helper across admin routes
- ✅ Splash screen restored via client wrapper
- ✅ Admin styles moved into shared global CSS classes
- ✅ Sharp-based image optimization via `/api/uploads/optimize`
- ✅ Presigned S3 upload support via `/api/uploads/presign`
- ✅ Virus scanning scaffold (ClamAV + webhook adapters)
- ✅ Async moderation queue with retry logic
- ✅ Compound DB indexes applied via migration
- ✅ Security headers + CSP added to `next.config.js`

## Remaining
1. Replace remaining inline styles in `LyricsPanel`, `SloganPanel`, `QuotesPanel`, `GraffitiPanel`
2. Add `<ErrorBoundary>` wrapper for admin/public routes
3. Consider Zustand notification store to replace `react-hot-toast`
4. Fix `showSubmit` modal timing in `GraffitiShowcase.tsx`
5. Replace in-memory queue with durable job backend for production
6. Update DEPLOYMENT.md with new env vars and endpoints
