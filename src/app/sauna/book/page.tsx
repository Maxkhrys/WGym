import { BookingFlow } from "@/components/booking/BookingFlow";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { getSessionUser } from "@/lib/auth/guards";
import { todayKey } from "@/lib/booking/time";
import { getActiveServices } from "@/lib/queries/services";
import { isStripeConfigured } from "@/lib/stripe/client";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Book a session",
  description:
    "Book a sauna, ice bath or recovery session at The W, Wicklow Rugby Club. Pick a date and time and pay online.",
  path: "/sauna/book",
});

// Availability is live data — this page must never be served from a cache.
export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const services = await getActiveServices();
  const user = await getSessionUser();

  return (
    <div data-tone="warm" className="u-page py-32 sm:py-40 lg:py-44">
      <div className="mx-auto w-full max-w-3xl">
        <p className="u-eyebrow">Sauna &amp; Recovery</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          Book a session
        </h1>
        <p className="u-measure mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
          Pick a session, choose a time that suits, and pay to confirm. Sessions
          are kept to a small number of people.
        </p>

        {params.cancelled ? (
          <p
            role="status"
            className="mt-8 rounded-xl border border-line-hi bg-ink-raised px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-mist"
          >
            That payment was cancelled, so booking{" "}
            <span className="u-tnum text-bone">{params.cancelled}</span> was not
            confirmed and the slot has been released. You can start again below.
          </p>
        ) : null}

        {!isStripeConfigured ? (
          <PlaceholderNote className="mt-8">
            Payments are not connected yet, so bookings made here are confirmed
            without taking money. Add the Stripe keys to the environment and
            checkout takes over automatically — no code change needed.
          </PlaceholderNote>
        ) : null}

        {PRICING_IS_PROVISIONAL ? (
          <PlaceholderNote className="mt-4">
            Session prices are provisional placeholders, editable in the admin
            area.
          </PlaceholderNote>
        ) : null}

        <div className="mt-14">
          <BookingFlow
            services={services.map((service) => ({
              id: service.id,
              slug: service.slug,
              name: service.name,
              tagline: service.tagline,
              description: service.description,
              durationMinutes: service.durationMinutes,
              priceCents: service.priceCents,
              currency: service.currency,
              maxGuestsPerBooking: service.maxGuestsPerBooking,
              isExclusive: service.isExclusive,
            }))}
            initialServiceSlug={params.service ?? null}
            // Resolved server-side so "today" is the club's day, not the
            // visitor's device timezone.
            today={todayKey()}
            signedInEmail={user?.email ?? null}
            signedInName={user?.name ?? null}
          />
        </div>
      </div>
    </div>
  );
}
