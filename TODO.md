# TODO (NG HipHop)

## Current status
- ✅ Upstash-based rate limiter integrated with local dev fallback
- ✅ Next.js updated to 15.5.23 (CVE-2025-66478 fixed)
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
- ✅ ESLint configured with flat config (eslint.config.js)
- ✅ Vitest testing infrastructure added with 15 passing core tests
- ✅ GitHub Actions CI workflow added (.github/workflows/ci.yml)
- ✅ Inline styles extracted from LoginClient.tsx to CSS classes
- ✅ Unused imports cleaned from 28 API route files
- ✅ Full-site quality audit (Aug 2026):
  - Fixed double-audio playback (inline `<audio>` + global provider both played); single-source audio architecture in `lib/audioContext.tsx`
  - MiniPlayer close button now dismisses (was pause-only); mini player stacks above bottom nav on mobile
  - Hero LCP: 3.6MB raw PNG replaced with 414KB WebP via next/image; deleted broken 0KB hero-art.jpg; logo 1.7MB→76KB + 14KB apple-touch-icon
  - Fonts self-hosted via next/font (removed render-blocking Google Fonts @import)
  - Defined missing `--radius-*` tokens (form inputs were silently square); de-duplicated .btn-xs/.btn-sm/.btn-md/.btn-admin-purple definitions
  - Fixed admin-page chrome flash (LayoutWrapper mounted-gate removed)
  - Navigation: correct aria-current semantics, active link states, Escape closes mobile menu, menu closes on route change
  - Hero CTAs de-duplicated (ghost CTA now targets the lyric game)
  - LyricGame share text uses best streak (was resetting streak); copy feedback; footer-actions wrap; accuracy badge markup fixed
  - GraffitiShowcase dead modal CSS wired via Modal className (lightbox + form panel); lightbox close button reachable + 44px touch target
  - Sitemap includes /game/best-lyrics + /submissions/status; library JSON-LD populated server-side
  - Splash screen dwell reduced (450ms hold / 0.45s exit); bottom-nav items unified (emoji set, "Library" label)

## Remaining
1. Review DEPLOYMENT.md for platform-specific nuances ✅
2. Consider adding GitHub Actions CI workflow ✅
3. Add Sentry or similar error tracking in production ✅
4. Consider Vercel Analytics or similar for usage insights ✅
5. Document Supabase + agency-agents integration ✅

## Open
1. Upgrade next-auth from beta to stable v5
2. Run npm audit fix for dependency vulnerabilities
3. Add CSP nonce support to remove unsafe-inline from script-src
4. Set TRUSTED_PROXIES env var in production
5. Standardize API error envelopes across all routes
6. Complete WCAG 2.2 AA accessibility audit for all pages
7. Complete red-team security review and penetration testing
