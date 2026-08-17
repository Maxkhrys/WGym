/**
 * Timezone assertions for the booking engine.
 *
 * Run with: npm run check:tz
 *
 * These are the cases that silently break a booking system twice a year. The
 * business runs on Europe/Dublin wall-clock time while the database stores UTC
 * instants, so every assertion below pins a local time to the UTC instant it
 * must produce — including across both 2026 DST transitions.
 */

import assert from "node:assert/strict";

import {
  addDaysToKey,
  dayOfWeekFor,
  endOfBusinessDay,
  instantAt,
  minutesIntoBusinessDay,
  startOfBusinessDay,
  toDateKey,
} from "../src/lib/booking/time";

let checks = 0;

function check(label: string, fn: () => void) {
  fn();
  checks += 1;
  console.log(`  ✓ ${label}`);
}

console.log("Timezone behaviour (Europe/Dublin)\n");

check("summer time: 06:00 local is 05:00 UTC", () => {
  // Ireland is UTC+1 from late March to late October.
  assert.equal(instantAt("2026-08-17", 6 * 60).toISOString(), "2026-08-17T05:00:00.000Z");
});

check("winter time: 06:00 local is 06:00 UTC", () => {
  // After the October change Ireland is UTC+0.
  assert.equal(instantAt("2026-11-17", 6 * 60).toISOString(), "2026-11-17T06:00:00.000Z");
});

check("the same wall clock maps to different instants either side of the change", () => {
  const before = instantAt("2026-10-24", 9 * 60).toISOString();
  const after = instantAt("2026-10-26", 9 * 60).toISOString();
  assert.equal(before, "2026-10-24T08:00:00.000Z");
  assert.equal(after, "2026-10-26T09:00:00.000Z");
  assert.notEqual(before.slice(11), after.slice(11));
});

check("spring forward: 01:30 does not exist and does not silently shift the date", () => {
  // 29 March 2026, clocks jump 01:00 -> 02:00.
  const instant = instantAt("2026-03-29", 90);
  assert.equal(toDateKey(instant), "2026-03-29");
});

check("autumn back: the repeated hour still resolves to one instant on the right day", () => {
  // 25 October 2026, clocks go back 02:00 -> 01:00.
  const instant = instantAt("2026-10-25", 90);
  assert.equal(toDateKey(instant), "2026-10-25");
});

check("a business day is 23 hours long when the clocks go forward", () => {
  const start = startOfBusinessDay("2026-03-29");
  const end = endOfBusinessDay("2026-03-29");
  assert.equal((end.getTime() - start.getTime()) / 3_600_000, 23);
});

check("a business day is 25 hours long when the clocks go back", () => {
  const start = startOfBusinessDay("2026-10-25");
  const end = endOfBusinessDay("2026-10-25");
  assert.equal((end.getTime() - start.getTime()) / 3_600_000, 25);
});

check("day-of-week is correct across a DST boundary", () => {
  assert.equal(dayOfWeekFor("2026-10-25"), 0); // Sunday
  assert.equal(dayOfWeekFor("2026-10-26"), 1); // Monday
  assert.equal(dayOfWeekFor("2026-08-17"), 1); // Monday
});

check("adding days crosses the DST boundary without losing or gaining a day", () => {
  assert.equal(addDaysToKey("2026-10-24", 1), "2026-10-25");
  assert.equal(addDaysToKey("2026-10-25", 1), "2026-10-26");
  assert.equal(addDaysToKey("2026-03-28", 2), "2026-03-30");
});

check("an instant maps back to the local minutes it was built from", () => {
  for (const [date, minutes] of [
    ["2026-08-17", 6 * 60],
    ["2026-08-17", 20 * 60 + 30],
    ["2026-11-17", 6 * 60],
    ["2026-12-31", 23 * 60],
  ] as const) {
    assert.equal(minutesIntoBusinessDay(instantAt(date, minutes)), minutes);
  }
});

check("a late-evening slot does not roll into the next calendar day", () => {
  // The classic UTC-vs-local bug: 23:00 local in summer is 22:00 UTC, and
  // formatting the UTC date would still read as the same day — but 00:30 local
  // must not report as the previous day.
  assert.equal(toDateKey(instantAt("2026-08-17", 23 * 60)), "2026-08-17");
  assert.equal(toDateKey(instantAt("2026-08-17", 24 * 60 + 30)), "2026-08-18");
});

console.log(`\n${checks} checks passed.`);
