import Link from "next/link";

import { BookingRow } from "@/components/admin/BookingRow";
import { Panel } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { PlaceholderNote } from "@/components/ui/Surface";
import { formatDateLong, formatPrice, formatTime } from "@/lib/format";
import { getDashboardStats } from "@/lib/queries/admin";
import { buildMetadata } from "@/lib/seo";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Admin overview.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-12">
      {!isStripeConfigured ? (
        <PlaceholderNote>
          Stripe is not connected, so revenue figures only reflect memberships
          and bookings created without payment. They are not real takings.
        </PlaceholderNote>
      ) : null}

      {/* Key figures */}
      <section>
        <h2 className="u-eyebrow">Today</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Sessions today"
            value={String(stats.todaysBookings.length)}
          />
          <Stat label="Active members" value={String(stats.activeMemberCount)} />
          <Stat
            label="New this month"
            value={String(stats.newMembershipsThisMonth)}
          />
          <Stat
            label="MRR"
            value={formatPrice(stats.mrrCents)}
            note={PRICING_IS_PROVISIONAL ? "provisional prices" : undefined}
          />
        </div>

        {stats.pastDueCount > 0 ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[var(--text-body-sm)] text-danger">
            {stats.pastDueCount} membership
            {stats.pastDueCount === 1 ? " has" : "s have"} a failed payment.{" "}
            <Link href="/admin/members?status=PAST_DUE" className="underline underline-offset-4">
              Review
            </Link>
          </p>
        ) : null}
      </section>

      {/* Today's bookings */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="u-eyebrow">Today&rsquo;s sessions</h2>
          <Link
            href="/admin/bookings"
            className="text-[var(--text-body-sm)] text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
          >
            All bookings
          </Link>
        </div>

        {stats.todaysBookings.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2.5">
            {stats.todaysBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showActions />
            ))}
          </div>
        ) : (
          <Panel className="mt-5 p-6">
            <p className="text-[var(--text-body-sm)] text-mist">
              Nothing booked for today.
            </p>
          </Panel>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Upcoming */}
        <section>
          <h2 className="u-eyebrow">Coming up</h2>
          {stats.upcomingBookings.length > 0 ? (
            <Panel className="mt-5 px-5 py-1">
              <ul>
                {stats.upcomingBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-baseline justify-between gap-5 border-b border-line py-3.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[var(--text-body-sm)] text-bone">
                        {booking.service.name}
                      </span>
                      <span className="block truncate text-[var(--text-caption)] text-mist-dim">
                        {booking.customerName} · {booking.guestCount} guest
                        {booking.guestCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="u-tnum shrink-0 text-right text-[var(--text-caption)] text-mist">
                      {formatDateLong(booking.startsAt).replace(/,.*$/, "")}
                      <span className="block text-bone">
                        {formatTime(booking.startsAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <Panel className="mt-5 p-6">
              <p className="text-[var(--text-body-sm)] text-mist">
                No upcoming bookings.
              </p>
            </Panel>
          )}
        </section>

        {/* Recent payments */}
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="u-eyebrow">Recent payments</h2>
            <span className="text-[var(--text-caption)] text-mist-dim">
              {formatPrice(stats.revenueThisMonthCents)} in 30 days
            </span>
          </div>

          {stats.recentPayments.length > 0 ? (
            <Panel className="mt-5 px-5 py-1">
              <ul>
                {stats.recentPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-baseline justify-between gap-5 border-b border-line py-3.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[var(--text-body-sm)] text-bone">
                        {payment.description ?? payment.kind}
                      </span>
                      <span className="block truncate text-[var(--text-caption)] text-mist-dim">
                        {payment.user?.name ?? payment.user?.email ?? "Guest"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="u-tnum block text-[var(--text-body-sm)] text-bone">
                        {formatPrice(payment.amountCents, payment.currency)}
                      </span>
                      <span
                        className={
                          payment.status === "SUCCEEDED"
                            ? "text-[var(--text-caption)] text-positive"
                            : payment.status === "FAILED"
                              ? "text-[var(--text-caption)] text-danger"
                              : "text-[var(--text-caption)] text-mist-dim"
                        }
                      >
                        {payment.status.toLowerCase()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <Panel className="mt-5 p-6">
              <p className="text-[var(--text-body-sm)] text-mist">
                No payments recorded yet.
              </p>
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Panel className="p-5">
      <p className="text-[var(--text-caption)] uppercase tracking-[0.14em] text-mist-dim">
        {label}
      </p>
      <p className="u-tnum mt-3 font-[family-name:var(--font-display)] text-[length:var(--text-h3)] leading-none text-bone">
        {value}
      </p>
      {note ? (
        <p className="mt-2 text-[var(--text-caption)] text-mist-dim">{note}</p>
      ) : null}
    </Panel>
  );
}
