import Link from "next/link";

import { MemberCode } from "@/components/account/MemberCode";
import { BookingCard } from "@/components/account/BookingCard";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, DataRow, Panel, PlaceholderNote } from "@/components/ui/Surface";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { formatBillingInterval, formatDateLong, formatPrice } from "@/lib/format";
import {
  decorateBookings,
  getCurrentMembership,
  getPayments,
  getUpcomingBookings,
} from "@/lib/queries/account";
import { buildMetadata } from "@/lib/seo";
import { isStripeConfigured } from "@/lib/stripe/client";
import { BillingPortalButton } from "@/components/account/BillingPortalButton";
import type { MembershipStatus } from "@/generated/prisma/enums";

export const metadata = buildMetadata({
  title: "Your account",
  description: "Your membership, bookings and member code.",
  path: "/account",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<
  MembershipStatus,
  "positive" | "caution" | "danger" | "neutral"
> = {
  ACTIVE: "positive",
  PENDING: "caution",
  PAST_DUE: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

const STATUS_LABEL: Record<MembershipStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Awaiting payment",
  PAST_DUE: "Payment failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser("/account");

  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { memberCode: true, createdAt: true },
  });
  const membership = await getCurrentMembership(user.id);
  const upcoming = decorateBookings(await getUpcomingBookings(user.id, user.email));
  const payments = await getPayments(user.id, 5);

  return (
    <div className="flex flex-col gap-12">
      {params.billing === "unavailable" ? (
        <p
          role="alert"
          className="rounded-xl border border-caution/40 bg-caution/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-caution"
        >
          The billing portal is not available yet. Payments have not been
          connected — please get in touch and we will sort it out directly.
        </p>
      ) : null}

      {/* Membership + member code */}
      <section className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        <div className="lg:col-span-3">
          <h2 className="u-eyebrow">Membership</h2>

          {membership ? (
            <Panel className="mt-5 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-[length:var(--text-h4)]">
                    {membership.plan.name}
                  </h3>
                  <p className="mt-2 text-[var(--text-body-sm)] text-mist">
                    {formatPrice(
                      membership.plan.priceCents,
                      membership.plan.currency,
                    )}{" "}
                    {formatBillingInterval(membership.plan.interval)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[membership.status]}>
                  {STATUS_LABEL[membership.status]}
                </Badge>
              </div>

              <dl className="mt-7">
                {membership.startDate ? (
                  <DataRow
                    label="Joined"
                    value={formatDateLong(membership.startDate)}
                  />
                ) : null}
                {membership.currentPeriodEnd && !membership.plan.isDayPass ? (
                  <DataRow
                    label={
                      membership.cancelAtPeriodEnd ? "Access until" : "Next payment"
                    }
                    value={formatDateLong(membership.currentPeriodEnd)}
                  />
                ) : null}
                {membership.endDate ? (
                  <DataRow
                    label="Valid until"
                    value={formatDateLong(membership.endDate)}
                  />
                ) : null}
                <DataRow
                  label="Minimum term"
                  value={
                    membership.plan.minimumTermMonths > 0
                      ? `${membership.plan.minimumTermMonths} month${membership.plan.minimumTermMonths === 1 ? "" : "s"}`
                      : "None"
                  }
                />
              </dl>

              {membership.status === "PAST_DUE" ? (
                <p className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-danger">
                  Your last payment did not go through. Update your card to keep
                  your membership active.
                </p>
              ) : null}

              {membership.cancelAtPeriodEnd ? (
                <p className="mt-6 rounded-xl border border-caution/40 bg-caution/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-caution">
                  Your membership is set to end and will not renew. You keep
                  access until the date above.
                </p>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {isStripeConfigured ? (
                  <BillingPortalButton />
                ) : (
                  <PlaceholderNote className="flex-1">
                    Subscription management opens once payments are connected.
                    Until then, contact us to change or cancel a membership.
                  </PlaceholderNote>
                )}
              </div>
            </Panel>
          ) : (
            <Panel className="mt-5 p-6 sm:p-7">
              <h3 className="text-[length:var(--text-h4)]">No membership yet</h3>
              <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
                You can still book recovery sessions without one. Join the gym
                whenever you are ready.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/memberships">See memberships</ButtonLink>
                <ButtonLink href="/sauna/book" variant="secondary">
                  Book a session
                </ButtonLink>
              </div>
            </Panel>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="u-eyebrow">Member code</h2>
          <MemberCode code={profile?.memberCode ?? null} className="mt-5" />
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="u-eyebrow">Upcoming sessions</h2>
          <Link
            href="/account/bookings"
            className="text-[var(--text-body-sm)] text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
          >
            All bookings
          </Link>
        </div>

        {upcoming.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {upcoming.slice(0, 3).map((booking) => (
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
      </section>

      {/* Payments */}
      <section>
        <h2 className="u-eyebrow">Recent payments</h2>

        {payments.length > 0 ? (
          <Panel className="mt-5 px-6 py-2">
            <dl>
              {payments.map((payment) => (
                <DataRow
                  key={payment.id}
                  label={
                    <span className="flex flex-col gap-0.5">
                      <span className="text-bone">
                        {payment.description ?? "Payment"}
                      </span>
                      <span className="text-[var(--text-caption)] text-mist-dim">
                        {formatDateLong(payment.createdAt)}
                      </span>
                    </span>
                  }
                  value={
                    <span className="flex flex-col items-end gap-0.5">
                      <span>
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
                  }
                />
              ))}
            </dl>
          </Panel>
        ) : (
          <Panel className="mt-5 p-6">
            <p className="text-[var(--text-body-sm)] leading-relaxed text-mist">
              No payments recorded yet.
            </p>
          </Panel>
        )}

        {isStripeConfigured ? (
          <p className="mt-4 text-[var(--text-caption)] leading-relaxed text-mist-dim">
            Full invoices and receipts are available in the billing portal.
          </p>
        ) : null}
      </section>

      {profile?.createdAt ? (
        <p className="border-t border-line pt-6 text-[var(--text-caption)] text-mist-dim">
          Account created {formatDateLong(profile.createdAt)}.
        </p>
      ) : null}
    </div>
  );
}
