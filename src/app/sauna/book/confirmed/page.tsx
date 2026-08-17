import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Badge, Panel } from "@/components/ui/Surface";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/db/prisma";
import { formatDateLong, formatPrice, formatTime } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Booking confirmed",
  description: "Your recovery session at The W is booked.",
  path: "/sauna/book/confirmed",
  noIndex: true,
});

export const dynamic = "force-dynamic";

/**
 * Landing page after Stripe.
 *
 * This page only *reads* the booking — it never marks anything paid. The
 * webhook is what confirms, so a booking that is still PENDING here is shown
 * as "processing" rather than being optimistically upgraded, which is what
 * stops a spoofed redirect from confirming a booking nobody paid for.
 */
export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.ref;

  const booking = reference
    ? await prisma.booking.findUnique({
        where: { reference },
        include: { service: true },
      })
    : null;

  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-xl">
        {!booking ? (
          <>
            <h1 className="text-[length:var(--text-h2)] leading-[0.94]">
              Booking not found
            </h1>
            <p className="mt-6 text-[var(--text-body)] leading-relaxed text-mist">
              We could not find a booking with that reference. If you have just
              paid, check your email for a confirmation — and get in touch if
              nothing arrives.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/sauna/book" size="lg">
                Book a session
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Contact us
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <Badge tone={booking.status === "CONFIRMED" ? "positive" : "caution"}>
              {booking.status === "CONFIRMED" ? "Confirmed" : "Processing"}
            </Badge>

            <h1 className="mt-7 text-[length:var(--text-h2)] leading-[0.94]">
              {booking.status === "CONFIRMED"
                ? "You're booked in"
                : "Almost there"}
            </h1>

            <p className="mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
              {booking.status === "CONFIRMED"
                ? "A confirmation email is on its way with everything you need."
                : "Your payment is still being confirmed. This page will show as confirmed once it completes, and you will get an email either way."}
            </p>

            <Panel className="mt-10 p-7">
              <dl className="flex flex-col gap-4">
                <Row label="Reference" value={booking.reference} mono />
                <Row label="Session" value={booking.service.name} />
                <Row label="Date" value={formatDateLong(booking.startsAt)} />
                <Row
                  label="Time"
                  value={`${formatTime(booking.startsAt)} – ${formatTime(booking.endsAt)}`}
                />
                <Row label="Guests" value={String(booking.guestCount)} />
                <Row
                  label="Total"
                  value={formatPrice(booking.amountCents, booking.currency)}
                />
                <Row
                  label="Where"
                  value={`${siteConfig.address.venue}, ${siteConfig.address.postalCode}`}
                />
              </dl>
            </Panel>

            <p className="mt-8 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
              Arrive about five minutes early so you have time to change and
              shower. Bring a towel and swimwear.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/account/bookings" size="lg">
                View your bookings
              </ButtonLink>
              <ButtonLink href="/sauna" variant="secondary" size="lg">
                Back to recovery
              </ButtonLink>
            </div>

            <p className="mt-10 border-t border-line pt-7 text-[var(--text-caption)] leading-relaxed text-mist-dim">
              Need to change something?{" "}
              <Link
                href="/contact"
                className="text-mist underline underline-offset-4 transition-colors hover:text-bone"
              >
                Get in touch
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-[var(--text-body-sm)] text-mist">{label}</dt>
      <dd
        className={`text-right text-[var(--text-body-sm)] text-bone ${mono ? "u-tnum" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
