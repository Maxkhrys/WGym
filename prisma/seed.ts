import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { seedPlans, seedServices, seedTrainers } from "../src/config/catalogue";
import {
  openingHours,
  WEEKDAY_INDEX,
  WEEKDAY_ORDER,
  siteConfig,
} from "../src/config/site";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Idempotent seed. Everything upserts on a natural key, so running it against
 * an existing database refreshes the catalogue without duplicating rows or
 * disturbing members and bookings.
 */
async function main() {
  console.log("Seeding The W…");

  for (const plan of seedPlans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      create: { ...plan },
      // Deliberately does NOT overwrite Stripe IDs — those are set once the
      // products exist in Stripe and must survive a re-seed.
      update: {
        name: plan.name,
        tagline: plan.tagline,
        description: plan.description,
        priceCents: plan.priceCents,
        interval: plan.interval,
        joiningFeeCents: plan.joiningFeeCents,
        features: plan.features,
        minimumTermMonths: plan.minimumTermMonths,
        cancellationNotice: plan.cancellationNotice,
        cancellationPolicy: plan.cancellationPolicy,
        isDayPass: plan.isDayPass,
        sortOrder: plan.sortOrder,
      },
    });
  }
  console.log(`  ${seedPlans.length} membership plans`);

  for (const service of seedServices) {
    await prisma.saunaService.upsert({
      where: { slug: service.slug },
      create: { ...service },
      update: { ...service },
    });
  }
  console.log(`  ${seedServices.length} sauna services`);

  // House opening hours become the default availability window for every
  // service (serviceId = null). Per-service overrides are added in /admin.
  const existingHouseRules = await prisma.availabilityRule.count({
    where: { serviceId: null },
  });

  if (existingHouseRules === 0) {
    const rules = WEEKDAY_ORDER.flatMap((day) => {
      const hours = openingHours[day];
      if (!hours) return [];
      return [
        {
          serviceId: null,
          dayOfWeek: WEEKDAY_INDEX[day],
          startMinute: parseClock(hours.open),
          endMinute: parseClock(hours.close),
        },
      ];
    });

    await prisma.availabilityRule.createMany({ data: rules });
    console.log(`  ${rules.length} availability rules`);
  } else {
    console.log("  availability rules already present — left untouched");
  }

  for (const trainer of seedTrainers) {
    await prisma.trainer.upsert({
      where: { slug: trainer.slug },
      create: { ...trainer },
      update: { ...trainer },
    });
  }
  console.log(`  ${seedTrainers.length} trainers`);

  // Editable settings mirror the code defaults on first run only, so a value
  // changed in /admin is never clobbered by a re-seed.
  const settings: { key: string; value: unknown }[] = [
    { key: "contact.email", value: siteConfig.contact.email },
    { key: "contact.phone", value: siteConfig.contact.phone },
    { key: "social.instagram", value: siteConfig.social.instagram },
    { key: "social.facebook", value: siteConfig.social.facebook },
    { key: "parking.summary", value: siteConfig.parking.summary },
    { key: "openingHours", value: openingHours },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value as object },
      update: {},
    });
  }
  console.log(`  ${settings.length} site settings`);

  // Promote the configured owner if that account already exists. The account
  // itself is created by signing in — no password is ever seeded.
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (ownerEmail) {
    const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (owner) {
      await prisma.user.update({
        where: { id: owner.id },
        data: { role: "OWNER" },
      });
      console.log(`  promoted ${ownerEmail} to OWNER`);
    } else {
      console.log(
        `  ${ownerEmail} has no account yet — sign in once, then re-run to promote`,
      );
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
