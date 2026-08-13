# Feature Prompt: Best Lyrics Competition Portal

## Overview
Add a **Best Lyrics Competition Portal** to the NG Hip-Hop platform. This feature allows admins to run monthly/yearly lyric competitions, features submitted lyrics in the game section, and optionally captures email subscriptions to track winners and notify participants.

## Current State
- The `LyricGame` model stores `lyric_text` and `correct_artist` entries
- Admins can add/activate/deactivate lyrics via `/admin` → `LyricsPanel`
- The public `/` page shows a `LyricGame` component with all active lyrics
- No competition, period, or winner tracking exists

## Requirements

### 1. Database Schema Changes
Extend the Prisma schema to support competitions:

```prisma
model LyricGame {
  id             String   @id @default(cuid())
  lyric_text     String
  correct_artist String
  is_active      Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // New fields for competition support
  competitionId String?
  competition   LyricCompetition? @relation(fields: [competitionId], references: [id])
}

model LyricCompetition {
  id          String   @id @default(cuid())
  title       String   // e.g. "Best Bars of August 2026"
  period      String   // "monthly" | "yearly"
  startDate   DateTime
  endDate     DateTime
  is_active   Boolean  @default(false)
  winnerId    String?  // ID of the winning lyric entry
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lyrics      LyricGame[]

  // Optional: email subscription tracking
  subscribers CompetitionSubscriber[]
}

model CompetitionSubscriber {
  id             String   @id @default(cuid())
  competitionId  String
  competition    LyricCompetition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  email          String
  subscribedAt   DateTime @default(now())
  
  @@unique([competitionId, email])
}
```

### 2. Admin Panel — New Tab: "Competitions"
Add a new tab in `AdminDashboard.tsx` called `competitions` (or embed within existing `lyrics` tab as a sub-section).

**Admin Features:**
- Create/edit/delete competitions with:
  - Title (e.g. "Best Bars of August 2026")
  - Period type: `monthly` or `yearly`
  - Start date and end date
  - Active/inactive toggle
  - Winner selection (pick from active lyrics in that competition)
- View list of competitions with status indicators (active, upcoming, ended, winner declared)
- Bulk-assign lyrics to a competition
- View subscriber list for a competition
- Manual winner declaration with optional email notification trigger

### 3. Public-Facing: "Best Lyrics" Portal in Game Section
Modify the `LyricGame` component on the home page (`/`) to include a **Competition Banner** when an active competition exists:

- Show a prominent banner: "🎤 Current Competition: [Title] — Ends [date]"
- Display competition lyrics separately or highlighted within the game
- After the competition ends, show the winning lyric with a "👑 Winner" badge
- Add a "Subscribe for Results" email input form below the competition banner

### 4. Email Subscription System
Add a lightweight email subscription flow:

**Public API:**
- `POST /api/competitions/subscribe` — Accepts `{ competitionId, email }`
  - Rate limited (3 per minute per IP)
  - Validates email format
  - Stores in `CompetitionSubscriber`
  - Returns `{ message: "Subscribed! You'll be notified when the winner is announced." }`

**Admin API:**
- `GET /api/competitions/[id]/subscribers` — List subscribers for a competition (admin only)
- `POST /api/competitions/[id]/notify` — Send notification to all subscribers (admin only, webhook/console fallback)

**Validation:**
```typescript
export const competitionSubscribeSchema = z.object({
  competitionId: z.string().cuid(),
  email: z.string().email(),
});
```

### 5. API Routes to Create
```
POST   /api/competitions/subscribe          # Public: subscribe to competition results
GET    /api/competitions                    # Admin: list all competitions
POST   /api/competitions                    # Admin: create competition
PATCH  /api/competitions/[id]               # Admin: update competition
DELETE /api/competitions/[id]               # Admin: delete competition
POST   /api/competitions/[id]/winner        # Admin: declare winner
GET    /api/competitions/[id]/subscribers    # Admin: list subscribers
POST   /api/competitions/[id]/notify        # Admin: notify subscribers
```

### 6. Frontend Components
- `components/admin/CompetitionsPanel.tsx` — Full CRUD for competitions
- `components/admin/CompetitionForm.tsx` — Create/edit form
- `components/CompetitionBanner.tsx` — Public-facing competition display
- `components/SubscriberForm.tsx` — Email subscription form

### 7. Validation Schemas
Add to `lib/validations.ts`:
```typescript
export const competitionCreateSchema = z.object({
  title: z.string().min(1).max(200),
  period: z.enum(['monthly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  is_active: z.boolean().optional(),
});

export const competitionUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  period: z.enum(['monthly', 'yearly']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
  winnerId: z.string().cuid().optional(),
});
```

### 8. Moderation/Notification
- When a winner is declared, enqueue a moderation task to notify subscribers via `MODERATION_WEBHOOK_URL`
- Admin can also manually trigger notifications

### 9. Security Considerations
- Subscription endpoint is public but rate-limited
- Admin endpoints require `requireAdmin()`
- Email addresses should be sanitized before storage
- Competition subscriber emails are not exposed to other subscribers

### 10. Migration Notes
- Run `npm run db:generate` after schema changes
- Run `npm run db:migrate` to create migration
- Existing `LyricGame` entries remain valid; `competitionId` is nullable

## Acceptance Criteria
1. Admin can create a monthly or yearly competition with start/end dates
2. Admin can assign existing lyrics to a competition
3. Admin can declare a winner from the competition's lyrics
4. Public sees an active competition banner in the game section
5. Public can subscribe with email to receive winner notifications
6. Admin can view subscribers and trigger notifications
7. All new endpoints have proper validation, auth, and observability logging
8. TypeScript compiles with no errors
9. Build succeeds
