# Nerd Gauge Platform (NG Hip-Hop)

Music platform for Nerd Gauge, a hip-hop artist from Eswatini. Built with Next.js 16: streaming, community submissions, a lyric competition, and an admin dashboard for all of it.

## Features

- **Music streaming** — latest release with an inline player and distribution links (Spotify, Apple Music), plus a searchable library
- **Community quotes** — user-submitted quotes, published after admin approval
- **Graffiti showcase** — fan art submissions with a lightbox
- **Best Lyrics competition** — public lyric submissions, moderation queue, winners, email subscribers
- **Admin dashboard** — content management for everything above
- **Responsive design** — mobile-first, keyboard accessible

## Tech stack

- Next.js 16 (App Router, Turbopack)
- Prisma + PostgreSQL (Vercel Postgres in production, SQLite for local dev)
- NextAuth.js
- TypeScript (strict)
- Sharp + next/image for image optimization
- Local filesystem storage in dev, S3 or Supabase Storage in production
- Upstash Redis for rate limiting
- Vitest

## Requirements

- Node.js 18+
- npm
- PostgreSQL (production only; local dev falls back to SQLite)

## Getting started

```bash
git clone <repository-url>
cd ng-hiphop-starter
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:

- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the admin login
- `DATABASE_URL` — database connection string

Then:

```bash
npm run db:generate
npm run db:push
npm run db:seed   # creates the slogan and admin user only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To also load demo fixtures (placeholder song, competitions, sample community content), run `SEED_DEMO_DATA=true npm run db:seed` — never against a production database.

## Project structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages
│   ├── game/best-lyrics/ # Competition page
│   ├── library/          # Music library
│   ├── db.ts             # Prisma client
│   └── layout.tsx        # Root layout
├── components/           # UI components (components/admin for the dashboard)
├── lib/                  # Shared utilities (audio, auth, storage, rate limiting)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/images/
└── types/
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Run the test suite |
| `npm run lint` | Lint with ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push the schema to the database |
| `npm run db:migrate` | Create and run a migration |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Admin access

Sign in at `/admin/login` with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`. There is no public registration.

## Security checklist before going live

1. Never commit `.env`
2. Use a strong `NEXTAUTH_SECRET` and `ADMIN_RESET_SECRET`
3. Change any default admin credentials
4. Use PostgreSQL, not SQLite
5. Serve over HTTPS (HSTS is already set in `next.config.js`)
6. Configure Upstash Redis — rate limiting fails closed in production without it
7. Enable upload scanning with `VIRUS_SCANNER_ENABLED=true`
8. Use S3 or Supabase Storage instead of local uploads

## Known limitations

- Local file uploads are world-readable; use object storage in production
- Virus scanning is opt-in; when disabled it fails closed in production (set `VIRUS_SCANNER_FAIL_OPEN=true` for local dev only)
- The moderation queue is database-backed and survives restarts; notifications go to `MODERATION_WEBHOOK_URL` when set, console otherwise
- Public graffiti uploads are scanned and optimized server-side at `/api/graffiti`; admin uploads use `/api/uploads/optimize`

## Deployment

Vercel is the recommended host — see [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide and [QUICKSTART.md](./QUICKSTART.md) for a short version. Any Node host with a PostgreSQL database works.

## License

Private — all rights reserved.

## Support

Open an issue in this repository, or use the contact link in the site footer (enable it by setting `NEXT_PUBLIC_CONTACT_EMAIL`).

