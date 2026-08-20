import crypto from "crypto";
import type { EmailProvider, EmailMessage, SendResult } from "./provider";

export class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
    this.defaultFrom = process.env.EMAIL_FROM || "noreply@ng-hiphop.com";

    if (!this.apiKey) {
      throw new Error("Missing required environment variable: SENDGRID_API_KEY");
    }
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      const result = await this.sendViaSendGrid({
        to: message.to,
        from: message.from || this.defaultFrom,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<{ success: boolean; results: Array<SendResult> }> {
    const results: Array<SendResult> = [];
    for (const message of messages) {
      results.push(await this.send(message));
    }
    return { success: results.every((r) => r.success), results };
  }

  private async sendViaSendGrid(params: {
    to: string | string[];
    from: string;
    replyTo?: string;
    subject: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  }): Promise<{ messageId: string }> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    // Dynamic import to avoid build errors when @sendgrid/mail is not installed.
    let sgMail: unknown = null;
    try {
      // @ts-ignore - @sendgrid/mail is an optional dependency
      sgMail = await import("@sendgrid/mail");
    } catch {
      throw new Error("@sendgrid/mail package is not installed. Run: npm install @sendgrid/mail");
    }

    const mail = sgMail as {
      setApiKey(apiKey: string): void;
      send(data: Record<string, unknown>): Promise<[Response]>;
    };
    mail.setApiKey(this.apiKey);

    const msg: Record<string, unknown> = {
      to: recipients,
      from: params.from,
      subject: params.subject,
      ...(params.html ? { html: params.html } : {}),
      ...(params.text ? { text: params.text } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
    };

    if (params.replyTo) {
      msg.replyTo = params.replyTo;
    }

    const [response] = await mail.send(msg);
    return {
      messageId: (typeof response.headers.get === "function" ? response.headers.get("x-message-id") : undefined) || crypto.randomUUID(),
    };
  }
}
