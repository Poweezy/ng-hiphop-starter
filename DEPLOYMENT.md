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
# Database (PostgreSQL required)
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://yourdomain.com"

# Admin Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="strong-secure-password"
```

### 2. Database Migration

Switch from SQLite to PostgreSQL:

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
npm run db:push
npm run db:seed
```

### 3. Security Hardening

- [ ] Remove `.env` from git history
- [ ] Change default admin password
- [ ] Enable HTTPS/SSL
- [ ] Set up CORS policies
- [ ] Configure CSP headers
- [ ] Add rate limiting (Redis recommended)

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

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live site

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

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

## 📁 File Storage

### Local Storage (Development Only)

Files are stored in `/public/uploads/` - **NOT suitable for production**

### Production Options

#### Option 1: AWS S3
```bash
npm install @aws-sdk/client-s3
```

#### Option 2: Cloudinary
```bash
npm install cloudinary
```

#### Option 3: Vercel Blob
```bash
npm install @vercel/blob
```

**Recommendation:** Use Cloudinary for images (free tier: 25GB)

## 🔒 Security Configuration

### 1. HTTPS/SSL

All platforms provide automatic HTTPS. Ensure:
- `NEXTAUTH_URL` uses `https://`
- Redirect HTTP to HTTPS
- Set secure cookies

### 2. Rate Limiting

**Development:** In-memory (current implementation)

**Production:** Use Redis

```bash
npm install @upstash/redis @upstash/ratelimit
```

Create account at [Upstash](https://upstash.com) (free tier available)

### 3. CORS Configuration

Add to `next.config.js`:
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

Add CSP headers in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
        },
      ],
    },
  ];
}
```

## 🔍 Monitoring & Analytics

### Error Tracking

**Sentry** (Recommended)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Analytics

**Vercel Analytics**
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

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

## 📊 Performance Optimization

### 1. Image Optimization

Already configured with Next.js Image component

### 2. Caching Strategy

Current: `revalidate: 60` (60 seconds)

Adjust in `app/page.tsx` based on needs:
```typescript
export const revalidate = 300; // 5 minutes
```

### 3. Database Indexes

Already added to schema. Verify with:
```bash
npm run db:studio
```

## 🚨 Troubleshooting

### Build Fails

**Issue:** TypeScript errors
```bash
npm run build 2>&1 | tee build.log
```

**Issue:** Missing dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

**Issue:** SSL required
Add to connection string: `?sslmode=require`

**Issue:** Connection timeout
Check firewall rules and IP whitelist

### File Upload Issues

**Issue:** Files not persisting
- Use cloud storage (S3, Cloudinary)
- Check write permissions

## 📝 Post-Deployment

### 1. Verify Functionality
- [ ] Admin login works
- [ ] File uploads work
- [ ] Database queries work
- [ ] All pages load correctly

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

---

**Ready to deploy? Follow this checklist and you'll be live in minutes!** 🚀
