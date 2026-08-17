import Link from "next/link";

import { BookingRow } from "@/components/admin/BookingRow";
import { Panel } from "@/components/ui/Surface";
import {
  addDaysToKey,
  endOfBusinessDay,
  isDateKey,
  startOfBusinessDay,
  todayKey,
} from "@/lib/booking/time";
import { formatDateLong } from "@/lib/format";
import { getBookingsForRange } from "@/lib/queries/admin";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/cn";

export const metadata = buildMetadata({
  title: "Bookings",
  description: "Booking calendar.",
  path: "/admin/bookings",
  noIndex: true,
});

export const dynamic = "force-dynamic";

/**
 * Day view of the booking calendar.
 *
 * A day at a time rather than a month grid: staff work from a running list of
 * who is coming and when, and marking attendance is the main job here.
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = todayKey();
  const date = params.date && isDateKey(params.date) ? params.date : today;

  const bookings = await getBookingsForRange(
    startOfBusinessDay(date),
    endOfBusinessDay(date),
  );

  const active = bookings.filter(
    (booking) => booking.status !== "CANCELLED" && booking.status !== "REFUNDED",
  );
  const guests = active.reduce((total, booking) => total + booking.guestCount, 0);

  // A short window around the chosen day, so staff can step through without
  // opening a date picker.
  const strip = Array.from({ length: 9 }, (_, index) =>
    addDaysToKey(date, index - 4),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="u-eyebrow">Bookings</h2>
          {date !== today ? (
            <Link
              href="/admin/bookings"
              className="text-[var(--text-body-sm)] text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
            >
              Back to today
            </Link>
          ) : null}
        </div>

        <nav aria-label="Choose a day" className="mt-5">
          <ul className="u-rail u-no-scrollbar gap-2">
            {strip.map((key) => {
              const isActive = key === date;
              const parts = new Date(`${key}T12:00:00Z`);

              return (
                <li key={key}>
                  <Link
                    href={`/admin/bookings?date=${key}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "u-tap flex w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 transition-colors",
                      isActive
                        ? "border-mint bg-mint text-ink"
                        : "border-line-hi bg-ink-raised text-mist hover:border-accent hover:text-bone",
                    )}
                  >
                    <span className="text-[var(--text-micro)] uppercase tracking-[0.1em]">
                      {new Intl.DateTimeFormat("en-IE", { weekday: "short" }).format(parts)}
                    </span>
                    <span className="u-tnum text-[1.1rem] font-medium leading-none">
                      {new Intl.DateTimeFormat("en-IE", { day: "numeric" }).format(parts)}
                    </span>
                    {key === today ? (
                      <span className="text-[var(--text-micro)]">today</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4 border-y border-line py-4">
        <h3 className="text-[length:var(--text-body-lg)] text-bone">
          {formatDateLong(new Date(`${date}T12:00:00Z`))}
        </h3>
        <p className="u-tnum text-[var(--text-body-sm)] text-mist">
          {active.length} booking{active.length === 1 ? "" : "s"} · {guests} guest
          {guests === 1 ? "" : "s"}
        </p>
      </div>

      {bookings.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} showActions />
          ))}
        </div>
      ) : (
        <Panel className="p-6">
          <p className="text-[var(--text-body-sm)] text-mist">
            No bookings on this day.
          </p>
        </Panel>
      )}
    </div>
  );
}
