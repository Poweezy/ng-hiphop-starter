import type { EmailProvider, EmailMessage, SendResult } from "./provider";
import { ConsoleProvider } from "./console-provider";
import { SendGridProvider } from "./sendgrid-provider";
import { sendCampaign, sendWelcomeEmail, sendWinnerAnnouncement } from "./campaign-service";

export { ConsoleProvider, SendGridProvider };
export { sendCampaign, sendWelcomeEmail, sendWinnerAnnouncement };
export type { EmailProvider, EmailMessage, SendResult };

export function getEmailProvider(): EmailProvider {
  const envProvider = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (envProvider !== "sendgrid") {
      throw new Error('EMAIL_PROVIDER must be "sendgrid" in production');
    }
    return new SendGridProvider();
  }

  if (envProvider === "sendgrid") return new SendGridProvider();
  if (envProvider === "console" || (!envProvider && process.env.NODE_ENV === "development")) {
    return new ConsoleProvider();
  }
  if (!envProvider) return new ConsoleProvider();

  throw new Error(`Unsupported EMAIL_PROVIDER: ${envProvider}`);
}
