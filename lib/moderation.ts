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
    //TODO: Replace with real notification channel (email, webhook, Slack, etc.)
    console.info(`[moderation] New ${submissionType} submission ${submissionId} by ${submittedBy} needs review`);
  });
}
