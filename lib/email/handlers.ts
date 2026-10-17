/**
 * Queue task handlers for the email subsystem.
 *
 * Registered on module load from app/db.ts so every server entrypoint with
 * database access also has the workers' handlers available — same pattern as
 * registerModerationHandlers() in lib/moderation.ts.
 */

import { registerTask, type Task } from '@/lib/queue';
import { captureQueueError } from '@/lib/observability';
import { sendCampaignToSubscribers } from './campaign-service';

export const CAMPAIGN_SEND_EMAIL_TASK = 'campaign.send_email';

export type CampaignEmailTaskPayload = {
  campaignId: string;
  /** Recipient subscriber IDs resolved when the campaign was queued. */
  recipientIds?: string[];
  /** Carried for auditability only — the campaign row is the content of record. */
  subject?: string;
  body?: string;
};

export function registerEmailHandlers() {
  registerTask<CampaignEmailTaskPayload>(CAMPAIGN_SEND_EMAIL_TASK, async (task: Task<CampaignEmailTaskPayload>) => {
    const { campaignId, recipientIds } = task.payload;

    if (!campaignId) {
      // Malformed payload — retrying can never succeed. Throwing lets the
      // queue's backoff and dead-letter machinery record the failure.
      throw new Error('campaign.send_email payload is missing campaignId');
    }

    try {
      // Consent filtering and campaign status transitions live inside
      // sendCampaignToSubscribers, so this handler and any direct callers
      // share one implementation. Expected states ("already sent", zero
      // consented recipients) resolve without throwing; unexpected errors
      // propagate so the queue can retry the batch.
      const result = await sendCampaignToSubscribers(campaignId, recipientIds ?? []);
      if (!result.success) {
        captureQueueError(new Error(result.error ?? 'Campaign send failed'), {
          jobId: task.id,
          jobType: CAMPAIGN_SEND_EMAIL_TASK,
          attempt: task.attempts,
        });
      }
    } catch (error) {
      captureQueueError(error, {
        jobId: task.id,
        jobType: CAMPAIGN_SEND_EMAIL_TASK,
        attempt: task.attempts,
      });
      // Re-throw so the queue retries with backoff (matches moderation.ts).
      throw error;
    }
  });
}
