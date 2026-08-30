import { prisma } from "@/app/db";
import { getEmailProvider } from "./index";
import type { EmailMessage } from "./provider";

const provider = getEmailProvider();

const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@ng-hiphop.com";
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || "noreply@ng-hiphop.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function buildUnsubscribeLink(subscriberId: string): string {
  return `${APP_URL}/api/unsubscribe?subscriberId=${subscriberId}`;
}

function buildCompetitionUrl(competitionId: string): string {
  return `${APP_URL}/competitions/${competitionId}`;
}

/**
 * Builds the marketing email footer with unsubscribe link.
 */
function buildMarketingFooter(subscriberId: string): string {
  const unsubscribeUrl = buildUnsubscribeLink(subscriberId);
  return `
    <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="font-size: 12px; color: #6b7280; text-align: center; line-height: 1.6;">
      You are receiving this email because you subscribed to Nerd Gauge updates.
      <br />
      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
        Unsubscribe
      </a>
    </p>
  `;
}

/**
 * Resolves recipient subscriber IDs from a campaign's recipientFilter and recipientIds.
 */
function resolveRecipientIds(campaign: {
  recipientFilter: string | null;
  recipientIds: string | null;
}): Promise<string[]> {
  if (campaign.recipientIds) {
    try {
      return Promise.resolve(JSON.parse(campaign.recipientIds) as string[]);
    } catch {
      return Promise.resolve([]);
    }
  }

  if (campaign.recipientFilter) {
    try {
      const filter = JSON.parse(campaign.recipientFilter) as Record<string, unknown>;
      const where: Record<string, unknown> = {
        subscriptionStatus: "active",
        consentStatus: "granted",
      };

      if (filter.competitionId) {
        where.competitionId = filter.competitionId;
      }
      if (filter.source) {
        where.source = filter.source;
      }
      if (filter.createdAfter) {
        where.createdAt = { gte: new Date(filter.createdAfter as string) };
      }
      if (filter.createdBefore) {
        where.createdAt = { lte: new Date(filter.createdBefore as string) };
      }

      return prisma.subscriber.findMany({
        where,
        select: { id: true },
      }).then((subscribers) => subscribers.map((s) => s.id));
    } catch {
      return Promise.resolve([]);
    }
  }

  return prisma.subscriber.findMany({
    where: {
      subscriptionStatus: "active",
      consentStatus: "granted",
    },
    select: { id: true },
  }).then((subscribers) => subscribers.map((s) => s.id));
}

/**
 * Sends an email campaign to all matching subscribers.
 */
export async function sendCampaign(campaignId: string): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return { success: false, sentCount: 0, error: "Campaign not found" };
  }

  if (campaign.status === "sent") {
    return { success: false, sentCount: 0, error: "Campaign already sent" };
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "sending" },
  });

  const subscriberIds = await resolveRecipientIds(campaign);

  if (subscriberIds.length === 0) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "sent", sentAt: new Date() },
    });
    return { success: true, sentCount: 0 };
  }

  const subscribers = await prisma.subscriber.findMany({
    where: { id: { in: subscriberIds } },
  });

  const messages: EmailMessage[] = subscribers.map((subscriber) => ({
    to: subscriber.email,
    subject: campaign.subject,
    html: `${campaign.body}${buildMarketingFooter(subscriber.id)}`,
    from: DEFAULT_FROM,
    replyTo: DEFAULT_REPLY_TO,
  }));

  const result = await provider.sendBatch(messages);

  const successfulIds = subscribers
    .filter((_, index) => result.results[index]?.success)
    .map((s) => s.id);

  await prisma.subscriber.updateMany({
    where: { id: { in: successfulIds } },
    data: { lastEmailSentAt: new Date() },
  });

  const failedCount = messages.length - successfulIds.length;
  const status = failedCount === 0 ? "sent" : "failed";

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status,
      sentAt: new Date(),
    },
  });

  return {
    success: result.success,
    sentCount: successfulIds.length,
    error: failedCount > 0 ? `${failedCount} email(s) failed to send` : undefined,
  };
}

/**
 * Sends a welcome email to a new subscriber.
 */
export async function sendWelcomeEmail(subscriberId: string): Promise<{ success: boolean; error?: string }> {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    include: { competition: true },
  });

  if (!subscriber) {
    return { success: false, error: "Subscriber not found" };
  }

  if (subscriber.subscriptionStatus === "unsubscribed") {
    return { success: false, error: "Subscriber is unsubscribed" };
  }

  const competitionUrl = buildCompetitionUrl(subscriber.competitionId);
  const firstName = subscriber.name?.split(" ")[0] || "there";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">
        Welcome to Nerd Gauge, ${firstName}!
      </h1>
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Thanks for subscribing to updates for <strong>${subscriber.competition.title}</strong>.
        You'll be the first to know about new submissions, competition updates, and winner announcements.
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        <a href="${competitionUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
          View the competition
        </a>
      </p>
      ${buildMarketingFooter(subscriber.id)}
    </div>
  `;

  const result = await provider.send({
    to: subscriber.email,
    subject: `Welcome to Nerd Gauge - ${subscriber.competition.title}`,
    html,
    from: DEFAULT_FROM,
    replyTo: DEFAULT_REPLY_TO,
  });

  if (result.success) {
    await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { lastEmailSentAt: new Date() },
    });
  }

  return result;
}

/**
 * Sends a winner announcement email for a competition.
 */
export async function sendWinnerAnnouncement(
  competitionId: string,
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const competition = await prisma.lyricCompetition.findUnique({
    where: { id: competitionId },
    include: {
      winners: {
        orderBy: { position: "asc" },
        include: {
          submission: {
            include: {
              _count: { select: { winners: true } },
            },
          },
          prize: true,
        },
      },
    },
  });

  if (!competition) {
    return { success: false, sentCount: 0, error: "Competition not found" };
  }

  if (competition.winners.length === 0) {
    return { success: false, sentCount: 0, error: "No winners announced yet" };
  }

  const subscribers = await prisma.subscriber.findMany({
    where: {
      competitionId,
      subscriptionStatus: "active",
      consentStatus: "granted",
    },
  });

  if (subscribers.length === 0) {
    return { success: true, sentCount: 0 };
  }

  const competitionUrl = buildCompetitionUrl(competitionId);
  const winnerList = competition.winners
    .map(
      (winner) =>
        `<li style="margin: 8px 0;">
          <strong>${winner.position}${getOrdinalSuffix(winner.position)} Place:</strong>
          ${winner.submission.artistAlias}
          ${winner.prizeName ? `— ${winner.prizeName}` : ""}
          ${winner.cashAmount ? `(${winner.cashAmount})` : ""}
        </li>`,
    )
    .join("");

  const messages: EmailMessage[] = subscribers.map((subscriber) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">
          Winners Announced: ${competition.title}
        </h1>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Congratulations to our winners! Here are the results for <strong>${competition.title}</strong>:
        </p>
        <ul style="font-size: 16px; line-height: 1.6; color: #374151; padding-left: 20px;">
          ${winnerList}
        </ul>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          <a href="${competitionUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
            View full results
          </a>
        </p>
        ${buildMarketingFooter(subscriber.id)}
      </div>
    `;

    return {
      to: subscriber.email,
      subject: `Winners Announced: ${competition.title}`,
      html,
      from: DEFAULT_FROM,
      replyTo: DEFAULT_REPLY_TO,
    };
  });

  const result = await provider.sendBatch(messages);

  const successfulIds = subscribers
    .filter((_, index) => result.results[index]?.success)
    .map((s) => s.id);

  await prisma.subscriber.updateMany({
    where: { id: { in: successfulIds } },
    data: { lastEmailSentAt: new Date() },
  });

  return {
    success: result.success,
    sentCount: successfulIds.length,
    error: subscribers.length - successfulIds.length > 0
      ? `${subscribers.length - successfulIds.length} email(s) failed to send`
      : undefined,
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
