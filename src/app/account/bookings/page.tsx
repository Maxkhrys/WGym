import { BookingCard } from "@/components/account/BookingCard";
import { ButtonLink } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Surface";
import { bookingPolicy } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import {
  decorateBookings,
  getPastBookings,
  getUpcomingBookings,
} from "@/lib/queries/account";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your bookings",
  description: "Your upcoming and past recovery sessions.",
  path: "/account/bookings",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await requireUser("/account/bookings");

  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  // One `now` for the whole page, so every card agrees about the cancellation
  // window rather than each reading the clock as it renders.
  const now = new Date();
  const upcoming = decorateBookings(await getUpcomingBookings(user.id, user.email), now);
  const past = decorateBookings(await getPastBookings(user.id, user.email), now);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="u-eyebrow">Upcoming</h2>
          <ButtonLink href="/sauna/book" size="sm" variant="secondary">
            Book another
          </ButtonLink>
        </div>

        {upcoming.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <Panel className="mt-5 p-6">
            <p className="text-[var(--text-body-sm)] leading-relaxed text-mist">
              You have no sessions booked.
            </p>
            <div className="mt-5">
              <ButtonLink href="/sauna/book" size="sm">
                Book a session
              </ButtonLink>
            </div>
          </Panel>
        )}

        <p className="mt-5 text-[var(--text-caption)] leading-relaxed text-mist-dim">
          You can cancel free of charge up to{" "}
          {bookingPolicy.freeCancellationHours} hours before a session. Inside
          that window, please contact us —{" "}
          {bookingPolicy.allowReschedule
            ? "we can usually move you to another slot."
            : "the session is non-refundable."}
        </p>
      </section>

      <section>
        <h2 className="u-eyebrow">Past &amp; cancelled</h2>

        {past.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
        ) : (
          <Panel className="mt-5 p-6">
            <p className="text-[var(--text-body-sm)] leading-relaxed text-mist">
              Nothing here yet.
            </p>
          </Panel>
        )}
      </section>
    </div>
  );
}
