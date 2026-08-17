import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SaunaServiceRecord } from "@/lib/queries/services";
import {
  addDaysToKey,
  dateKeyRange,
  dayOfWeekFor,
  endOfBusinessDay,
  instantAt,
  startOfBusinessDay,
  todayKey,
  type DateKey,
} from "@/lib/booking/time";

/**
 * Server-side slot generation.
 *
 * Availability is NEVER computed on the client. The browser asks for a date
 * and receives a list of slots; the same function is then re-run inside the
 * booking transaction to confirm the chosen slot is still real. That is what
 * stops a stale or hand-crafted request from booking a closed day, a blocked
 * period, or a slot that filled while the customer was deciding.
 */

export type SlotState = "available" | "limited" | "full";

export type Slot = {
  /** UTC instant, ISO string — the wire format. */
  startsAt: string;
  endsAt: string;
  /** Europe/Dublin wall clock, e.g. "18:30". */
  label: string;
  state: SlotState;
  /** Guests that can still be booked into this slot. */
  remaining: number;
  capacity: number;
};

export type DayAvailability = {
  date: DateKey;
  /** False when closed, fully blocked, or entirely outside the booking window. */
  open: boolean;
  slots: Slot[];
  /** Highest `remaining` across the day, for the date-strip indicator. */
  bestRemaining: number;
};

/** Below this fraction of capacity a slot is shown as "limited". */
const LIMITED_THRESHOLD = 0.5;

/**
 * Bookings that consume capacity: confirmed ones, and pending ones whose
 * payment hold has not yet expired. Anything cancelled, refunded or expired
 * releases its seats.
 */
function capacityConsumingWhere(now: Date): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: ["CONFIRMED", "COMPLETED"] } },
      {
        status: "PENDING" as const,
        holdExpiresAt: { gt: now },
      },
    ],
  };
}

export async function getAvailability({
  service,
  from,
  days,
  now = new Date(),
}: {
  service: SaunaServiceRecord;
  from: DateKey;
  days: number;
  now?: Date;
}): Promise<DayAvailability[]> {
  const dates = dateKeyRange(from, days);
  if (dates.length === 0) return [];

  const rangeStart = startOfBusinessDay(dates[0]);
  const rangeEnd = endOfBusinessDay(dates[dates.length - 1]);

  // Three queries for the whole range rather than three per day.
  //
  // Awaited sequentially, never `Promise.all` — see the warning in
  // src/lib/db/prisma.ts. All three are indexed lookups, so running them in
  // series costs a fraction of a millisecond and avoids the parameter
  // cross-talk that parallel dispatch causes on this driver.
  const rules = await prisma.availabilityRule.findMany({
    where: {
      active: true,
      OR: [{ serviceId: service.id }, { serviceId: null }],
    },
  });

  const blocks = await prisma.blockedTime.findMany({
    where: {
      OR: [{ serviceId: service.id }, { serviceId: null }],
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      serviceId: service.id,
      startsAt: { gte: rangeStart, lt: rangeEnd },
      ...capacityConsumingWhere(now),
    },
    select: { startsAt: true, endsAt: true, guestCount: true },
  });

  // A service-specific rule replaces the house hours for that weekday rather
  // than adding to them, so /admin can shorten sauna hours without editing the
  // gym's opening times.
  const rulesByDay = new Map<number, { startMinute: number; endMinute: number }[]>();
  for (let day = 0; day < 7; day += 1) {
    const specific = rules.filter(
      (rule) => rule.dayOfWeek === day && rule.serviceId === service.id,
    );
    const house = rules.filter(
      (rule) => rule.dayOfWeek === day && rule.serviceId === null,
    );
    const chosen = specific.length > 0 ? specific : house;
    if (chosen.length > 0) {
      rulesByDay.set(
        day,
        chosen.map((rule) => ({
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
        })),
      );
    }
  }

  const earliest = new Date(now.getTime() + service.minNoticeMinutes * 60_000);
  const latestDateKey = addDaysToKey(todayKey(now), service.maxAdvanceDays);

  return dates.map((date) =>
    buildDay({
      date,
      service,
      windows: rulesByDay.get(dayOfWeekFor(date)) ?? [],
      blocks,
      bookings,
      earliest,
      latestDateKey,
    }),
  );
}

function buildDay({
  date,
  service,
  windows,
  blocks,
  bookings,
  earliest,
  latestDateKey,
}: {
  date: DateKey;
  service: SaunaServiceRecord;
  windows: { startMinute: number; endMinute: number }[];
  blocks: { startsAt: Date; endsAt: Date }[];
  bookings: { startsAt: Date; endsAt: Date; guestCount: number }[];
  earliest: Date;
  latestDateKey: DateKey;
}): DayAvailability {
  // Beyond the service's booking horizon.
  if (date > latestDateKey) {
    return { date, open: false, slots: [], bestRemaining: 0 };
  }

  const capacity = Math.max(1, service.capacity);
  const step = service.durationMinutes + service.bufferMinutes;
  const slots: Slot[] = [];

  for (const window of windows) {
    // Slots are spaced by duration + buffer, and the last one must finish by
    // closing time — the buffer is turnaround, so it may run past close.
    for (
      let minute = window.startMinute;
      minute + service.durationMinutes <= window.endMinute;
      minute += step
    ) {
      const startsAt = instantAt(date, minute);
      const endsAt = instantAt(date, minute + service.durationMinutes);

      // Too soon: inside the minimum-notice window, or simply in the past.
      if (startsAt < earliest) continue;

      // Closures overlap if they intersect the slot at all.
      const blocked = blocks.some(
        (block) => block.startsAt < endsAt && block.endsAt > startsAt,
      );
      if (blocked) continue;

      const taken = bookings
        .filter(
          (booking) => booking.startsAt < endsAt && booking.endsAt > startsAt,
        )
        .reduce((total, booking) => total + booking.guestCount, 0);

      // An exclusive service (private hire) is unavailable as soon as anyone
      // holds it, regardless of how many of its seats they took.
      const remaining = service.isExclusive
        ? taken > 0
          ? 0
          : Math.min(capacity, service.maxGuestsPerBooking)
        : Math.max(0, capacity - taken);

      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: formatClock(minute),
        state:
          remaining <= 0
            ? "full"
            : remaining / capacity <= LIMITED_THRESHOLD
              ? "limited"
              : "available",
        remaining,
        capacity,
      });
    }
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    date,
    open: slots.length > 0,
    slots,
    bestRemaining: slots.reduce((best, slot) => Math.max(best, slot.remaining), 0),
  };
}

function formatClock(minutes: number): string {
  const normalised = minutes % (24 * 60);
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Re-checks a single slot at booking time.
 *
 * Called inside the booking transaction with the row lock already taken, so
 * the count it sees cannot change before the insert commits.
 */
export async function assertSlotBookable({
  service,
  startsAt,
  guestCount,
  now = new Date(),
  tx = prisma,
}: {
  service: SaunaServiceRecord;
  startsAt: Date;
  guestCount: number;
  now?: Date;
  tx?: Pick<typeof prisma, "availabilityRule" | "blockedTime" | "booking">;
}): Promise<{ ok: true; endsAt: Date } | { ok: false; reason: string }> {
  if (guestCount < 1 || guestCount > service.maxGuestsPerBooking) {
    return {
      ok: false,
      reason: `This session takes between 1 and ${service.maxGuestsPerBooking} guests.`,
    };
  }

  const endsAt = new Date(
    startsAt.getTime() + service.durationMinutes * 60_000,
  );

  if (startsAt.getTime() < now.getTime() + service.minNoticeMinutes * 60_000) {
    return {
      ok: false,
      reason: "That time is no longer far enough ahead to book.",
    };
  }

  const dateKey = todayKey(startsAt);
  if (dateKey > addDaysToKey(todayKey(now), service.maxAdvanceDays)) {
    return { ok: false, reason: "That date is too far ahead to book yet." };
  }

  // The slot must fall inside an opening window and land exactly on the grid —
  // otherwise a crafted request could book 03:17 on a closed Sunday.
  const dayRules = await tx.availabilityRule.findMany({
    where: {
      active: true,
      dayOfWeek: dayOfWeekFor(dateKey),
      OR: [{ serviceId: service.id }, { serviceId: null }],
    },
  });

  const specific = dayRules.filter((rule) => rule.serviceId === service.id);
  const windows = specific.length > 0 ? specific : dayRules;

  const step = service.durationMinutes + service.bufferMinutes;
  const onGrid = windows.some((window) => {
    for (
      let minute = window.startMinute;
      minute + service.durationMinutes <= window.endMinute;
      minute += step
    ) {
      if (instantAt(dateKey, minute).getTime() === startsAt.getTime()) return true;
    }
    return false;
  });

  if (!onGrid) {
    return { ok: false, reason: "That time is not available for this session." };
  }

  const blocked = await tx.blockedTime.findFirst({
    where: {
      OR: [{ serviceId: service.id }, { serviceId: null }],
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  if (blocked) {
    return {
      ok: false,
      reason: blocked.reason
        ? `Unavailable: ${blocked.reason}`
        : "That time is not available.",
    };
  }

  const overlapping = await tx.booking.findMany({
    where: {
      serviceId: service.id,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...capacityConsumingWhere(now),
    },
    select: { guestCount: true },
  });

  const taken = overlapping.reduce(
    (total, booking) => total + booking.guestCount,
    0,
  );

  if (service.isExclusive && taken > 0) {
    return { ok: false, reason: "That slot has just been taken." };
  }

  if (taken + guestCount > service.capacity) {
    const left = Math.max(0, service.capacity - taken);
    return {
      ok: false,
      reason:
        left === 0
          ? "That slot has just filled up."
          : `Only ${left} space${left === 1 ? "" : "s"} left in that slot.`,
    };
  }

  return { ok: true, endsAt };
}
