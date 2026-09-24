import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { withAdmin } from '@/app/api/_lib/withAdmin';
import { successResponse } from '@/lib/api';

// GET /api/admin/submissions
// Server-side paginated + filtered lyric submission listing for the admin
// moderation queue. Replaces the previous approach of serializing up to 200
// rows into the dashboard's initial RSC payload.
//
// Query params:
//   page              1-based page number (default 1)
//   limit             rows per page, 1-100 (default 20)
//   search            case-insensitive substring match on artistAlias / songTitle
//   status            exact match on submission status
//   moderationStatus  exact match on moderation status
//   competitionId     restrict to one competition
export const GET = withAdmin(async ({ req }) => {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const search = (searchParams.get('search') || '').trim();
  const status = searchParams.get('status') || '';
  const moderationStatus = searchParams.get('moderationStatus') || '';
  const competitionId = searchParams.get('competitionId') || '';

  const where = {
    ...(status ? { status } : {}),
    ...(moderationStatus ? { moderationStatus } : {}),
    ...(competitionId ? { competitionId } : {}),
    ...(search
      ? {
          OR: [
            { artistAlias: { contains: search, mode: 'insensitive' as const } },
            { songTitle: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [submissions, total] = await Promise.all([
    prisma.lyricSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      // Full lyrics are intentionally excluded from the list view — the
      // detail modal fetches them on demand via /api/submissions/[id].
      select: {
        id: true,
        competitionId: true,
        artistAlias: true,
        userId: true,
        songTitle: true,
        audioUrl: true,
        socialLinks: true,
        status: true,
        moderationStatus: true,
        moderationNotes: true,
        moderationReason: true,
        score: true,
        copyrightAccepted: true,
        createdAt: true,
        updatedAt: true,
        competition: { select: { id: true, title: true } },
      },
    }),
    prisma.lyricSubmission.count({ where }),
  ]);

  return successResponse({
    submissions: submissions.map((s) => ({ ...s, lyrics: undefined })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});