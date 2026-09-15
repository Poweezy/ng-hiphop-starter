# Nerd Gauge Platform (NG Hip-Hop)

A modern, full-stack hip-hop music platform built with Next.js 16, featuring music streaming, community engagement, and admin content management.

## 🎵 Features

- **Music Streaming**: Latest releases with an inline player and distribution links (Spotify, Apple Music)
- **Community Quotes**: User-submitted hip-hop quotes with admin approval
- **Graffiti Showcase**: Fan art submissions with carousel display
- **Best Lyrics Competition**: Public lyric submissions, moderation queue, and winner announcements
- **Admin Dashboard**: Complete content management system
- **Responsive Design**: Mobile-first, accessible UI

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Prisma ORM with PostgreSQL via Vercel Postgres
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
│   ├── LatestRelease.tsx # Latest release + audio player
│   ├── MusicLibrary.tsx  # Library page with search + players
│   ├── MiniPlayer.tsx    # Persistent player (MediaSession-backed)
│   ├── CommunityQuote.tsx
│   └── GraffitiShowcase.tsx
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

## 🔄 Changelog

Recent releases added database indexes, strict TypeScript, hardened CSP with per-request nonces on admin routes, CSRF origin enforcement, fail-closed rate limiting, Zod request validation, presigned S3 uploads, and a pagination pass on the admin dashboard. See git history for details.

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.

## 📧 Support

For issues or questions, open an issue in this repository or use the contact link in the site footer (set `NEXT_PUBLIC_CONTACT_EMAIL` to enable it).

---

**Built From Bars. Raised By Beats.** 🎤
