import "server-only";

import { bookingPolicy } from "@/config/site";
import { prisma } from "@/lib/db/prisma";

/**
 * The member's current membership.
 *
 * A user can accumulate rows over time (an old cancelled one, a new active
 * one, an abandoned PENDING attempt), so this picks the one that actually
 * governs access: an active or past-due membership first, then the most recent
 * of anything else.
 */
export async function getCurrentMembership(userId: string) {
  const live = await prisma.membership.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PAST_DUE"] } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (live) return live;

  return prisma.membership.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUpcomingBookings(userId: string, email: string) {
  return prisma.booking.findMany({
    where: {
      // Match on the account, and also on the address for sessions booked as a
      // guest before the member had an account.
      OR: [{ userId }, { customerEmail: email.toLowerCase() }],
      startsAt: { gte: new Date() },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: { service: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function getPastBookings(userId: string, email: string, take = 20) {
  return prisma.booking.findMany({
    where: {
      // Two independent OR groups, so they have to be combined under AND
      // rather than sitting as sibling keys: whose booking it is, and whether
      // it is finished.
      AND: [
        { OR: [{ userId }, { customerEmail: email.toLowerCase() }] },
        {
          OR: [
            { startsAt: { lt: new Date() } },
            { status: { in: ["CANCELLED", "COMPLETED", "NO_SHOW", "REFUNDED"] } },
          ],
        },
      ],
    },
    include: { service: true },
    orderBy: { startsAt: "desc" },
    take,
  });
}

export async function getPayments(userId: string, take = 20) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

type RawBooking = Awaited<ReturnType<typeof getUpcomingBookings>>[number];

/**
 * A booking plus the time-dependent decisions about it.
 *
 * These are resolved here, against a single `now`, rather than in the
 * components. That keeps rendering pure (no clock reads during render), and
 * means every card on a page agrees about what time it is instead of each
 * computing its own. The server re-checks the window again on submit, so this
 * only governs what the UI offers.
 */
export type BookingWithService = RawBooking & {
  isPast: boolean;
  canCancel: boolean;
};

export function decorateBookings(
  bookings: RawBooking[],
  now: Date = new Date(),
): BookingWithService[] {
  return bookings.map((booking) => {
    const isPast = booking.startsAt.getTime() < now.getTime();
    const open = booking.status === "CONFIRMED" || booking.status === "PENDING";

    return {
      ...booking,
      isPast,
      canCancel:
        open && !isPast && cancellationWindow(booking.startsAt, now).canCancel,
    };
  });
}

/**
 * Whether a member may still cancel this booking themselves.
 *
 * Inside the notice window the slot can no longer realistically be resold, so
 * self-service cancellation closes and the member is pointed at contacting us
 * — rather than silently failing or quietly refunding.
 */
export function cancellationWindow(startsAt: Date, now: Date = new Date()) {
  const hoursUntil = (startsAt.getTime() - now.getTime()) / 3_600_000;
  const freeUntilHours = bookingPolicy.freeCancellationHours;

  return {
    canCancel: hoursUntil >= freeUntilHours,
    hoursUntil,
    freeUntilHours,
  };
}
