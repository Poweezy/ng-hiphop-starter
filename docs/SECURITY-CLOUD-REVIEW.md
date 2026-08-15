# Cloud Security Design Review: NG Hip-Hop Storage Architecture

## 1. S3 Object Storage — Credentials and Encryption

### Good
- AWS SDK v3 with `Upload` for multipart transfers
- `sanitizeFolder`, `sanitizeSegment` for path traversal prevention
- UUID-based object keys prevent predictable enumeration
- Factory pattern separates S3 from local fallback

### Missing (HIGH)
- **Long-lived IAM user credentials**: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from env vars — never expire, manual rotation
- **No server-side encryption**: No `ServerSideEncryption` param on `PutObjectCommand`; objects can be stored unencrypted
- **No S3 bucket security controls**: No mention of Block Public Access, bucket policies, versioning, Object Lock, or default encryption
- **No CloudTrail data events** for forensic data access
- **No SSE-KMS or customer-managed keys**

### Recommendation (HIGH)
1. Replace static credentials with IAM Roles (EC2/ECS/Lambda/OIDC federation); remove explicit credential block — AWS SDK auto-resolves
2. Add `ServerSideEncryption: 'aws:kms'` to every `PutObjectCommand`
3. Provision S3 bucket policy: deny unencrypted uploads (`s3:x-amz-server-side-encryption`), enforce TLS (`aws:SecureTransport`), block public access
4. Enable S3 server access logging + CloudTrail data events
5. Use SSE-KMS with customer-managed key + auto key rotation

---

## 2. Presigned URL Security

### Good
- `/api/uploads/presign` requires admin auth (`requireAdmin()`)
- Zod validation on input
- `getSignedUrl` for time-limited access

### Missing (HIGH)
- **7-day TTL** (`S3_SIGNED_URL_TTL_SECONDS = 604800`) — excessive exposure
- **No URL content binding**: any client with URL can upload from any origin
- **No content-type enforcement at S3 level**: `PutObjectCommand` for presigned URLs has no `ContentType` in policy — client can upload any content type
- **Presigned uploads bypass virus scanning**: files go directly to S3, never scanned

### Recommendation (HIGH)
1. Reduce TTL to 900s (15 min) for uploads, 300s (5 min) for downloads
2. Include `ContentType` in `PutObjectCommand`; use `Conditions` in presign policy
3. **Scan presigned uploads**: S3 Event Notifications → Lambda scans + quarantines; or presign to quarantine prefix, scan server-side, then move to public
4. Consider `x-amz-meta-user-id` metadata tag on presigned uploads

---

## 3. Supabase Storage Integration

### Good
- Uses server-side `serviceRoleKey` (not public `anon` key)

### Missing (MEDIUM-HIGH)
- **Service role key = full-admin credential** — long-lived credential risk
- **No bucket-level policies**: no Supabase Storage RLS policies restricting uploads by user/path
- **Upsert enabled** (`upsert: true`) — silent overwrites

### Recommendation (MEDIUM-HIGH)
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` never reaches client bundles (verify with bundle analysis)
2. Enable Supabase Storage RLS policies restricting INSERT/UPDATE/DELETE by folder prefix per role
3. Remove `upsert: true`; implement app-level versioning if needed
4. Consider scoped Postgres role instead of service role key

---

## 4. Local Filesystem Fallback

### Good
- Path traversal defense-in-depth: `sanitizeFolder`, `sanitizeSegment`, `safeLocalPath`, bounds-checking on all paths
- Path validation: resolved paths confirmed inside `publicDir`

### Missing (MEDIUM)
- **No access control**: files in `public/uploads` served as static assets with zero authentication
- **No CSP for uploads**: uploaded SVG/HTML could contain scripts — stored XSS risk
- **No file size quota**: disk exhaustion risk
- **No environment gate**: silent local fallback in production if env vars missing

### Recommendation (MEDIUM)
1. Add explicit environment gate — throw/refuse to start if S3/Supabase missing in production
2. Rewrite handler or API route for `/uploads/*` that checks authentication before serving
3. Implement per-user or global upload size quota
4. SVG sanitization (e.g., `sanitize-svg` or `sharp` raster conversion)

---

## 5. Image Optimization Security

### Good
- `sharp` for resizing with `withoutEnlargement: true`
- WebP output default
- 5MB input limit, MIME type whitelist

### Missing (MEDIUM)
- **No server-side resource limits**: no concurrency limit or memory cap on `sharp` operations
- **No input format validation beyond MIME type**: `file.type` is client-controlled — renamed executable would pass
- **No SVG-specific handling**: vectors could contain JS/XXE payloads
- **No output size validation**

### Recommendation (MEDIUM)
1. Validate file magic bytes using `file-type` or `sharp`'s `metadata()` before processing
2. Add concurrency queue/semaphore for `sharp` (max 4 concurrent); set `--max-old-space-size`
3. Explicitly reject SVG/vector formats; if needed, sanitize via `sanitize-svg` or convert to raster
4. Log original + optimized sizes for anomaly detection

---

## 6. Virus Scanning Integration

### Good
- `uploadScanner.ts` defaults to fail-closed
- Multiple adapters with per-adapter timeouts
- INSTACK protocol used for ClamAV
- Optimize route scans before upload

### Missing (MEDIUM-HIGH)
- **Presigned uploads bypass scanning**: files go directly to S3 — never scanned
- **ClamAV response parsing is fragile**: substring `FOUND`/`OK` check can produce false positives or miss threats
- **`Song` model lacks scan fields**: audio file uploads not scanned at all

### Recommendation (MEDIUM-HIGH)
1. S3 Event Notifications → Lambda scans all new objects (incl. presigned)
2. Parse ClamAV INSTREAM responses properly (not substring matching)
3. Add `scan_clean`/`scan_result` to `Song` model; scan audio files (MP3, WAV)
4. Add periodic re-scan job for existing objects

---

## 7. Multi-Tenant Isolation

### Good
- `folder` parameter provides logical separation
- Admin auth on upload endpoints

### Missing (MEDIUM)
- **No ownership model**: `Song` has `file_url`/`file_key` but no `uploadedById`
- **No per-user quotas or access control on files**
- **All admins share one namespace**: any admin can write/delete any file
- **No audit trail tying storage operations to specific users**

### Recommendation (MEDIUM)
1. Add `ownerId` foreign key to `Song`, `GraffitiSubmission`, `QuoteSubmission`
2. Validate ownership in `deleteFile`/`deleteByKey`
3. Implement per-user storage quotas
4. When adding non-admin uploaders: separate prefixes per user with RBAC

---

## 8. Least-Privilege IAM

### Good
- Admin-only auth on endpoints, bcrypt hashing, JWT token versioning, `httpOnly`+`secure` cookies

### Missing (MEDIUM)
- **`trustHost: true`** in NextAuth — disables host header validation
- **Static AWS credentials** instead of role-based access

### Recommendation (MEDIUM)
1. Remove `trustHost: true` from NextAuth
2. Scope IAM permissions to `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on specific bucket prefix — no `s3:*`

---

## 9. Next.js Image Configuration / SSRF Surface

The `next.config.js` image remotePatterns include wildcard S3 hostnames (`*.s3.amazonaws.com`, `*.s3.*.amazonaws.com`). If the app uses `next/image` with user-provided `src` URLs, these wildcards could enable SSRF.

### Recommendation (MEDIUM)
Replace wildcards with specific production bucket hostname. Validate bucket name server-side before passing to `next/image`.

---

## Prioritized Remediation Plan

| Priority | Finding |
|----------|---------|
| **P0** | Replace static AWS credentials with IAM roles |
| **P0** | Enforce S3 SSE-KMS + bucket policy |
| **P0** | Reduce presigned URL TTL to ≤15 min + content-type binding |
| **P0** | Implement scanning for presigned uploads (S3 Event → Lambda) |
| **P1** | Remove `trustHost: true` from NextAuth |
| **P1** | Add `ServerSideEncryption` to all S3 `PutObject` calls |
| **P1** | Add `scan_clean` to Song model + audio scanning |
| **P1** | Server-side magic byte validation before image optimization |
| **P2** | Add ownership model and per-user storage quotas |
| **P2** | Tighten Next.js image remotePatterns (remove wildcards) |
| **P3** | Enable CloudTrail data events + S3 access logging |
| **P3** | Replace Supabase service role with scoped role |