import "server-only";

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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM") ?? "The W Gym & Sauna <onboarding@resend.dev>",

  seedOwnerEmail: optional("SEED_OWNER_EMAIL"),
} as const;

export const isStripeConfigured = Boolean(env.stripeSecretKey);
export const isEmailConfigured = Boolean(env.resendApiKey);

/** Absolute URL helper — Stripe redirects and emails must not use relative paths. */
export function absoluteUrl(path: string): string {
  const base = env.siteUrl.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
