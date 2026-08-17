"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sendBookingCancellation } from "@/lib/email/messages";
import { cancellationWindow } from "@/lib/queries/account";
import { createPortalSession } from "@/lib/stripe/checkout";
import { cancelBookingSchema } from "@/lib/validation/booking";

export type AccountActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

/**
 * Member-initiated booking cancellation.
 *
 * Ownership and the cancellation window are both re-checked here. The button
 * is hidden in the UI once the window closes, but that is presentation only —
 * a request for someone else's booking, or one inside the notice period, is
 * rejected on the server.
 */
export async function cancelBooking(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/account/bookings");

  const parsed = cancelBookingSchema.safeParse({
    bookingId: formData.get("bookingId"),
    reason: formData.get("reason") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "That booking could not be found." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { service: true },
  });

  if (!booking) {
    return { status: "error", message: "That booking could not be found." };
  }

  const ownsBooking =
    booking.userId === user.id ||
    booking.customerEmail.toLowerCase() === user.email.toLowerCase();

  if (!ownsBooking) {
    // Same message as "not found" — confirming the booking exists would leak
    // that someone else holds it.
    return { status: "error", message: "That booking could not be found." };
  }

  if (booking.status === "CANCELLED") {
    return { status: "success", message: "That booking was already cancelled." };
  }

  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    return {
      status: "error",
      message: "That booking can no longer be cancelled online.",
    };
  }

  const window = cancellationWindow(booking.startsAt);
  if (!window.canCancel) {
    return {
      status: "error",
      message: `Bookings can only be cancelled online more than ${window.freeUntilHours} hours ahead. Please contact us instead.`,
    };
  }

  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: parsed.data.reason?.trim() || "Cancelled by member",
      holdExpiresAt: null,
    },
    include: { service: true },
  });

  await sendBookingCancellation(cancelled).catch((error) =>
    console.error("Cancellation email failed:", error),
  );

  // The slot is now free again, so any cached view of it must be discarded.
  revalidatePath("/account/bookings");
  revalidatePath("/account");

  return {
    status: "success",
    message: `Booking ${booking.reference} has been cancelled.`,
  };
}

/** Opens the Stripe Customer Portal for subscription and invoice self-service. */
export async function openBillingPortal(): Promise<void> {
  const user = await requireUser("/account");

  const session = await createPortalSession(user.id, "/account");

  if (!session.ok) {
    redirect(`/account?billing=unavailable`);
  }

  redirect(session.url);
}

/** Profile edits a member can make themselves. */
export async function updateProfile(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/account/profile");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const marketingOptIn = formData.get("marketingOptIn") === "on";

  if (name.length < 2 || name.length > 120) {
    return { status: "error", message: "Enter your name." };
  }

  if (phone && !/^[+0-9()\s-]{6,32}$/.test(phone)) {
    return { status: "error", message: "Enter a valid phone number." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { marketingOptIn: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone || null,
      marketingOptIn,
      // Stamp the time only when consent is newly given, so the record shows
      // when the member actually opted in rather than when they last saved.
      ...(marketingOptIn && !existing?.marketingOptIn
        ? { marketingOptInAt: new Date() }
        : {}),
      ...(!marketingOptIn ? { marketingOptInAt: null } : {}),
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");

  return { status: "success", message: "Your details have been saved." };
}
