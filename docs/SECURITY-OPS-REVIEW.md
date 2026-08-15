# NG Hip-Hop Application — SecOps Design Review

**Review scope:** HTTP security, headers, CSP, secrets management, file uploads, error handling, cookie security
**Date:** 2026-08-15

---

## 1. Security Headers

### Good
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` in production (2yr, includeSubDomains, preload)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP includes `upgrade-insecure-requests`, `frame-ancestors 'none'`

### Missing/Risky
- `Permissions-Policy` omits `payment=()`
- No `Cross-Origin-Opener-Policy` (COOP) or `Cross-Origin-Embedder-Policy` (COEP) — susceptible to Spectre-class side-channel attacks
- `X-XSS-Protection: 1; mode=block` is deprecated in modern browsers
- CSP lacks `block-all-mixed-content`

### Recommendation (MEDIUM)
Add to `next.config.js`:
```javascript
{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
{ key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }
{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
```
Add `block-all-mixed-content` to CSP; remove deprecated `X-XSS-Protection`.

---

## 2. Secrets Management

### Good
- `.env` in `.gitignore`; `.env.example` is clean template
- All secrets loaded from env vars
- NextAuth fail-fast for `NEXTAUTH_SECRET`/`NEXTAUTH_URL` in production

### CRITICAL: Production secrets on disk and in git history
- `.env` exists on disk with: `DATABASE_URL` (embedded password), `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, `ADMIN_RESET_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- These secrets persist in git history from earlier commits
- Both `SUPABASE_SECRET_KEY` (legacy/admin) and `SUPABASE_SERVICE_ROLE_KEY` (full-access) stored — doubled blast radius

### Recommendation (CRITICAL)
1. **Rotate all secrets immediately** — treat all values as compromised
2. **Purge `.env` from git history** using `git filter-repo` or BFG
3. **Delete local `.env`** after rotating; inject via runtime env (Vercel, vault)
4. **Remove `SUPABASE_SECRET_KEY`**; keep only `SUPABASE_SERVICE_ROLE_KEY` server-side
5. **Add `SENTRY_AUTH_TOKEN`** to `.env.example`

---

## 3. File Upload Security

### Good
- Virus scanning with fail-closed default (`uploadScanner.ts`)
- Path traversal prevention: `sanitizeFolder`, `sanitizeSegment`, `safeLocalPath`
- 5MB size limit on image optimization
- MIME type allowlist (jpeg, png, webp) on optimize route
- UUID-based filenames prevent predictable overwrites

### Missing/Risky
- **Presign route accepts any content type** — no allowlist validation on `contentType`
- **7-day default presigned URL TTL** (`S3_SIGNED_URL_TTL_SECONDS = 604800`) — excessive exposure window
- **No magic number / file signature validation** — `file.type` is client-controlled, spoofable
- **Supabase `upsert: true`** — silent overwrites if UUID collision occurs

### Recommendation (MEDIUM)
1. Add content-type allowlist to presign route:
   ```typescript
   const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg']);
   if (!ALLOWED_UPLOAD_TYPES.has(contentType)) return errorResponse('Unsupported content type', 400);
   ```
2. Reduce S3 presigned TTL default to 3600s (1 hour)
3. Add magic number validation using `file-type` library before image processing
4. Remove `upsert: true` from Supabase upload

---

## 4. Error Handling

### Good
- Unified `errorResponse` utility returns structured `{ success: false, error: { code, message } }`
- No stack traces leaked to clients
- ErrorBoundary renders only `error.message`
- Server-side catch blocks log errors

### Missing/Risky
- Server-side logs include full error objects (`console.error('Presign upload error:', error)`) — stack traces visible to operators
- ErrorBoundary `componentDidCatch` logs full error + info to client console in production
- `errorResponse` `details` parameter exposes Zod schema field names in production

### Recommendation (MEDIUM)
1. Sanitize server-side logs: `console.error('Presign upload error:', { message: error.message, name: error.name })`
2. Gate client-side console error logging on dev mode
3. Gate `details` field in production: `{ ...(isDev && details ? { details } : {}) }`

---

## 5. Cookie Security

### Good
- `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production
- `__Secure-` prefix ensures HTTPS-only
- Path `/` is appropriate for session token

### Missing/Risky
- **No explicit `maxAge`** on session cookie — may default to session cookie (expires on browser close)
- Consent state in `localStorage` — readable by any JS (risk if PII ever added)

### Recommendation (LOW)
1. Explicitly set `maxAge: 8 * 60 * 60` to match JWT TTL
2. Keep consent in `localStorage` only if purely non-sensitive boolean preferences

---

## Summary — Critical Actions

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | `.env` on disk with production secrets | **CRITICAL** | Rotate all secrets; purge git history; remove local file |
| 2 | Secrets in git history | **CRITICAL** | `git filter-repo` to purge |
| 3 | Presign route accepts any content type | MEDIUM | Add allowlist |
| 4 | Missing COOP/COEP headers | MEDIUM | Add headers |
| 5 | 7-day default presigned URL TTL | MEDIUM | Reduce to 1 hour |
| 6 | No magic number validation | MEDIUM | Add `file-type` check |
| 7 | Both SUPABASE_SECRET_KEY and SERVICE_ROLE_KEY stored | HIGH | Remove secret key |
| 8 | Server-side logs include full error objects | MEDIUM | Sanitize logs |
| 9 | No explicit cookie `maxAge` | LOW | Set to match session TTL |

**Highest priority: Immediate secret rotation and git history purge.**
