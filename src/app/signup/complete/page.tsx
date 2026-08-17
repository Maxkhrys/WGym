import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Badge, Panel } from "@/components/ui/Surface";
import { prisma } from "@/lib/db/prisma";
import { formatBillingInterval, formatPrice } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Membership confirmed",
  description: "Your membership at The W is set up.",
  path: "/signup/complete",
  noIndex: true,
});

export const dynamic = "force-dynamic";

/**
 * Landing page after Stripe.
 *
 * Read-only. Activation happens in the webhook, so a membership still PENDING
 * here is shown as processing rather than optimistically upgraded — a spoofed
 * redirect must never grant access.
 */
export default async function SignupCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ membership?: string }>;
}) {
  const params = await searchParams;

  const membership = params.membership
    ? await prisma.membership.findUnique({
        where: { id: params.membership },
        include: { plan: true, user: { select: { memberCode: true, email: true } } },
      })
    : null;

  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-xl">
        {!membership ? (
          <>
            <h1 className="text-[length:var(--text-h2)] leading-[0.94]">
              Membership not found
            </h1>
            <p className="mt-6 text-[var(--text-body)] leading-relaxed text-mist">
              We could not find that membership. If you have just paid, check
              your email for a confirmation — and get in touch if nothing
              arrives.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/memberships" size="lg">
                See memberships
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Contact us
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <Badge tone={membership.status === "ACTIVE" ? "positive" : "caution"}>
              {membership.status === "ACTIVE" ? "Active" : "Processing"}
            </Badge>

            <h1 className="mt-7 text-[length:var(--text-h2)] leading-[0.94]">
              {membership.status === "ACTIVE"
                ? "Welcome to The W"
                : "Almost there"}
            </h1>

            <p className="mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
              {membership.status === "ACTIVE"
                ? "Your membership is active. Show your member code at the desk on your first visit."
                : "Your payment is still being confirmed. Your membership activates as soon as it completes, and you will get an email either way."}
            </p>

            <Panel className="mt-10 p-7">
              <dl className="flex flex-col gap-4">
                <Row label="Membership" value={membership.plan.name} />
                <Row
                  label="Price"
                  value={`${formatPrice(membership.plan.priceCents, membership.plan.currency)} ${formatBillingInterval(membership.plan.interval)}`}
                />
                {membership.user.memberCode ? (
                  <Row label="Member code" value={membership.user.memberCode} mono />
                ) : null}
                <Row label="Account" value={membership.user.email} />
              </dl>
            </Panel>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/account" size="lg">
                Go to your account
              </ButtonLink>
              <ButtonLink href="/sauna/book" variant="secondary" size="lg">
                Book a recovery session
              </ButtonLink>
            </div>

            <p className="mt-10 border-t border-line pt-7 text-[var(--text-caption)] leading-relaxed text-mist-dim">
              Sign in any time with{" "}
              <span className="text-mist">{membership.user.email}</span> — we
              email you a link, so there is no password to remember.{" "}
              <Link
                href="/signin"
                className="text-mist underline underline-offset-4 transition-colors hover:text-bone"
              >
                Sign in
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
