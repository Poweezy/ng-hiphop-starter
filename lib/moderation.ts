import { registerTask, enqueue, type Task } from '@/lib/queue';

export type ModerationTaskPayload = {
  submissionType: 'quote' | 'graffiti';
  submissionId: string;
  submittedBy: string;
};

export async function notifyAdminModeration(payload: ModerationTaskPayload) {
  await enqueue('moderation.notify_admin', payload);
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
        // Fall back to console so the notification is never fully lost.
      }
    }

    console.info(`[moderation] ${message}`);
  });
}
