import "server-only";

import { prisma } from "@/lib/db/prisma";

/**
 * Expires abandoned payment holds.
 *
 * A PENDING booking occupies capacity until `holdExpiresAt`. The availability
 * query already ignores holds whose expiry has passed, so an un-swept row can
 * never block a slot — this sweep is housekeeping that keeps the table honest
 * and makes the admin views accurate. It is called opportunistically before
 * availability lookups and booking creation rather than on a cron, so there is
 * nothing extra to deploy.
 */
export async function expireStaleHolds(now: Date = new Date()): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING",
      holdExpiresAt: { lt: now },
    },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancellationReason: "Payment not completed in time",
      holdExpiresAt: null,
    },
  });

  return result.count;
}

/** Short, unambiguous booking reference shown to the customer and on the door. */
export function generateBookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `WB-${code}`;
}
