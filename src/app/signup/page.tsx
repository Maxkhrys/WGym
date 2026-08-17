import { SignupFlow } from "@/components/membership/SignupFlow";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { getSessionUser } from "@/lib/auth/guards";
import { getActivePlans } from "@/lib/queries/plans";
import { buildMetadata } from "@/lib/seo";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata = buildMetadata({
  title: "Join The Gym",
  description:
    "Join The W Gym & Sauna at Wicklow Rugby Club. Choose a membership, set up your account and start training.",
  path: "/signup",
});

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const plans = await getActivePlans();
  const user = await getSessionUser();

  return (
    <div className="u-page py-32 sm:py-40 lg:py-44">
      <div className="mx-auto w-full max-w-2xl">
        <p className="u-eyebrow">Join</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          Become a member
        </h1>
        <p className="u-measure mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
          A few details and you are set up. No password to remember — you sign
          in with a link sent to your email.
        </p>

        {params.cancelled ? (
          <p
            role="status"
            className="mt-8 rounded-xl border border-line-hi bg-ink-raised px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-mist"
          >
            That payment was cancelled, so no membership was started and you
            have not been charged. You can pick up where you left off below.
          </p>
        ) : null}

        {PRICING_IS_PROVISIONAL ? (
          <PlaceholderNote className="mt-8">
            Membership names and prices are provisional placeholders held in the
            database, editable in the admin area.
          </PlaceholderNote>
        ) : null}

        <div className="mt-14">
          <SignupFlow
            plans={plans.map((plan) => ({
              id: plan.id,
              slug: plan.slug,
              name: plan.name,
              tagline: plan.tagline,
              description: plan.description,
              priceCents: plan.priceCents,
              currency: plan.currency,
              interval: plan.interval,
              joiningFeeCents: plan.joiningFeeCents,
              features: plan.features,
              minimumTermMonths: plan.minimumTermMonths,
              cancellationNotice: plan.cancellationNotice,
              isDayPass: plan.isDayPass,
            }))}
            initialPlanSlug={params.plan ?? null}
            stripeConfigured={isStripeConfigured}
            signedInEmail={user?.email ?? null}
          />
        </div>
      </div>
    </div>
  );
}
