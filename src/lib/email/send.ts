import "server-only";

import { Resend } from "resend";

import { env, isEmailConfigured } from "@/lib/env";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!isEmailConfigured) return null;
  client ??= new Resend(env.resendApiKey);
  return client;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends through Resend, or logs to the console when no API key is configured.
 *
 * Falling back to a log rather than throwing means signup, booking and
 * cancellation flows are all fully walkable before the client has a Resend
 * account — and a missing key can never take down a webhook that has already
 * taken someone's money.
 */
export async function sendEmail(input: SendEmailInput): Promise<
  { ok: true; id: string | null } | { ok: false; error: string }
> {
  const resend = getClient();

  if (!resend) {
    console.info(
      [
        "",
        "─── EMAIL (not sent — RESEND_API_KEY is not set) ───",
        `To:      ${input.to}`,
        `Subject: ${input.subject}`,
        "",
        input.text,
        "───────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { ok: true, id: null };
  }

  try {
    const result = await resend.emails.send({
      from: env.emailFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (result.error) {
      console.error("Resend rejected the message:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id ?? null };
  } catch (error) {
    // Never let a mail failure surface as a 500 to a customer who has already
    // paid. Callers log and continue.
    console.error("Failed to send email:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}
