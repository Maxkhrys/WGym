import { PlanCard } from "@/components/membership/PlanCard";
import { ArrowLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { getActivePlans } from "@/lib/queries/plans";

export async function MembershipPreview() {
  const plans = await getActivePlans();

  if (plans.length === 0) return null;

  return (
    <Section tone="cool" size="lg" className="border-t border-line">
      <div className="u-page">
        <SectionHeader
          eyebrow="Memberships"
          eyebrowIndex="04"
          title={
            <>
              Join on terms
              <br />
              <span className="text-mist-dim">that suit you.</span>
            </>
          }
          lead="Rolling monthly membership, a reduced student rate, or a single day pass if you just want to see the place."
          action={<ArrowLink href="/memberships">View Memberships</ArrowLink>}
        />

        <div className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {plans.slice(0, 3).map((plan, index) => (
            <Reveal key={plan.id} delay={index * 110} className="flex">
              <PlanCard
                plan={plan}
                emphasis={index === 0}
                className="w-full"
                ctaLabel={plan.isDayPass ? "Buy day pass" : "Choose plan"}
              />
            </Reveal>
          ))}
        </div>

        {PRICING_IS_PROVISIONAL ? (
          <Reveal delay={120}>
            <PlaceholderNote className="mt-14 max-w-2xl">
              Membership names and prices shown here are placeholders held in
              the database so the signup and payment flow can be tested. They
              are edited in the admin area and are not final business pricing.
            </PlaceholderNote>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
