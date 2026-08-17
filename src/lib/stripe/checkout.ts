import "server-only";

import type Stripe from "stripe";

import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";

/**
 * Stripe Checkout sessions.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. Amounts are read from the database row (plan or booking) that the server
 *     just created or fetched. The client never supplies a price, a currency
 *     or a quantity that affects the total.
 *  2. Nothing is marked paid here. The redirect back from Stripe is only a
 *     hint that the customer got to the end — activation happens in the
 *     signature-verified webhook, which is the only trustworthy signal.
 */

/** Reuses the customer if we have one, otherwise creates and stores it. */
export async function ensureStripeCustomer(userId: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true, phone: true },
  });

  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    phone: user.phone ?? undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Checkout for a sauna booking.
 *
 * Always a one-off payment built from `booking.amountCents`, which the booking
 * transaction calculated from the service row.
 */
export async function createBookingCheckout({
  bookingId,
}: {
  bookingId: string;
}): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      reason: "Payments are not set up yet. Please contact us to confirm this booking.",
    };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking || booking.status !== "PENDING") {
    return { ok: false, reason: "That booking is no longer awaiting payment." };
  }

  const customerId = booking.userId
    ? await ensureStripeCustomer(booking.userId)
    : null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerId
      ? { customer: customerId }
      : { customer_email: booking.customerEmail }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency,
          unit_amount: booking.amountCents,
          product_data: {
            name: `${booking.service.name} — ${siteConfig.shortName}`,
            description: describeBooking(booking.startsAt, booking.guestCount),
          },
        },
      },
    ],
    // The webhook uses these to find the booking. Metadata is the only thing
    // that survives the round trip reliably.
    metadata: {
      kind: "booking",
      bookingId: booking.id,
      reference: booking.reference,
    },
    payment_intent_data: {
      metadata: { kind: "booking", bookingId: booking.id },
    },
    // Stripe should give up before our hold does, so a customer never pays for
    // a slot that has already been released.
    expires_at: expiryFor(booking.holdExpiresAt),
    success_url: absoluteUrl(
      `/sauna/book/confirmed?ref=${booking.reference}&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: absoluteUrl(`/sauna/book?cancelled=${booking.reference}`),
  });

  if (!session.url) {
    return { ok: false, reason: "Stripe did not return a payment page." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { ok: true, url: session.url };
}

/**
 * Checkout for a membership.
 *
 * Recurring plans use `mode: "subscription"`; day passes are a single payment.
 * A configured `stripePriceId` wins, so the client can manage pricing in the
 * Stripe dashboard; otherwise the amount is built from the plan row.
 */
export async function createMembershipCheckout({
  membershipId,
}: {
  membershipId: string;
}): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      reason:
        "Payments are not set up yet. Please contact us and we will get you started manually.",
    };
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { plan: true, user: true },
  });

  if (!membership || membership.status !== "PENDING") {
    return { ok: false, reason: "That membership is no longer awaiting payment." };
  }

  const { plan } = membership;
  const customerId = await ensureStripeCustomer(membership.userId);

  const recurring = !plan.isDayPass && plan.interval !== "ONE_TIME";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    plan.stripePriceId
      ? { price: plan.stripePriceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.priceCents,
            product_data: {
              name: `${plan.name} membership — ${siteConfig.shortName}`,
              description: plan.description,
            },
            ...(recurring
              ? {
                  recurring: {
                    interval: plan.interval === "YEAR" ? ("year" as const) : ("month" as const),
                  },
                }
              : {}),
          },
        },
  ];

  // A joining fee is a separate one-off line. In subscription mode Checkout
  // bills non-recurring line items on the first invoice only, which is exactly
  // the behaviour a joining fee needs — so the same line works either way.
  if (plan.joiningFeeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: plan.currency,
        unit_amount: plan.joiningFeeCents,
        product_data: { name: `Joining fee — ${plan.name}` },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    customer: customerId ?? undefined,
    ...(customerId ? {} : { customer_email: membership.user.email }),
    line_items: lineItems,
    metadata: {
      kind: "membership",
      membershipId: membership.id,
      userId: membership.userId,
      planSlug: plan.slug,
    },
    ...(recurring
      ? {
          subscription_data: {
            metadata: { kind: "membership", membershipId: membership.id },
          },
        }
      : {
          payment_intent_data: {
            metadata: { kind: "membership", membershipId: membership.id },
          },
        }),
    // Architecture for discount codes: Stripe promotion codes are enabled, so
    // a code created in the dashboard (or mirrored from our DiscountCode table)
    // works without further changes here.
    allow_promotion_codes: true,
    success_url: absoluteUrl(
      `/signup/complete?membership=${membership.id}&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: absoluteUrl(`/signup?plan=${plan.slug}&cancelled=1`),
  });

  if (!session.url) {
    return { ok: false, reason: "Stripe did not return a payment page." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { ok: true, url: session.url };
}

/** Opens the Stripe Customer Portal for subscription self-service. */
export async function createPortalSession(
  userId: string,
  returnPath = "/account",
): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, reason: "Payments are not set up yet." };
  }

  const customerId = await ensureStripeCustomer(userId);
  if (!customerId) {
    return { ok: false, reason: "No billing account found for you yet." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl(returnPath),
  });

  return { ok: true, url: session.url };
}

function describeBooking(startsAt: Date, guestCount: number): string {
  const when = new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startsAt);

  return `${when} · ${guestCount} guest${guestCount === 1 ? "" : "s"}`;
}

/**
 * Stripe requires an expiry between 30 minutes and 24 hours from now. Our hold
 * is shorter than that floor, so the session is given the minimum and the hold
 * remains the tighter constraint — the webhook re-checks the booking is still
 * PENDING before confirming.
 */
function expiryFor(holdExpiresAt: Date | null): number {
  const minimum = Math.floor(Date.now() / 1000) + 30 * 60 + 60;
  if (!holdExpiresAt) return minimum;
  return Math.max(minimum, Math.floor(holdExpiresAt.getTime() / 1000));
}
