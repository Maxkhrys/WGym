import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { bookingPolicy } from "@/config/site";
import { assertSlotBookable } from "@/lib/booking/availability";
import { expireStaleHolds, generateBookingReference } from "@/lib/booking/holds";
import { prisma } from "@/lib/db/prisma";
import type { SaunaServiceRecord } from "@/lib/queries/services";

export type CreateHoldInput = {
  service: SaunaServiceRecord;
  startsAt: Date;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  userId?: string | null;
  createdByAdmin?: boolean;
  /** Admin-created bookings skip payment and are confirmed immediately. */
  confirmImmediately?: boolean;
  notes?: string | null;
};

export type CreateHoldResult =
  | { ok: true; bookingId: string; reference: string; amountCents: number }
  | { ok: false; reason: string };

/**
 * Creates a booking, holding capacity for the payment window.
 *
 * Double-booking protection is a transaction-scoped Postgres advisory lock
 * keyed on (service, slot start). Every writer competing for the same slot
 * must take the same lock before counting existing guests, so the count and
 * the insert are effectively atomic with respect to each other: no other
 * booking for that slot can commit in between. The lock is released
 * automatically when the transaction ends, including on error.
 *
 * An earlier version also ran the transaction at SERIALIZABLE. That was
 * dropped deliberately — once the advisory lock provides mutual exclusion on
 * the exact contended resource it adds no additional safety, while costing
 * serialisation-failure retries under load and breaking outright behind a
 * connection pooler, which rejects `SET TRANSACTION ISOLATION LEVEL` on a
 * reused connection. Locking the specific row-set is both stricter here and
 * more portable.
 *
 * The price is read from the service row inside the transaction and never from
 * the request, so a tampered client cannot set its own amount.
 */
export async function createBookingHold(
  input: CreateHoldInput,
): Promise<CreateHoldResult> {
  const now = new Date();
  await expireStaleHolds(now);

  const attempt = async (): Promise<CreateHoldResult> =>
    prisma.$transaction(
      async (tx) => {
        // Serialise everyone competing for this exact slot. The key is derived
        // from the service id and the slot's epoch minutes, which is stable
        // across processes and deployments.
        const lockKey = advisoryLockKey(input.service.id, input.startsAt);
        // $executeRaw, not $queryRaw: pg_advisory_xact_lock returns `void`,
        // which the client cannot deserialise as a result column.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

        const check = await assertSlotBookable({
          service: input.service,
          startsAt: input.startsAt,
          guestCount: input.guestCount,
          now,
          tx,
        });

        if (!check.ok) return { ok: false as const, reason: check.reason };

        // Server-side price. Exclusive hire is a flat rate for the room;
        // everything else is per guest.
        const amountCents = input.service.isExclusive
          ? input.service.priceCents
          : input.service.priceCents * input.guestCount;

        const confirmed = input.confirmImmediately === true;

        const booking = await tx.booking.create({
          data: {
            reference: generateBookingReference(),
            serviceId: input.service.id,
            userId: input.userId ?? null,
            customerName: input.customerName,
            customerEmail: input.customerEmail.toLowerCase(),
            customerPhone: input.customerPhone ?? null,
            startsAt: input.startsAt,
            endsAt: check.endsAt,
            guestCount: input.guestCount,
            amountCents,
            currency: input.service.currency,
            status: confirmed ? "CONFIRMED" : "PENDING",
            holdExpiresAt: confirmed
              ? null
              : new Date(now.getTime() + bookingPolicy.holdMinutes * 60_000),
            createdByAdmin: input.createdByAdmin ?? false,
            notes: input.notes ?? null,
          },
          select: { id: true, reference: true, amountCents: true },
        });

        return {
          ok: true as const,
          bookingId: booking.id,
          reference: booking.reference,
          amountCents: booking.amountCents,
        };
      },
      {
        // The advisory lock queues writers for a busy slot, so allow a little
        // longer than Prisma's 2s default before giving up on acquiring it.
        maxWait: 10_000,
        timeout: 15_000,
      },
    );

  // Retry lock contention and booking-reference collisions a couple of times.
  for (let tries = 0; tries < 3; tries += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (isRetryable(error) && tries < 2) continue;

      console.error("Booking creation failed:", error);
      return {
        ok: false,
        reason: "We could not hold that slot. Please try again.",
      };
    }
  }

  return { ok: false, reason: "We could not hold that slot. Please try again." };
}

/**
 * Postgres advisory locks take a 64-bit integer. Hashing the service id with
 * the slot's epoch-minute value gives a key that collides only across
 * unrelated slots, where a brief extra wait is harmless.
 */
function advisoryLockKey(serviceId: string, startsAt: Date): bigint {
  let hash = 0n;
  for (const char of serviceId) {
    hash = (hash * 31n + BigInt(char.charCodeAt(0))) % 0x7fffffffn;
  }
  const minutes = BigInt(Math.floor(startsAt.getTime() / 60_000));
  return (hash * 1_000_003n + minutes) % 0x7fffffffffffffffn;
}

function isRetryable(error: unknown): boolean {
  // 40001 serialisation failure, 40P01 deadlock, P2002 unique collision on the
  // generated booking reference.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return true;
    if (error.code === "P2034") return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("40001") ||
    message.includes("40P01") ||
    message.includes("could not serialize")
  );
}
