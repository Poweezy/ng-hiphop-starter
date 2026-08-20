import crypto from "crypto";
import type { EmailProvider, EmailMessage, SendResult } from "./provider";

export class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    console.log("[EMAIL] ──────────────────────────────────────────────");
    console.log(`[EMAIL] To:      ${to}`);
    console.log(`[EMAIL] From:    ${message.from || "noreply@ng-hiphop.com"}`);
    console.log(`[EMAIL] ReplyTo: ${message.replyTo || "noreply@ng-hiphop.com"}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);
    if (message.headers) {
      console.log(`[EMAIL] Headers: ${JSON.stringify(message.headers)}`);
    }
    if (message.html) {
      console.log(`[EMAIL] HTML:    ${message.html}`);
    }
    if (message.text) {
      console.log(`[EMAIL] Text:    ${message.text}`);
    }
    console.log("[EMAIL] ──────────────────────────────────────────────");

    return { success: true, messageId: `console-${crypto.randomUUID()}` };
  }

  async sendBatch(messages: EmailMessage[]): Promise<{ success: boolean; results: Array<SendResult> }> {
    const results: Array<SendResult> = [];
    for (const message of messages) {
      results.push(await this.send(message));
    }
    return { success: results.every((r) => r.success), results };
  }
}
