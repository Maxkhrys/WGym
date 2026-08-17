/**
 * Concurrency regression check for the availability path.
 *
 * Run with: npm run check:concurrency   (needs the dev database running)
 *
 * Guards the rule documented in src/lib/db/prisma.ts: Prisma queries must be
 * awaited sequentially, never dispatched together with `Promise.all`. Parallel
 * dispatch on this driver interleaves queries on a pooled connection and their
 * bind parameters cross over — which can return the wrong rows rather than
 * failing loudly, and this application decides booking capacity from those
 * rows.
 *
 * This drives the real `getAvailability` under concurrent load. If someone
 * reintroduces a `Promise.all` over Prisma calls in that path, this fails.
 */

import "dotenv/config";

import { getAvailability } from "../src/lib/booking/availability";
import { addDaysToKey, todayKey } from "../src/lib/booking/time";
import { prisma } from "../src/lib/db/prisma";

const ROUNDS = 12;
const CONCURRENCY = 4;

async function main() {
  const service = await prisma.saunaService.findFirst({
    where: { slug: "sauna-session" },
  });

  if (!service) throw new Error("Seed the database first: npm run db:seed");

  const from = addDaysToKey(todayKey(), 1);

  let ok = 0;
  let failed = 0;
  let firstError = "";

  for (let round = 0; round < ROUNDS; round += 1) {
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, () =>
        getAvailability({ service, from, days: 14 }),
      ),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        ok += 1;
      } else {
        failed += 1;
        if (!firstError) {
          const message = String(result.reason?.message ?? result.reason);
          firstError =
            message.split("\n").find((line) => line.includes("Database error")) ??
            message.slice(0, 200);
        }
      }
    }
  }

  console.log(
    `${ROUNDS * CONCURRENCY} concurrent availability lookups: ${ok} ok, ${failed} failed`,
  );

  if (failed > 0) {
    console.error(`\nFAIL — ${firstError}`);
    console.error(
      "\nLikely cause: Prisma queries are being dispatched in parallel.\n" +
        "See the warning at the top of src/lib/db/prisma.ts.",
    );
  } else {
    console.log("PASS — no query interleaving under concurrent load.");
  }

  await prisma.$disconnect();
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
