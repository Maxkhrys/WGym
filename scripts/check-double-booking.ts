/**
 * Double-booking protection.
 *
 * Run with: npm run check:booking   (needs the dev database running)
 *
 * Fires many simultaneous requests at a single slot and asserts that the
 * number of guests actually booked never exceeds the service capacity. This is
 * the test that a booking system has to pass: the race is real, it only
 * appears under concurrency, and getting it wrong means selling a seat twice.
 *
 * Test rows are cleaned up afterwards.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { createBookingHold } from "../src/lib/booking/create";
import { addDaysToKey, instantAt, todayKey } from "../src/lib/booking/time";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MARKER = "[[concurrency-check]]";

async function main() {
  const service = await prisma.saunaService.findFirst({
    where: { slug: "sauna-session" },
  });

  if (!service) throw new Error("Seed the database first: npm run db:seed");

  // A Monday well inside the booking window, at an hour the club is open.
  let dateKey = addDaysToKey(todayKey(), 3);
  while (new Date(`${dateKey}T12:00:00Z`).getUTCDay() !== 1) {
    dateKey = addDaysToKey(dateKey, 1);
  }
  const startsAt = instantAt(dateKey, 10 * 60);

  await clean(startsAt);

  const capacity = service.capacity;
  const attempts = capacity * 3;
  const guestsEach = 1;

  console.log(
    `Slot ${startsAt.toISOString()} — capacity ${capacity}, firing ${attempts} simultaneous bookings…\n`,
  );

  const results = await Promise.all(
    Array.from({ length: attempts }, (_, index) =>
      createBookingHold({
        service,
        startsAt,
        guestCount: guestsEach,
        customerName: `Concurrency Tester ${index}`,
        customerEmail: `concurrency-${index}@example.invalid`,
        notes: MARKER,
      }),
    ),
  );

  const succeeded = results.filter((r) => r.ok).length;
  const rejected = results.length - succeeded;

  const held = await prisma.booking.findMany({
    where: {
      serviceId: service.id,
      startsAt,
      OR: [
        { status: { in: ["CONFIRMED", "COMPLETED"] } },
        { status: "PENDING", holdExpiresAt: { gt: new Date() } },
      ],
    },
    select: { guestCount: true },
  });

  const guestsHeld = held.reduce((total, row) => total + row.guestCount, 0);

  console.log(`  accepted:      ${succeeded}`);
  console.log(`  rejected:      ${rejected}`);
  console.log(`  guests held:   ${guestsHeld}`);
  console.log(`  capacity:      ${capacity}\n`);

  const overbooked = guestsHeld > capacity;

  if (overbooked) {
    console.error(
      `FAIL — the slot is overbooked by ${guestsHeld - capacity} guest(s).`,
    );
  } else if (succeeded === 0) {
    console.error("FAIL — nothing was booked at all; the test proved nothing.");
  } else {
    console.log("PASS — capacity was never exceeded under concurrent load.");
  }

  await clean(startsAt);
  await prisma.$disconnect();

  process.exitCode = overbooked || succeeded === 0 ? 1 : 0;
}

async function clean(startsAt: Date) {
  await prisma.booking.deleteMany({ where: { startsAt, notes: MARKER } });
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
