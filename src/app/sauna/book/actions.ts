"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LEGAL_VERSIONS, bookingPolicy } from "@/config/site";
import { getSessionUser } from "@/lib/auth/guards";
import { createBookingHold } from "@/lib/booking/create";
import { prisma } from "@/lib/db/prisma";
import { sendBookingConfirmation } from "@/lib/email/messages";
import { getServiceBySlug } from "@/lib/queries/services";
import { clientKey, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isStripeConfigured } from "@/lib/stripe/client";
import { createBookingCheckout } from "@/lib/stripe/checkout";
import { createBookingSchema } from "@/lib/validation/booking";

export type BookingActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "confirmed"; reference: string };

/**
 * Creates the booking and starts payment.
 *
 * Order matters: the slot is held first (inside a serialisable transaction),
 * then Stripe is contacted. Holding first means the customer can never pay for
 * a slot that was taken while the payment page was loading; if checkout then
 * fails, the hold simply expires and the seat returns.
 */
export async function createBooking(
  _previous: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const requestHeaders = await headers();

  const limit = rateLimit(clientKey(requestHeaders, "booking"), RATE_LIMITS.booking);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many booking attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const parsed = createBookingSchema.safeParse({
    serviceSlug: formData.get("serviceSlug"),
    startsAt: formData.get("startsAt"),
    guestCount: formData.get("guestCount"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone") ?? undefined,
    acceptTerms: formData.get("acceptTerms") === "on",
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const input = parsed.data;

  const service = await getServiceBySlug(input.serviceSlug);
  if (!service) {
    return { status: "error", message: "That session is no longer available." };
  }

  const user = await getSessionUser();

  if (!user && !bookingPolicy.allowGuestBooking) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/sauna/book")}`);
  }

  const held = await createBookingHold({
    service,
    startsAt: new Date(input.startsAt),
    guestCount: input.guestCount,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone || null,
    userId: user?.id ?? null,
  });

  if (!held.ok) {
    return { status: "error", message: held.reason };
  }

  // Record consent against the account when there is one. Guests have no user
  // row to attach an audit trail to, so their acceptance lives with the
  // booking record itself.
  if (user) {
    await prisma.termsAcceptance.create({
      data: {
        userId: user.id,
        document: "CANCELLATION_POLICY",
        version: LEGAL_VERSIONS.cancellationPolicy,
        ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: requestHeaders.get("user-agent") ?? null,
      },
    });

    // Marketing consent is opt-in and stored separately from terms, never
    // implied by completing a booking.
    if (input.marketingOptIn) {
      await prisma.user.update({
        where: { id: user.id },
        data: { marketingOptIn: true, marketingOptInAt: new Date() },
      });
    }
  }

  // Without Stripe configured there is nothing to charge against. The booking
  // is confirmed so the flow stays testable, and the state is made obvious to
  // the customer rather than pretending a payment happened.
  if (!isStripeConfigured) {
    const confirmed = await prisma.booking.update({
      where: { id: held.bookingId },
      data: {
        status: "CONFIRMED",
        holdExpiresAt: null,
        notes: "Confirmed without payment — Stripe is not configured.",
      },
      include: { service: true },
    });

    await sendBookingConfirmation(confirmed).catch((error) =>
      console.error("Booking confirmation email failed:", error),
    );

    return { status: "confirmed", reference: held.reference };
  }

  const checkout = await createBookingCheckout({ bookingId: held.bookingId });

  if (!checkout.ok) {
    // Release the hold immediately rather than making the slot wait out its
    // expiry for a failure we already know about.
    await prisma.booking.updateMany({
      where: { id: held.bookingId, status: "PENDING" },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Could not start payment",
        holdExpiresAt: null,
      },
    });

    return { status: "error", message: checkout.reason };
  }

  redirect(checkout.url);
}
