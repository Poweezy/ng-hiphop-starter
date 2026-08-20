import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { lyricSubmissionSchema } from '@/lib/validations';
import { auth } from '@/lib/auth';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const ip = getClientIp(req);
    const key = `submission:${ip}`;
    const { allowed } = await checkRateLimit({ key, max: 5, periodSeconds: 60 });
    if (!allowed) {
      recordRequest('POST', '/api/submissions', 429, performance.now() - start, requestId);
      return errorResponse('Too many submissions. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await req.json();
    const validation = lyricSubmissionSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/submissions', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { competitionId, artistAlias, lyrics, songTitle, audioUrl, socialLinks, copyrightAccepted } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id: competitionId },
      select: { id: true, status: true, submissionDeadline: true },
    });

    if (!competition) {
      recordRequest('POST', '/api/submissions', 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    if (competition.status !== 'published') {
      recordRequest('POST', '/api/submissions', 400, performance.now() - start, requestId);
      return errorResponse('Competition is not open for submissions', 400, 'COMPETITION_CLOSED');
    }

    if (new Date(competition.submissionDeadline) < new Date()) {
      recordRequest('POST', '/api/submissions', 400, performance.now() - start, requestId);
      return errorResponse('Submission deadline has passed', 400, 'DEADLINE_PASSED');
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (userId) {
      const rules = await prisma.competitionRule.findUnique({
        where: { competitionId },
        select: { maxSubmissionsPerUser: true },
      });

      const existingCount = await prisma.lyricSubmission.count({
        where: { competitionId, userId, deletedAt: null },
      });

      if (rules && existingCount >= rules.maxSubmissionsPerUser) {
        recordRequest('POST', '/api/submissions', 400, performance.now() - start, requestId);
        return errorResponse('You have exceeded the maximum number of submissions for this competition', 400, 'LIMIT_EXCEEDED');
      }
    }

    const submission = await prisma.lyricSubmission.create({
      data: {
        competitionId,
        artistAlias,
        lyrics,
        songTitle,
        audioUrl,
        socialLinks,
        copyrightAccepted,
        userId,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    });

    await prisma.competitionParticipant.upsert({
      where: { competitionId },
      update: {
        submissionCount: { increment: 1 },
      },
      create: {
        competitionId,
        userId: userId ?? '__none__',
        submissionCount: 1,
      },
    });

    await prisma.competitionAnalytics.upsert({
      where: { competitionId },
      update: { totalSubmissions: { increment: 1 } },
      create: {
        competitionId,
        totalSubmissions: 1,
      },
    });

    recordRequest('POST', '/api/submissions', 201, performance.now() - start, requestId);
    return successResponse(submission, 201);
  } catch (error) {
    console.error('Submission error:', error);
    recordRequest('POST', '/api/submissions', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBMISSION_ERROR');
  }
}
