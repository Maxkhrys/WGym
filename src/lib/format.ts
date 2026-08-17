import { BUSINESS_TIMEZONE } from "@/config/site";

/** Money is stored and passed around as integer minor units, never floats. */
export function formatPrice(
  amountCents: number,
  currency = "eur",
  options: { showFree?: boolean } = {},
): string {
  if (amountCents === 0 && options.showFree) return "Free";

  const hasFraction = amountCents % 100 !== 0;

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(amountCents / 100);
}

const dublin = { timeZone: BUSINESS_TIMEZONE } as const;

/** 24-hour time in the business timezone, e.g. "18:30". */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    ...dublin,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** e.g. "Mon 17 Aug". */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    ...dublin,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/** e.g. "Monday 17 August 2026". */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    ...dublin,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** e.g. "17 Aug 2026, 18:30". */
export function formatDateTime(date: Date): string {
  return `${new Intl.DateTimeFormat("en-IE", {
    ...dublin,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}, ${formatTime(date)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

/** "06:00" -> 360. Wall-clock minutes from midnight. */
export function parseClockToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 360 -> "06:00". */
export function formatMinutesAsClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatBillingInterval(
  interval: "MONTH" | "YEAR" | "ONE_TIME",
): string {
  switch (interval) {
    case "MONTH":
      return "per month";
    case "YEAR":
      return "per year";
    case "ONE_TIME":
      return "one-off";
  }
}
