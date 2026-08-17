"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import { renderEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { clientKey, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent" };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.email("Enter a valid email address.").max(254),
  subject: z.string().trim().max(120).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more so we can help.")
    .max(4000, "That message is too long — please shorten it."),
  // Honeypot: a real person never sees or fills this.
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function sendEnquiry(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const requestHeaders = await headers();

  const limit = rateLimit(clientKey(requestHeaders, "contact"), RATE_LIMITS.contact);
  if (!limit.success) {
    return {
      status: "error",
      message: "You have sent a few messages already. Please try again later.",
    };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") ?? undefined,
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  // A filled honeypot means a bot. Report success so it learns nothing.
  if (parsed.data.website) {
    return { status: "sent" };
  }

  const settings = await getSettings();
  const destination = settings.contactEmail || siteConfig.contact.email;

  if (!destination) {
    return {
      status: "error",
      message:
        "We cannot receive messages just yet. Please reach us on Instagram in the meantime.",
    };
  }

  const { html, text } = renderEmail({
    preheader: `Website enquiry from ${parsed.data.name}`,
    heading: "New website enquiry",
    body: [parsed.data.message],
    details: [
      { label: "From", value: parsed.data.name },
      { label: "Email", value: parsed.data.email },
      ...(parsed.data.subject
        ? [{ label: "Subject", value: parsed.data.subject }]
        : []),
    ],
    footerNote: "Reply directly to this email to reach the sender.",
  });

  const result = await sendEmail({
    to: destination,
    subject: parsed.data.subject
      ? `Enquiry: ${parsed.data.subject}`
      : `Website enquiry from ${parsed.data.name}`,
    html,
    text,
    // So hitting reply goes to the customer, not to ourselves.
    replyTo: parsed.data.email,
  });

  if (!result.ok) {
    return {
      status: "error",
      message:
        "We could not send that just now. Please try again, or email us directly.",
    };
  }

  return { status: "sent" };
}
