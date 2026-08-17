import "server-only";

import {
  openingHours as defaultOpeningHours,
  siteConfig,
  type DayHours,
  type Weekday,
} from "@/config/site";
import { prisma } from "@/lib/db/prisma";

/**
 * Reads the small set of values staff can edit without a deploy.
 *
 * The database is the source of truth; the code config is the fallback for a
 * key that has never been set. This indirection is the seam a CMS would slot
 * into later — swap the implementation of `getSettings` and every caller keeps
 * working, because nothing else touches SiteSetting directly.
 */

export type EditableSettings = {
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  facebook: string;
  parkingSummary: string;
  openingHours: Record<Weekday, DayHours>;
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export async function getSettings(): Promise<EditableSettings> {
  let rows: { key: string; value: unknown }[] = [];

  try {
    rows = await prisma.siteSetting.findMany();
  } catch (error) {
    // These values are presentational — contact details, social links, hours —
    // and the code config in src/config/site.ts is their declared fallback. A
    // database blip should not take down a marketing page or fail a build over
    // them. Anything that affects money or availability (plans, services,
    // bookings) deliberately does NOT swallow errors like this: showing a
    // stale price would be worse than showing an error.
    console.error(
      "Could not read site settings; falling back to config defaults:",
      error instanceof Error ? error.message : error,
    );
  }

  const map = new Map(rows.map((row) => [row.key, row.value]));

  const storedHours = map.get("openingHours");

  return {
    contactEmail: asString(map.get("contact.email"), siteConfig.contact.email),
    contactPhone: asString(map.get("contact.phone"), siteConfig.contact.phone),
    instagram: asString(map.get("social.instagram"), siteConfig.social.instagram),
    facebook: asString(map.get("social.facebook"), siteConfig.social.facebook),
    parkingSummary: asString(
      map.get("parking.summary"),
      siteConfig.parking.summary,
    ),
    openingHours: isOpeningHours(storedHours)
      ? storedHours
      : defaultOpeningHours,
  };
}

export async function setSetting(key: string, value: unknown) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
}

/** Guards against a malformed row taking the whole page down. */
function isOpeningHours(value: unknown): value is Record<Weekday, DayHours> {
  if (typeof value !== "object" || value === null) return false;

  const days: Weekday[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return days.every((day) => {
    if (!(day in value)) return false;
    const entry = (value as Record<string, unknown>)[day];
    if (entry === null) return true;
    return (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as { open?: unknown }).open === "string" &&
      typeof (entry as { close?: unknown }).close === "string"
    );
  });
}

export async function getAnnouncements() {
  const now = new Date();

  return prisma.announcement.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
  });
}
