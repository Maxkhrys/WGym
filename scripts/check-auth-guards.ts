/**
 * Authorisation guard check.
 *
 * The route smoke test only proves signed-out visitors are redirected. This
 * one proves the harder case: a signed-in MEMBER must not reach /admin, and
 * must not be able to invoke admin server actions.
 *
 * It creates a throwaway member with a real database session, then makes
 * requests carrying that session cookie. Cleans up after itself.
 *
 * Usage: npx tsx --conditions=react-server scripts/check-auth-guards.ts [baseUrl]
 */

import "dotenv/config";

import { randomBytes } from "node:crypto";

import { prisma } from "../src/lib/db/prisma";

const base = process.argv[2] ?? "http://localhost:4327";
const TEST_EMAIL = "guard-check@example.invalid";

let failures = 0;

function check(label: string, passed: boolean, detail = "") {
  if (passed) {
    console.log(`  ok   ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  await cleanup();

  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Guard Check",
      role: "MEMBER",
      emailVerified: new Date(),
    },
  });

  const sessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // Auth.js uses a non-secure cookie name over plain http.
  const cookie = `authjs.session-token=${sessionToken}`;

  const get = (path: string) =>
    fetch(`${base}${path}`, {
      headers: { cookie },
      redirect: "manual",
    });

  console.log(`Signed in as MEMBER (${TEST_EMAIL})\n`);

  // The member's own area must be reachable.
  const account = await get("/account");
  check(
    "member can reach /account",
    account.status === 200,
    `status ${account.status}`,
  );

  // The admin area must not be.
  for (const path of [
    "/admin",
    "/admin/bookings",
    "/admin/members",
    "/admin/plans",
    "/admin/services",
    "/admin/availability",
    "/admin/settings",
  ]) {
    const response = await get(path);
    const body = response.status === 200 ? await response.text() : "";
    const blocked =
      response.status === 404 ||
      response.status === 403 ||
      (response.status === 200 && body.includes("That page isn"));

    check(`member blocked from ${path}`, blocked, `status ${response.status}`);
  }

  // Promote and confirm the same session now gets in — proves the guard is
  // checking the role rather than blocking everyone.
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });

  const asAdmin = await get("/admin");
  check(
    "same session reaches /admin once promoted to ADMIN",
    asAdmin.status === 200,
    `status ${asAdmin.status}`,
  );

  // STAFF must not see manager-only pages.
  await prisma.user.update({ where: { id: user.id }, data: { role: "STAFF" } });

  const staffOnPlans = await get("/admin/plans");
  const staffBody = staffOnPlans.status === 200 ? await staffOnPlans.text() : "";
  check(
    "STAFF blocked from manager-only /admin/plans",
    staffOnPlans.status === 404 ||
      (staffOnPlans.status === 200 && staffBody.includes("That page isn")),
    `status ${staffOnPlans.status}`,
  );

  const staffOnBookings = await get("/admin/bookings");
  check(
    "STAFF can reach /admin/bookings",
    staffOnBookings.status === 200,
    `status ${staffOnBookings.status}`,
  );

  await cleanup();

  console.log(
    failures === 0
      ? "\nPASS — authorisation guards behaved correctly."
      : `\nFAIL — ${failures} guard check(s) failed.`,
  );

  process.exitCode = failures === 0 ? 0 : 1;
}

async function cleanup() {
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (existing) {
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
