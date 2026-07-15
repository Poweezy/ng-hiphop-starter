# NG Hip-Hop Platform

A modern, full-stack hip-hop music platform built with Next.js 14, featuring music streaming, community engagement, and admin content management.

## 🎵 Features

- **Music Streaming**: Latest releases with distribution links (Spotify, Apple Music)
- **Community Quotes**: User-submitted hip-hop quotes with admin approval
- **Graffiti Showcase**: Fan art submissions with carousel display
- **Lyric Game**: Interactive "guess the artist" game
- **Admin Dashboard**: Complete content management system
- **Responsive Design**: Mobile-first, accessible UI

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Authentication**: NextAuth.js
- **Styling**: CSS Custom Properties
- **TypeScript**: Full type safety
- **Image Optimization**: Sharp + Next.js Image component
- **Storage**: Local filesystem (dev) / S3 (prod)
- **Rate Limiting**: Upstash Redis
- **Upload Scanning**: ClamAV / webhook adapter (opt-in)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ng-hiphop-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Your admin credentials
   - `DATABASE_URL`: Your database connection string

4. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages
│   ├── db.ts             # Prisma client
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── admin/            # Admin dashboard components
│   ├── Hero.tsx          # Hero section
│   ├── LatestRelease.tsx # Music player
│   ├── CommunityQuote.tsx
│   ├── GraffitiShowcase.tsx
│   └── LyricGame.tsx
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── public/
│   └── images/           # Static images
└── types/                # TypeScript definitions
```

## 🔐 Security Notes

**CRITICAL - Before Production:**

1. ✅ Never commit `.env` file
2. ✅ Generate strong `NEXTAUTH_SECRET`
3. ✅ Change default admin credentials
4. ✅ Use PostgreSQL (not SQLite)
5. ✅ Enable HTTPS
6. ✅ Set up proper CORS policies
7. ✅ Configure Upstash Redis for rate limiting
8. ✅ Enable virus scanning for uploads (`VIRUS_SCANNER_ENABLED=true`)
9. ✅ Use S3/Cloudinary for file storage
10. ✅ Set `ADMIN_RESET_SECRET` to a strong random value

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create migration
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## 🎨 Admin Access

1. Navigate to `/admin/login`
2. Use credentials from `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<strong-random-string>
NEXTAUTH_URL=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

## 🐛 Known Issues & Limitations

- SQLite not suitable for production (use PostgreSQL)
- Local file uploads are public; use S3/Cloudinary in production
- Rate limiting fails closed in production when Upstash Redis is not configured (allows in local dev)
- Virus scanning is opt-in; when disabled it fails closed in production (set `VIRUS_SCANNER_FAIL_OPEN=true` for dev only)
- Moderation queue is database-backed and survives restarts; notifications are sent via `MODERATION_WEBHOOK_URL` (console fallback)
- Public graffiti submissions are scanned + optimized server-side at `/api/graffiti`; admin-only uploads use `/api/uploads/optimize`
- No user registration (admin only)

## 🔄 Recent Improvements

- ✅ Added database indexes for performance
- ✅ Fixed type safety issues (enabled strict mode, removed `as any`)
- ✅ Improved accessibility (focus styles, ARIA labels, touch targets)
- ✅ Enhanced security (CSP headers, timing-safe reset secret, sanitized errors, S3 signed URLs)
- ✅ Fixed memory leaks (rate-limit cache, removed unbounded upload log)
- ✅ Optimized image uploads with Sharp + server-side optimize endpoint
- ✅ Added presigned S3 upload support (`/api/uploads/presign`)
- ✅ Added request validation with Zod
- ✅ Implemented DELETE endpoints with file cleanup
- ✅ Added pagination to admin API endpoints
- ✅ Created shared `requireAdmin()` auth helper
- ✅ Confirmation dialogs for destructive actions
- ✅ Improved error logging and handling
- ✅ Added SLO definitions and request observability logging
- ✅ Added upload scanning scaffold (ClamAV + webhook adapters)
- ✅ Added async moderation queue with retry logic
- ✅ Updated Next.js to 14.2.28

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.

## 📧 Support

For issues or questions, contact: [your-email@domain.com]

---

**Built From Bars. Raised By Beats.** 🎤
