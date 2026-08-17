import "server-only";

import Stripe from "stripe";

import { env, isStripeConfigured } from "@/lib/env";

let instance: Stripe | null = null;

/**
 * Returns the Stripe client, or null when no secret key is configured.
 *
 * Callers must handle null rather than assuming Stripe exists. That is what
 * lets the whole site run — including the signup and booking journeys up to
 * the payment step — before the client has a Stripe account, instead of
 * crashing at import time.
 */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;

  instance ??= new Stripe(env.stripeSecretKey!, {
    // Pin the API version so a Stripe-side upgrade cannot change behaviour
    // under a running deployment.
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: { name: "The W Gym & Sauna" },
  });

  return instance;
}

export class StripeNotConfiguredError extends Error {
  constructor() {
    super(
      "Payments are not set up yet. Add STRIPE_SECRET_KEY to the environment to enable checkout.",
    );
    this.name = "StripeNotConfiguredError";
  }
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) throw new StripeNotConfiguredError();
  return stripe;
}

export { isStripeConfigured };
