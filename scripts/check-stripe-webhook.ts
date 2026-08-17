/**
 * Stripe webhook verification check.
 *
 * The webhook is the only thing that may confirm a booking or activate a
 * membership, so it has to reject anything it cannot cryptographically
 * attribute to Stripe. This exercises exactly that:
 *
 *   1. no signature            -> rejected
 *   2. a wrong signature       -> rejected
 *   3. a stale timestamp       -> rejected (replay protection)
 *   4. a valid signature       -> accepted, and the booking is confirmed
 *   5. the same event again    -> accepted, and nothing is double-written
 *
 * The server must be running with STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
 * set to the test values below. No network call to Stripe is made — the
 * signature is constructed locally, which is what "development fixtures"
 * means here.
 *
 * Usage:
 *   npx tsx --conditions=react-server scripts/check-stripe-webhook.ts [baseUrl]
 */

import "dotenv/config";

import { createHmac } from "node:crypto";

import { prisma } from "../src/lib/db/prisma";
import { addDaysToKey, instantAt, todayKey } from "../src/lib/booking/time";

const base = process.argv[2] ?? "http://localhost:4329";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_secret_for_checks";
const MARKER = "[[webhook-check]]";

let failures = 0;

function check(label: string, passed: boolean, detail = "") {
  if (passed) console.log(`  ok   ${label}${detail ? ` — ${detail}` : ""}`);
  else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function sign(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function post(payload: string, signature?: string) {
  return fetch(`${base}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    body: payload,
  });
}

async function main() {
  await prisma.booking.deleteMany({ where: { notes: MARKER } });

  const service = await prisma.saunaService.findFirst({
    where: { slug: "sauna-session" },
  });
  if (!service) throw new Error("Seed the database first: npm run db:seed");

  // A PENDING booking holding capacity, exactly as checkout leaves it.
  const startsAt = instantAt(addDaysToKey(todayKey(), 5), 11 * 60);
  const booking = await prisma.booking.create({
    data: {
      reference: `WB-CHK${Math.floor(Math.random() * 900 + 100)}`,
      serviceId: service.id,
      customerName: "Webhook Check",
      customerEmail: "webhook-check@example.invalid",
      startsAt,
      endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
      guestCount: 1,
      amountCents: service.priceCents,
      currency: service.currency,
      status: "PENDING",
      holdExpiresAt: new Date(Date.now() + 15 * 60_000),
      notes: MARKER,
    },
  });

  const event = {
    id: `evt_check_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: booking.amountCents,
        currency: booking.currency,
        payment_intent: `pi_test_${Date.now()}`,
        metadata: {
          kind: "booking",
          bookingId: booking.id,
          reference: booking.reference,
        },
      },
    },
  };

  const payload = JSON.stringify(event);
  const now = Math.floor(Date.now() / 1000);

  // 1. No signature at all.
  const unsigned = await post(payload);
  check("rejects a request with no signature", unsigned.status === 400, `status ${unsigned.status}`);

  // 2. Signed with the wrong secret.
  const wrong = await post(payload, sign(payload, "whsec_wrong_secret", now));
  check("rejects a wrongly-signed request", wrong.status === 400, `status ${wrong.status}`);

  // 3. Correct secret, but an old timestamp — replay protection.
  const stale = await post(payload, sign(payload, SECRET, now - 60 * 60));
  check("rejects a replayed (stale) request", stale.status === 400, `status ${stale.status}`);

  // Nothing so far should have touched the booking.
  const stillPending = await prisma.booking.findUnique({ where: { id: booking.id } });
  check(
    "booking untouched by rejected requests",
    stillPending?.status === "PENDING",
    `status ${stillPending?.status}`,
  );

  // 4. A properly signed event.
  const valid = await post(payload, sign(payload, SECRET, now));
  check("accepts a correctly-signed request", valid.status === 200, `status ${valid.status}`);

  const confirmed = await prisma.booking.findUnique({ where: { id: booking.id } });
  check(
    "booking is CONFIRMED after the webhook",
    confirmed?.status === "CONFIRMED",
    `status ${confirmed?.status}`,
  );
  check(
    "payment hold released",
    confirmed?.holdExpiresAt === null,
    `holdExpiresAt ${confirmed?.holdExpiresAt}`,
  );

  const payments = await prisma.payment.count({ where: { bookingId: booking.id } });
  check("one payment recorded", payments === 1, `${payments} payment row(s)`);

  // 5. Redelivery of the same event must be a no-op, not a second payment.
  const replayAgain = await post(payload, sign(payload, SECRET, Math.floor(Date.now() / 1000)));
  check("accepts a redelivered event", replayAgain.status === 200, `status ${replayAgain.status}`);

  const paymentsAfter = await prisma.payment.count({ where: { bookingId: booking.id } });
  check(
    "redelivery does not create a second payment",
    paymentsAfter === 1,
    `${paymentsAfter} payment row(s)`,
  );

  // Clean up.
  await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
  await prisma.booking.deleteMany({ where: { notes: MARKER } });

  console.log(
    failures === 0
      ? "\nPASS — webhook signature verification and idempotency behaved correctly."
      : `\nFAIL — ${failures} webhook check(s) failed.`,
  );

  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
