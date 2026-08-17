import { TZDate } from "@date-fns/tz";

import { BUSINESS_TIMEZONE } from "@/config/site";

/**
 * Timezone rules for the booking engine.
 *
 * Everything persisted is a UTC instant. Everything a human sees or configures
 * — "we open at 06:00", "Tuesday the 17th" — is Europe/Dublin wall-clock time.
 * This module is the only place the two are converted, so DST is handled once.
 *
 * Ireland moves the clock twice a year. The failure this guards against: on
 * 26 October the clocks go back, so 06:00 local is UTC+1 the day before and
 * UTC+0 the day after. Adding a fixed offset, or doing arithmetic on a UTC
 * date and formatting it as local, produces slots an hour out for half the
 * year — and on the transition days themselves, either a duplicated or a
 * missing hour. Constructing a TZDate directly from the local calendar fields
 * lets the timezone database resolve the correct offset for that instant.
 */

/** A calendar day in the business timezone, e.g. "2026-08-17". */
export type DateKey = string;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): value is DateKey {
  return DATE_KEY.test(value);
}

/** The Europe/Dublin calendar date for an instant. */
export function toDateKey(instant: Date): DateKey {
  // `en-CA` formats as YYYY-MM-DD, which is the shape we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Today's calendar date in the business timezone. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

/**
 * Builds the UTC instant for a wall-clock time on a business-timezone date.
 *
 * `minutes` is minutes from local midnight and may exceed 1440 for a slot that
 * runs past midnight — TZDate normalises the overflow into the next day.
 */
export function instantAt(dateKey: DateKey, minutes: number): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  const local = new TZDate(
    year,
    month - 1,
    day,
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0,
    BUSINESS_TIMEZONE,
  );

  return new Date(local.getTime());
}

/** Start of a business-timezone day, as a UTC instant. */
export function startOfBusinessDay(dateKey: DateKey): Date {
  return instantAt(dateKey, 0);
}

/** Start of the following day — an exclusive upper bound for range queries. */
export function endOfBusinessDay(dateKey: DateKey): Date {
  return instantAt(dateKey, 24 * 60);
}

/** JS day index (0 = Sunday) for a business-timezone calendar date. */
export function dayOfWeekFor(dateKey: DateKey): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  // Midday avoids any chance of a DST shift moving the date across midnight.
  return new TZDate(year, month - 1, day, 12, 0, 0, 0, BUSINESS_TIMEZONE).getDay();
}

/** Adds whole calendar days in the business timezone. */
export function addDaysToKey(dateKey: DateKey, days: number): DateKey {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new TZDate(
    year,
    month - 1,
    day + days,
    12,
    0,
    0,
    0,
    BUSINESS_TIMEZONE,
  );
  return toDateKey(new Date(shifted.getTime()));
}

/** Inclusive list of calendar dates. */
export function dateKeyRange(from: DateKey, days: number): DateKey[] {
  const keys: DateKey[] = [];
  for (let i = 0; i < days; i += 1) keys.push(addDaysToKey(from, i));
  return keys;
}

/** Wall-clock minutes from local midnight for an instant. */
export function minutesIntoBusinessDay(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

export function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 60000);
}
