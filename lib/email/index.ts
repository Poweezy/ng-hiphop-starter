import { captureQueueError } from "@/lib/observability";

import type { EmailProvider, EmailMessage, SendResult } from "./provider";
import { ConsoleProvider } from "./console-provider";
import { SendGridProvider } from "./sendgrid-provider";
import { sendCampaign, sendWelcomeEmail, sendWinnerAnnouncement } from "./campaign-service";

export { ConsoleProvider, SendGridProvider };
export { sendCampaign, sendWelcomeEmail, sendWinnerAnnouncement };
export type { EmailProvider, EmailMessage, SendResult };

export function getEmailProvider(): EmailProvider {
  const envProvider = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (envProvider === "sendgrid") {
    try {
      return new SendGridProvider();
    } catch (error) {
      captureQueueError(error, { jobType: "email-provider-init", attempt: 0 });
      console.warn("[email] SendGrid provider failed to initialise, falling back to console provider.");
      return new ConsoleProvider();
    }
  }

  if (envProvider === "console" || process.env.NODE_ENV === "development") {
    return new ConsoleProvider();
  }

  if (process.env.NODE_ENV === "production") {
    try {
      return new SendGridProvider();
    } catch (error) {
      captureQueueError(error, { jobType: "email-provider-init", attempt: 0 });
      console.error("[email] Failed to initialise SendGrid provider in production. Falling back to console provider.");
      return new ConsoleProvider();
    }
  }

  return new ConsoleProvider();
}
