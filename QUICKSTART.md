# Quick Start Guide

Get the NG Hip-Hop Platform running in 5 minutes.

## ⚡ Fast Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd ng-hiphop-starter
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Initialize database
npm run db:generate
npm run db:push
npm run db:seed

# 4. Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials

**Admin Login:** `/admin/login`
- Email: From `.env` (`ADMIN_EMAIL`)
- Password: From `.env` (`ADMIN_PASSWORD`)

## 📋 Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Create/run migration
npm run db:seed          # Seed initial data
npm run db:studio        # Open database GUI
```

## 🎯 First Steps

### 1. Change Admin Password
1. Go to `/admin/login`
2. Login with default credentials
3. Use **Security** tab in admin to change password

### 2. Upload First Song
1. Navigate to Admin Dashboard
2. Go to "Songs" tab
3. Upload audio file + cover art
4. Add distribution links
5. Song automatically becomes active

### 3. Customize Slogan
1. Admin Dashboard → "Slogan" tab
2. Edit hero section text
3. Changes appear immediately

### 4. Test Community Features
1. Visit homepage
2. Submit a quote (Community Quotes section)
3. Upload graffiti art
4. Play lyric guessing game

## 🔧 Environment Variables

See `.env.example` for the full list. Key vars:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite dev DB or Postgres in prod |
| `NEXTAUTH_SECRET` | Yes | Session signing secret |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `ADMIN_RESET_SECRET` | Yes | Master key for password reset |
| `UPSTASH_REDIS_REST_URL` | No | Rate limiting (optional locally) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Rate limiting (optional locally) |
| `S3_BUCKET` | No | S3 bucket for uploads |
| `S3_REGION` | No | S3 region |
| `AWS_ACCESS_KEY_ID` | No | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key |
| `S3_PUBLIC_BASE_URL` | No | Public S3 base URL |
| `VIRUS_SCANNER_ENABLED` | No | Enable upload scanning |
| `CLAMAV_HOST` / `CLAMAV_PORT` | No | ClamAV adapter |
| `SCAN_WEBHOOK_URL` | No | Webhook scanner adapter |

## 🚀 Upload Architecture

### Local Development
- Uploads go to `/public/uploads/...`
- No S3 or virus scanning required

### Production
- Images are optimized server-side via `/api/uploads/optimize`
- Large files can use presigned S3 uploads via `/api/uploads/presign`
- Virus scanning is opt-in via `VIRUS_SCANNER_ENABLED=true`

## 🔧 Common Issues

### Database Connection Error
```bash
# Reset database
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

## 📱 Testing

### Desktop
- Chrome: ✅
- Firefox: ✅
- Safari: ✅
- Edge: ✅

### Mobile
- iOS Safari: ✅
- Android Chrome: ✅

### Features to Test
- [ ] Music player works
- [ ] Quote submission
- [ ] Graffiti upload
- [ ] Lyric game
- [ ] Admin login
- [ ] Admin CRUD operations

## 🚀 Next Steps

1. **Customize Design**
    - Edit `app/globals.css`
    - Update color variables
    - Change fonts

2. **Add Content**
    - Upload songs via admin
    - Approve community submissions
    - Add lyric game questions

3. **Deploy**
    - See [DEPLOYMENT.md](./DEPLOYMENT.md)
    - Recommended: Vercel
    - Database: Vercel Postgres or Neon

## 📚 Documentation

- [README.md](./README.md) - Full documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines

## 💡 Tips

- Use `npm run db:studio` to view/edit database
- Check browser console for errors
- Test on mobile devices early
- Keep `.env` file secure

## 🆘 Need Help?

1. Check documentation
2. Review error messages
3. Check browser console
4. Verify environment variables

---
**Built From Bars. Raised By Beats.** 🎤
