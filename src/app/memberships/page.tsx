import { PlanCard } from "@/components/membership/PlanCard";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { DataRow, PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { bookingPolicy } from "@/config/site";
import { formatBillingInterval, formatPrice } from "@/lib/format";
import { getActivePlans } from "@/lib/queries/plans";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Memberships",
  description:
    "Gym membership at The W, Wicklow Rugby Club. Rolling monthly membership, a student rate, and day passes — join online in a few minutes.",
  path: "/memberships",
});

const included = [
  "Unlimited gym access during opening hours",
  "Strength, free weight, cardio and functional floor",
  "Changing facilities, showers and lockers",
  "Member rate on sauna and recovery bookings",
  "Free parking on site",
  "Manage or cancel from your own account",
];

const faqs = [
  {
    question: "How do I cancel?",
    answer:
      "From your account, at any time. Your access continues until the end of the period you have already paid for, and you are not charged again after that.",
  },
  {
    question: "Is there a joining fee?",
    answer:
      "Any joining fee is shown on the plan itself before you pay, and again on the payment summary. Nothing is added at checkout that you have not already seen.",
  },
  {
    question: "How is payment taken?",
    answer:
      "Monthly memberships are recurring card payments handled by Stripe. Card details are entered on Stripe's own payment page and are never stored by us.",
  },
  {
    question: "Can I pause my membership?",
    answer:
      "Get in touch and we will let you know what is possible. Pause handling is arranged manually at the moment rather than through your account.",
  },
  {
    question: "Does a membership include sauna sessions?",
    answer:
      "Recovery sessions are booked and paid for separately so the space stays at a sensible capacity, but members book at a reduced rate.",
  },
  {
    question: "Can I book sauna sessions without a membership?",
    answer:
      "Yes. Recovery sessions are open to everyone — you do not need a gym membership to book one.",
  },
];

export default async function MembershipsPage() {
  const plans = await getActivePlans();
  const recurring = plans.filter((plan) => !plan.isDayPass);
  const passes = plans.filter((plan) => plan.isDayPass);

  return (
    <>
      {/* Typographic hero — no photograph. The page is about the decision, and
          a plate here would only delay the plans. */}
      <section className="u-grain relative isolate overflow-hidden border-b border-line bg-ink pb-20 pt-40 sm:pb-24 lg:pb-28 lg:pt-52">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[60%] opacity-70"
          style={{
            background:
              "radial-gradient(70% 100% at 25% 0%, color-mix(in oklab, var(--color-teal) 22%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="u-page">
          <p className="u-eyebrow c-fade-up">Memberships</p>
          <h1
            className="c-fade-up mt-7 max-w-[14ch] text-[length:var(--text-h1)] leading-[0.9]"
            style={{ ["--reveal-delay" as string]: "80ms" }}
          >
            Join on terms that suit you.
          </h1>
          <p
            className="c-fade-up u-measure mt-8 text-[length:var(--text-lead)] leading-[1.45] text-mist"
            style={{ ["--reveal-delay" as string]: "180ms" }}
          >
            Rolling monthly membership with no fixed term, a reduced student
            rate, or a single day pass. Join online and you can train the same
            day.
          </p>
        </div>
      </section>

      {/* Plans */}
      <Section tone="cool" size="lg">
        <div className="u-page">
          <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {recurring.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 110} className="flex">
                <PlanCard plan={plan} emphasis={index === 0} className="w-full" />
              </Reveal>
            ))}
            {passes.map((plan, index) => (
              <Reveal
                key={plan.id}
                delay={(recurring.length + index) * 110}
                className="flex"
              >
                <PlanCard
                  plan={plan}
                  className="w-full"
                  ctaLabel="Buy day pass"
                />
              </Reveal>
            ))}
          </div>

          {PRICING_IS_PROVISIONAL ? (
            <Reveal delay={140}>
              <PlaceholderNote className="mt-16 max-w-2xl">
                These plans, prices and terms are placeholders stored in the
                database so the full signup and payment flow can be tested end
                to end. They are edited in the admin area and are not final
                business pricing.
              </PlaceholderNote>
            </Reveal>
          ) : null}
        </div>
      </Section>

      {/* What's included */}
      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow index="01">Included</Eyebrow>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  In every
                  <br />
                  <span className="text-mist-dim">membership.</span>
                </h2>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <ul className="flex flex-col">
                {included.map((item, index) => (
                  <Reveal key={item} delay={index * 60}>
                    <li className="flex items-start gap-4 border-b border-line py-4 text-[length:var(--text-body)] text-mist first:border-t">
                      <span
                        aria-hidden
                        className="mt-[0.62em] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
                      />
                      {item}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Terms comparison */}
      {recurring.length > 0 ? (
        <Section tone="cool" size="lg" className="border-t border-line">
          <div className="u-page">
            <SectionHeader
              eyebrow="The detail"
              eyebrowIndex="02"
              title="Terms, side by side"
              lead="Everything that affects what you pay and how you leave, in one place rather than buried in the small print."
            />

            <div className="mt-16 grid gap-x-12 gap-y-14 lg:mt-20 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <Reveal key={plan.id} delay={index * 100}>
                  <h3 className="text-[length:var(--text-h4)]">{plan.name}</h3>
                  <dl className="mt-6">
                    <DataRow
                      label="Price"
                      value={`${formatPrice(plan.priceCents, plan.currency)} ${formatBillingInterval(plan.interval)}`}
                    />
                    <DataRow
                      label="Joining fee"
                      value={
                        plan.joiningFeeCents > 0
                          ? formatPrice(plan.joiningFeeCents, plan.currency)
                          : "None"
                      }
                    />
                    <DataRow
                      label="Minimum term"
                      value={
                        plan.minimumTermMonths > 0
                          ? `${plan.minimumTermMonths} month${plan.minimumTermMonths === 1 ? "" : "s"}`
                          : "None"
                      }
                    />
                    <DataRow
                      label="Notice to cancel"
                      value={plan.cancellationNotice ?? "—"}
                    />
                    <DataRow
                      label="Billing"
                      value={
                        plan.interval === "ONE_TIME" ? "Single payment" : "Recurring"
                      }
                    />
                  </dl>
                  {plan.cancellationPolicy ? (
                    <p className="mt-5 text-[var(--text-caption)] leading-relaxed text-mist-dim">
                      {plan.cancellationPolicy}
                    </p>
                  ) : null}
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {/* FAQ + CTA */}
      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow index="03">FAQ</Eyebrow>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Questions
                </h2>
              </Reveal>
              <Reveal delay={140} className="mt-10">
                <p className="text-[var(--text-body-sm)] leading-relaxed text-mist">
                  Cancel a recovery booking free of charge up to{" "}
                  {bookingPolicy.freeCancellationHours} hours before it starts.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal delay={100}>
                <Accordion items={faqs} />
              </Reveal>
            </div>
          </div>

          <Reveal delay={160}>
            <div className="mt-24 flex flex-col items-start gap-8 border-t border-line pt-14 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="max-w-[18ch] text-[length:var(--text-h3)] leading-[0.96]">
                Ready when you are.
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/signup" size="lg">
                  Join The Gym
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary" size="lg">
                  Ask a question
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
