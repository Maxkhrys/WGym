import "server-only";

import { SITE_URL, absoluteUrl } from "@/lib/site-url";

/**
 * Third-party integrations are optional at runtime. When a key is absent the
 * corresponding module degrades to a safe stub (emails log to the console,
 * checkout returns a clearly-labelled "not configured" error) rather than
 * throwing at import time. That keeps every flow walkable before the client
 * has supplied credentials.
 */

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export const env = {
  siteUrl: SITE_URL,

  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM") ?? "The W Gym & Sauna <onboarding@resend.dev>",

  seedOwnerEmail: optional("SEED_OWNER_EMAIL"),
} as const;

export const isStripeConfigured = Boolean(env.stripeSecretKey);
export const isEmailConfigured = Boolean(env.resendApiKey);

// Re-exported so existing server-side callers keep a single import, while the
// implementation lives in site-url.ts alongside the origin it depends on.
export { absoluteUrl };
