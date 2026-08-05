# Production Deployment Guide

This guide walks you through deploying the NG Hip-Hop Platform to production.

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Create production `.env`:
```env
# Database (PostgreSQL required for production)
# Vercel: Use Vercel Postgres, Neon, or Supabase
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://yourdomain.com"

# Admin Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="strong-secure-password"

# Security
ADMIN_RESET_SECRET="strong-master-reset-key"

# Rate Limiting (Upstash Redis) - Required in production
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# S3 / Object Storage (Required for production file uploads)
S3_BUCKET="your-bucket"
S3_REGION="eu-west-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://your-bucket.s3.amazonaws.com"
S3_SIGNED_URL_TTL_SECONDS="3600"

# Supabase Storage (alternative to S3)
# SUPABASE_URL="https://your-project.supabase.co"
# SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
# SUPABASE_STORAGE_BUCKET="uploads"
# SUPABASE_STORAGE_PUBLIC_URL="https://your-project.supabase.co/storage/v1/object/public/uploads"

# Upload Scanning (Optional but recommended)
VIRUS_SCANNER_ENABLED="true"
VIRUS_SCANNER="clamav" # or "webhook"
CLAMAV_HOST="127.0.0.1"
CLAMAV_PORT="3310"
# SCAN_WEBHOOK_URL="https://scanner.example.com/scan"

# Sentry Error Tracking (optional)
SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
NEXT_PUBLIC_SENTRY_DSN=""
```

### 2. Database Migration

**Local development (SQLite):**
```bash
npm run db:generate
npx prisma db push
npm run db:seed
```

**Production (PostgreSQL):**
1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Run migrations:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

**Note:** Use `npm run db:migrate` in production instead of `db:push` to preserve migration history.

### 3. Security Hardening

- [ ] Remove `.env` from git history
- [ ] Change default admin password
- [ ] Enable HTTPS/SSL (HSTS is configured in `next.config.js`)
- [ ] Set secure cookies (`__Secure-next-auth.session-token` with `httpOnly`, `sameSite: 'lax'`, `secure` in production)
- [ ] Configure CSP headers (already in `next.config.js`)
- [ ] Configure rate limiting with Upstash Redis (fails closed in production if missing)
- [ ] Enable upload virus scanning (`VIRUS_SCANNER_ENABLED=true`)
- [ ] Use cloud storage (S3, Supabase Storage, Cloudinary)
- [ ] Set strong `ADMIN_RESET_SECRET`
- [ ] Verify JWT token versioning is active (password changes invalidate existing sessions)
- [ ] Enable Sentry error tracking (`SENTRY_DSN`)
- [ ] Review CORS policies if exposing API to external frontends

## 📦 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:** Zero-config, automatic HTTPS, global CDN, serverless

**Steps:**

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Configure environment variables

3. **Environment Variables in Vercel**
   - Add all variables from `.env`
   - Use Vercel Postgres for database
   - Set `NEXTAUTH_URL` to your domain
   - Configure S3 credentials if using direct uploads

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live site

**Important Vercel Notes:**
- Serverless functions have a 4.5MB body limit — use presigned S3 uploads for large files
- Body size limit is configured in `next.config.js` (`experimental.serverActions.bodySizeLimit: '50mb'`)
- Add S3 domains to `next.config.js` `remotePatterns` if using signed URLs
- Set `S3_PUBLIC_BASE_URL` if serving public S3 objects

**Database Options:**
- [Vercel Postgres](https://vercel.com/storage/postgres) (Recommended)
- [Neon](https://neon.tech) (Free tier available)
- [Supabase](https://supabase.com) (Free tier available)

### Option 2: Railway

**Pros:** Simple deployment, built-in PostgreSQL, affordable

**Steps:**

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Initialize**
```bash
railway login
railway init
```

3. **Add PostgreSQL**
```bash
railway add postgresql
```

4. **Set Environment Variables**
```bash
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
railway variables set UPSTASH_REDIS_REST_URL="..."
railway variables set UPSTASH_REDIS_REST_TOKEN="..."
```

5. **Deploy**
```bash
railway up
```

### Option 3: DigitalOcean App Platform

**Pros:** Full control, predictable pricing, managed services

**Steps:**

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Select branch

2. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Add Database**
   - Create Managed PostgreSQL database
   - Copy connection string

4. **Set Environment Variables**
   - Add all required variables
   - Use database connection string

5. **Deploy**
   - Click "Deploy"
   - Monitor build logs

## 🗄️ Database Setup

### PostgreSQL Configuration

**Recommended Providers:**
- **Vercel Postgres**: Integrated with Vercel
- **Neon**: Serverless PostgreSQL with free tier
- **Supabase**: PostgreSQL + additional features
- **Railway**: Simple managed PostgreSQL

**Connection String Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

### Migrations

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Seed initial data
npm run db:seed
```

## 📁 File Storage

### Production: S3 / Supabase Storage / Cloud Storage

The app supports local storage in development and S3 or Supabase Storage in production.

**Priority:** Supabase Storage > S3 > Local filesystem

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, uploads go to Supabase Storage.
Otherwise, if `S3_BUCKET` and `AWS_REGION` are set, uploads go to S3.
Otherwise, files are stored in `/public/uploads/` (dev only).

**Supabase Storage Configuration:**
1. Create a public bucket in Supabase (e.g., `uploads`)
2. Set environment variables:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `SUPABASE_STORAGE_BUCKET` (default: `uploads`)
    - `SUPABASE_STORAGE_PUBLIC_URL` (optional, for custom domain/CDN)

**S3 Configuration:**
1. Create an S3 bucket
2. Set bucket policy for public read (if using public URLs) or configure signed URLs
3. Set environment variables:
   - `S3_BUCKET`
   - `S3_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_PUBLIC_BASE_URL` (optional, for public buckets)

**Upload Endpoints:**
- `POST /api/uploads/presign` — Get presigned S3 upload URL (admin only)
- `POST /api/uploads/optimize` — Server-side image optimization + upload (admin only)
- `POST /api/songs` — Accepts multipart/form-data or JSON with `fileUrl`/`coverUrl`
- `POST /api/graffiti` — Accepts multipart/form-data or JSON with `imageUrl`

## 🔒 Security Configuration

### 1. HTTPS/SSL

All platforms provide automatic HTTPS. Ensure:
- `NEXTAUTH_URL` uses `https://`
- Redirect HTTP to HTTPS
- Set secure cookies

### 2. Rate Limiting

**Production:** Use Upstash Redis

```bash
npm install @upstash/redis @upstash/ratelimit
```

Create account at [Upstash](https://upstash.com) (free tier available)

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production.

**Fallback:** Without Upstash configured, rate limiting **fails closed in production** (requests are denied) to avoid silently disabling abuse controls. In local development it allows. Always configure Upstash Redis in production.

### 3. CORS Configuration

The app's API is **same-origin** (the browser UI calls `/api/*` from the same host), so
no cross-origin resource sharing is required for normal operation. A defense-in-depth
CSRF/origin guard in `middleware.ts` rejects any state-changing request whose `Origin`
header does not match the `Host` header.

If you expose the API to a **different** frontend origin, add explicit CORS headers in
`next.config.js` (and keep the origin guard in mind):
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE' },
      ],
    },
  ];
}
```

### 4. Content Security Policy

Already configured in `next.config.js`. The policy keeps `'unsafe-inline'` (required
for Next.js + styled-jsx) but **removes `'unsafe-eval'`**, and whitelists the Google
Fonts hosts used by the brand typography:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; upgrade-insecure-requests;"
        },
      ],
    },
  ];
}
```

> For admin routes, prefer a nonce-based CSP to further reduce XSS blast radius.

### 5. Upload Scanning

Enable virus scanning for uploads:
```env
VIRUS_SCANNER_ENABLED=true
VIRUS_SCANNER=clamav
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
```

Or use webhook scanner:
```env
VIRUS_SCANNER_ENABLED=true
VIRUS_SCANNER=webhook
SCAN_WEBHOOK_URL=https://scanner.example.com/scan
```

## 🔍 Monitoring & Analytics

### Error Tracking

Sentry is integrated. Configure it in your `.env`:
```env
SENTRY_DSN="your-sentry-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
NEXT_PUBLIC_SENTRY_DSN="your-public-dsn"
```

Client-side errors are captured in `app/error.tsx` and `app/global-error.tsx`. Server-side errors are automatically captured by the Sentry Next.js SDK.

### Analytics

Vercel Analytics is integrated. It automatically tracks page views and web vitals when deployed on Vercel.

### SLO Metrics

The application exposes `GET /api/slo` (admin-only) returning real-time SLO metrics:
- Availability (success rate)
- p95 / p99 latency
- Error rate (5xx)

Configure alerting based on these metrics.

## 🧪 Pre-Launch Testing

### 1. Build Test
```bash
npm run build
npm start
```

### 2. Lighthouse Audit
- Open Chrome DevTools
- Run Lighthouse audit
- Target: 90+ scores

### 3. Security Scan
```bash
npm audit
npm audit fix
```

### 4. Load Testing
Use [Artillery](https://www.artillery.io/) or [k6](https://k6.io/)

### 5. Upload Smoke Test
```bash
# Test quote submission (requires Upstash for rate limiting)
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","quote":"Test quote"}"

# Test graffiti upload
curl -X POST http://localhost:3000/api/graffiti \
  -F "image=@/path/to/test.jpg" \
  -F "artistName=Test"
```

## 📊 Performance Optimization

### 1. Image Optimization

Images are optimized server-side via `/api/uploads/optimize` using Sharp. The endpoint:
- Accepts multipart/form-data uploads
- Validates MIME type and size
- Optionally scans for malware
- Resizes to max 2000x2000
- Converts to WebP at 80% quality
- Uploads to S3 or local storage

### 2. Caching Strategy

Current: `revalidate: 60` (60 seconds) for public pages.

Adjust in route segments based on needs:
```typescript
export const revalidate = 300; // 5 minutes
```

### 3. Database Indexes

Already added to schema. Verify with:
```bash
npm run db:studio
```

Key indexes:
- `QuoteSubmission`: `(approved, is_featured, display_until)`
- `GraffitiSubmission`: `(approved, display_until)`
- `Song`: `(is_active)`
- `LyricGame`: `(is_active)`

## 🚨 Troubleshooting

### Build Fails

**Issue:** TypeScript errors
```bash
npm run build 2>&1 | tee build.log
```

**Issue:** Missing dependencies
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

**Vercel:** `PrismaClientInitializationError: DATABASE_URL not found`
This happens when `DATABASE_URL` is not set in Vercel's environment.
During `next build`, pages with `revalidate` are prerendered and query the database.
Fix: Add `DATABASE_URL` to Vercel project settings (Settings → Environment Variables).
Use Vercel Postgres, Neon, or Supabase for production PostgreSQL.

### Database Connection Issues

**Issue:** SSL required
Add to connection string: `?sslmode=require`

**Issue:** Connection timeout
Check firewall rules and IP whitelist

### File Upload Issues

**Issue:** Files not persisting
- Use cloud storage (S3, Cloudinary)
- Check write permissions

**Issue:** Large uploads fail on serverless
- Use presigned S3 URLs (`/api/uploads/presign`)
- Ensure S3 bucket CORS allows PUT from your domain

### Rate Limiting Not Working

**Issue:** 500 errors on `/api/quotes`
- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Without these, rate limiting is disabled (allow-all)

## 📝 Post-Deployment

### 1. Verify Functionality
- [ ] Admin login works
- [ ] File uploads work
- [ ] Database queries work
- [ ] All pages load correctly
- [ ] Rate limiting responds with 429 when exceeded
- [ ] S3 uploads work (if configured)

### 2. Set Up Backups
- Database: Daily automated backups
- Files: Replicate to backup storage

### 3. Monitor Performance
- Set up uptime monitoring
- Configure error alerts
- Review analytics weekly

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Upstash Docs**: https://docs.upstash.com

## 🏗️ Architecture Notes

### Upload Flow

**Development:**
1. Client uploads file to `/api/songs` or `/api/graffiti`
2. Server stores in `/public/uploads/`
3. Server returns local URL

**Production (Supabase Storage):**
1. Client uploads file to `/api/songs` or `/api/graffiti`
2. Server optimizes with Sharp, scans for malware, uploads to Supabase Storage
3. Server returns public Supabase URL
4. Database record stores the URL

**Production (Direct S3):**
1. Client requests presigned URL from `/api/uploads/presign`
2. Client uploads directly to S3
3. Client sends S3 URL to `/api/songs` or `/api/graffiti`
4. Server creates database record

**Production (Server-side optimize):**
1. Client uploads file to `/api/uploads/optimize`
2. Server optimizes with Sharp, scans for malware, uploads to S3
3. Server returns optimized URL
4. Client sends URL to `/api/songs` or `/api/graffiti`

### Moderation Queue

Uses a **database-backed job queue** that survives restarts and cold starts:
- `lib/queue.ts` — Prisma `Job` model, atomic claiming (no double-execution across instances), retry with backoff.
- `lib/moderation.ts` — notification handler delivered to `MODERATION_WEBHOOK_URL` (Slack/Discord-compatible `POST { text }`); falls back to `console.info` if unset.

Set `MODERATION_WEBHOOK_URL` so admins are actually notified of pending submissions.

---
**Ready to deploy? Follow this checklist and you'll be live in minutes!** 🚀
