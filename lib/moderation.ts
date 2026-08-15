import * as Sentry from '@sentry/nextjs';
import { registerTask, enqueue, type Task, calculateBackoffMs } from '@/lib/queue';

export type ModerationTaskPayload = {
  submissionType: 'quote' | 'graffiti' | 'competition_winner';
  submissionId: string;
  submittedBy: string;
};

/**
 * Computes exponential backoff delay: min(base * 2^attempt, maxDelayMs).
 * attempt is 0-indexed so attempt 0 → base, attempt 1 → 2×base, etc.
 * Implementation lives in lib/queue.ts to avoid circular imports.
 */
export { calculateBackoffMs as moderationBackoffMs } from '@/lib/queue';

export async function notifyAdminModeration(payload: ModerationTaskPayload) {
  // Do NOT swallow enqueue errors — if Prisma is down, admins must know.
  try {
    await enqueue('moderation.notify_admin', payload);
  } catch (error) {
    console.error('Failed to enqueue moderation notification:', error);
    Sentry.captureException(error, {
      tags: { component: 'moderation', action: 'enqueue' },
      extra: { payload },
    });
    // Re-throw so the caller can decide how to handle a lost notification.
    throw error;
  }
}

export function registerModerationHandlers() {
  registerTask<ModerationTaskPayload>('moderation.notify_admin', async (task: Task<ModerationTaskPayload>) => {
    const { submissionType, submissionId, submittedBy } = task.payload;
    const message = `New ${submissionType} submission ${submissionId} by ${submittedBy} needs review`;

    const webhookUrl = process.env.MODERATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          throw new Error(`Moderation webhook returned ${res.status}`);
        }
        return;
      } catch (error) {
        console.error('Moderation webhook delivery failed:', error);
        // Let the queue retry logic handle retries — re-throw.
        throw error;
      }
    }

    console.info(`[moderation] ${message}`);
  });
}
