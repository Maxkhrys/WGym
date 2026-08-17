import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { sendBookingConfirmation } from "@/lib/email/messages";
import { sendMembershipConfirmation } from "@/lib/email/messages";
import { getStripe } from "@/lib/stripe/client";

/**
 * Stripe webhook — the single source of truth for payment state.
 *
 * Nothing in the browser can activate a membership or confirm a booking. The
 * success redirect is treated as a hint only; this handler, with a verified
 * signature, is what writes ACTIVE / CONFIRMED.
 *
 * Handlers are idempotent. Stripe retries on any non-2xx and can deliver the
 * same event more than once, so every write either sets an already-correct
 * value or is guarded by a status check.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();

  if (!stripe || !env.stripeWebhookSecret) {
    // 503 rather than 500: this is a configuration state, and Stripe will
    // retry once the keys are in place.
    return Response.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw body is required — any parsing before this invalidates the HMAC.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await onCheckoutExpired(event.data.object);
        break;

      case "invoice.paid":
        await onInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await onInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await onSubscriptionChanged(event.data.object);
        break;

      default:
        // Unhandled types are acknowledged so Stripe stops retrying them.
        break;
    }
  } catch (error) {
    // Returning 500 asks Stripe to retry, which is what we want for a
    // transient database failure.
    console.error(`Failed handling ${event.type}:`, error);
    return Response.json({ error: "Handler failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Only act on a session that is actually paid. `complete` with an unpaid
  // status happens for delayed payment methods.
  if (session.payment_status === "unpaid") return;

  const kind = session.metadata?.kind;

  if (kind === "booking") {
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) return;
    // Idempotent: a repeat delivery finds it already CONFIRMED and stops.
    if (booking.status === "CONFIRMED") return;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        holdExpiresAt: null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      },
      include: { service: true },
    });

    await prisma.payment.create({
      data: {
        kind: "BOOKING",
        status: "SUCCEEDED",
        amountCents: session.amount_total ?? booking.amountCents,
        currency: session.currency ?? booking.currency,
        description: `${booking.service.name} — ${booking.reference}`,
        userId: booking.userId,
        bookingId: booking.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      },
    });

    // Email failures must never fail the webhook — the money is taken and the
    // booking is confirmed either way.
    await sendBookingConfirmation(updated).catch((error) =>
      console.error("Booking confirmation email failed:", error),
    );

    return;
  }

  if (kind === "membership") {
    const membershipId = session.metadata?.membershipId;
    if (!membershipId) return;

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { plan: true, user: true },
    });

    if (!membership) return;
    if (membership.status === "ACTIVE") return;

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    const now = new Date();

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: "ACTIVE",
        startDate: membership.startDate ?? now,
        stripeSubscriptionId: subscriptionId,
        // A day pass is spent on the day it is bought.
        endDate: membership.plan.isDayPass
          ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
          : null,
      },
      include: { plan: true, user: true },
    });

    await prisma.payment.create({
      data: {
        kind: membership.plan.isDayPass ? "DAY_PASS" : "MEMBERSHIP",
        status: "SUCCEEDED",
        amountCents: session.amount_total ?? membership.plan.priceCents,
        currency: session.currency ?? membership.plan.currency,
        description: `${membership.plan.name} membership`,
        userId: membership.userId,
        membershipId: membership.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      },
    });

    await sendMembershipConfirmation(updated).catch((error) =>
      console.error("Membership confirmation email failed:", error),
    );
  }
}

/** A abandoned checkout releases its held slot immediately. */
async function onCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: "Checkout expired",
      holdExpiresAt: null,
    },
  });
}

/** Recurring renewals: keep the period end and status current. */
async function onInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = subscriptionIdFrom(invoice);
  if (!subscriptionId) return;

  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { plan: true },
  });

  if (!membership) return;

  const periodEnd = periodEndFrom(invoice);

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: "ACTIVE",
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
    },
  });

  // Guard against duplicate rows if Stripe redelivers the same invoice.
  const existing = invoice.id
    ? await prisma.payment.findFirst({ where: { stripeInvoiceId: invoice.id } })
    : null;

  if (!existing) {
    await prisma.payment.create({
      data: {
        kind: "MEMBERSHIP",
        status: "SUCCEEDED",
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        description: `${membership.plan.name} membership renewal`,
        userId: membership.userId,
        membershipId: membership.id,
        stripeInvoiceId: invoice.id ?? null,
      },
    });
  }
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = subscriptionIdFrom(invoice);
  if (!subscriptionId) return;

  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!membership) return;

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: "PAST_DUE" },
  });

  await prisma.payment.create({
    data: {
      kind: "MEMBERSHIP",
      status: "FAILED",
      amountCents: invoice.amount_due,
      currency: invoice.currency,
      description: "Membership payment failed",
      userId: membership.userId,
      membershipId: membership.id,
      stripeInvoiceId: invoice.id ?? null,
    },
  });
}

/** Mirrors Stripe's subscription lifecycle onto our membership status. */
async function onSubscriptionChanged(subscription: Stripe.Subscription) {
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!membership) return;

  const status = mapSubscriptionStatus(subscription.status);
  const periodEnd = subscriptionPeriodEnd(subscription);

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      ...(status === "CANCELLED" && !membership.cancelledAt
        ? { cancelledAt: new Date() }
        : {}),
    },
  });
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "PENDING" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELLED";
    case "incomplete_expired":
      return "EXPIRED";
    case "incomplete":
    case "paused":
      return "PENDING";
    default:
      return "PENDING";
  }
}

/**
 * Stripe moved the subscription pointer and period fields around between API
 * versions; these readers tolerate either shape rather than pinning us to one.
 */
function subscriptionIdFrom(invoice: Stripe.Invoice): string | null {
  const candidate = (invoice as unknown as { subscription?: unknown }).subscription;

  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object" && "id" in candidate) {
    return String((candidate as { id: unknown }).id);
  }

  const parent = (
    invoice as unknown as {
      parent?: { subscription_details?: { subscription?: unknown } };
    }
  ).parent;

  const nested = parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && "id" in nested) {
    return String((nested as { id: unknown }).id);
  }

  return null;
}

function periodEndFrom(invoice: Stripe.Invoice): Date | null {
  const line = invoice.lines?.data?.[0] as unknown as
    | { period?: { end?: number } }
    | undefined;

  const end = line?.period?.end;
  return typeof end === "number" ? new Date(end * 1000) : null;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const direct = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof direct === "number") return new Date(direct * 1000);

  const item = subscription.items?.data?.[0] as unknown as
    | { current_period_end?: number }
    | undefined;

  return typeof item?.current_period_end === "number"
    ? new Date(item.current_period_end * 1000)
    : null;
}
