import { PageHero } from "@/components/marketing/PageHero";
import { OpeningHoursTable } from "@/components/marketing/OpeningHoursTable";
import { TrainerSection } from "@/components/marketing/TrainerSection";
import { Accordion } from "@/components/ui/Accordion";
import { ArrowLink, ButtonLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import type { MediaKey } from "@/config/media";
import { OPENING_HOURS_ARE_PROVISIONAL } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { getActivePlans } from "@/lib/queries/plans";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Gym",
  description:
    "A fully equipped gym in Wicklow: strength, free weights, cardio and functional training, with personal training and flexible memberships at Wicklow Rugby Club.",
  path: "/gym",
});

const zones: { name: string; copy: string; detail: string; slot: MediaKey }[] = [
  {
    name: "Strength",
    copy: "Racks, platforms and bars",
    detail:
      "Set up so you can squat, press, pull and deadlift without queuing behind a machine circuit. Space to load a bar properly and leave it loaded between sets.",
    slot: "gymStrength",
  },
  {
    name: "Free weights",
    copy: "Dumbbells and benches",
    detail:
      "A full dumbbell range with enough benches that accessory work does not turn into a waiting game. Adjustable benches for incline and shoulder work.",
    slot: "gymFreeWeights",
  },
  {
    name: "Cardio",
    copy: "Conditioning and warm-ups",
    detail:
      "Machines for intervals, steady-state and getting warm before you lift. Enough of them that the floor still works at peak times.",
    slot: "gymCardio",
  },
  {
    name: "Functional",
    copy: "Open floor and rig",
    detail:
      "Room for sleds, carries, kettlebells, bands and anything that needs space rather than a fixed station. Useful for conditioning finishers and for rehab work.",
    slot: "gymFunctional",
  },
];

const audiences = [
  {
    title: "If you are new to this",
    copy: "Nobody expects you to know what you are doing on day one. Ask at the desk, book an induction, or start with a few personal training sessions until the floor feels like yours.",
  },
  {
    title: "If you have trained for years",
    copy: "Proper bars, real loading, and no one moving you off a rack after fifteen minutes. The floor is set up for programmed strength work, not just circuits.",
  },
];

const faqs = [
  {
    question: "Do I need to sign up for a fixed term?",
    answer:
      "No. The monthly membership rolls month to month and is cancelled from your account with one month's notice. There is also a day pass if you would rather not commit at all.",
  },
  {
    question: "Can I use the sauna and ice baths with a gym membership?",
    answer:
      "Recovery sessions are booked separately so the space stays at a sensible capacity. Members get a reduced rate. You can book from your account once your membership is active.",
  },
  {
    question: "Is there an induction?",
    answer:
      "Yes — ask when you join and we will get you shown around the floor. If you would like more than an introduction, personal training sessions are available.",
  },
  {
    question: "Do you have changing facilities?",
    answer:
      "Yes, with showers and lockers on site. Bring a towel and a padlock if you would like to leave anything while you train.",
  },
  {
    question: "What is parking like?",
    answer:
      "There is free parking on the Wicklow Rugby Club grounds. It is shared with the club, so it can be busier around fixtures and training nights.",
  },
  {
    question: "Can I freeze my membership?",
    answer:
      "Contact us and we will let you know what is possible. Pause handling is being finalised with our payment provider, so this is arranged manually for now.",
  },
];

export default async function GymPage() {
  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const plans = await getActivePlans();
  const settings = await getSettings();
  const cheapestMonthly = plans
    .filter((plan) => plan.interval === "MONTH")
    .sort((a, b) => a.priceCents - b.priceCents)[0];

  return (
    <>
      <PageHero
        eyebrow="The Gym"
        slot="gymHero"
        title={
          <>
            Somewhere to
            <br />
            do the work.
          </>
        }
        lead="A properly equipped floor at Wicklow Rugby Club — strength, free weights, cardio and open space — with coaching if you want it and flexible membership either way."
        primary={{ label: "Join The Gym", href: "/signup" }}
        secondary={{ label: "See memberships", href: "/memberships" }}
      />

      {/* Introduction */}
      <Section tone="cool" size="lg">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow index="01">The floor</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Equipped for lifting,
                  <br />
                  <span className="text-mist-dim">sized for people.</span>
                </h2>
              </Reveal>
            </div>
            <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-2">
              <Reveal delay={140}>
                <p className="u-measure text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                  The gym is built around the things that actually move the
                  needle: barbells, dumbbells, space to work, and enough
                  equipment that you are not planning your session around
                  what is free.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="u-measure text-[var(--text-body)] leading-relaxed text-mist-dim">
                  And because recovery sits in the same building, finishing a
                  hard session properly is a walk across the corridor rather
                  than a separate trip.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* Training zones */}
      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <SectionHeader
            eyebrow="Training zones"
            eyebrowIndex="02"
            title={
              <>
                Four ways
                <br />
                <span className="text-mist-dim">to train.</span>
              </>
            }
            lead="The floor is zoned so heavy work, accessory work and conditioning are not fighting for the same square metres."
          />

          <div className="mt-20 flex flex-col gap-20 lg:mt-28 lg:gap-28">
            {zones.map((zone, index) => {
              // Alternate which side the photograph falls on. Order is only
              // applied from `lg` up; on smaller screens every zone stacks
              // image-then-text, which is the order the copy reads in.
              const imageFirst = index % 2 === 0;

              return (
                <Reveal key={zone.name}>
                  <div className="grid items-center gap-x-16 gap-y-8 lg:grid-cols-2">
                    <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
                      <Media
                        slot={zone.slot}
                        ratio="3/2"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="rounded-sm"
                      />
                    </div>
                    <div
                      className={
                        imageFirst ? "lg:order-2 lg:pl-6" : "lg:order-1 lg:pr-6"
                      }
                    >
                      <p className="u-tnum u-eyebrow text-accent-bright">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-5 text-[length:var(--text-h3)]">
                        {zone.name}
                      </h3>
                      <p className="mt-3 text-[length:var(--text-body-lg)] text-mist-dim">
                        {zone.copy}
                      </p>
                      <p className="u-measure mt-6 text-[var(--text-body)] leading-relaxed text-mist">
                        {zone.detail}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Who it's for */}
      <Section tone="cool" size="md" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
            {audiences.map((item, index) => (
              <Reveal key={item.title} delay={index * 110}>
                <div className="border-t border-line-hi pt-8">
                  <h3 className="text-[length:var(--text-h4)]">{item.title}</h3>
                  <p className="u-measure mt-5 text-[var(--text-body)] leading-relaxed text-mist">
                    {item.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TrainerSection />

      {/* Membership benefits + hours */}
      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow index="09">Membership</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  What you get
                  <br />
                  <span className="text-mist-dim">for the month.</span>
                </h2>
              </Reveal>

              <ul className="mt-12 flex flex-col">
                {[
                  "Unlimited gym access during opening hours",
                  "Full strength, free weight, cardio and functional floor",
                  "Changing facilities, showers and lockers",
                  "Member rate on sauna and recovery bookings",
                  "Rolling monthly — cancel from your account",
                  "Free parking on site",
                ].map((item, index) => (
                  <Reveal key={item} delay={index * 60}>
                    <li className="flex items-start gap-4 border-b border-line py-4 text-[length:var(--text-body)] text-mist">
                      <span
                        aria-hidden
                        className="mt-[0.62em] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
                      />
                      {item}
                    </li>
                  </Reveal>
                ))}
              </ul>

              {cheapestMonthly ? (
                <Reveal delay={200} className="mt-12">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <span className="text-[var(--text-body-sm)] text-mist">
                      From
                    </span>
                    <span className="u-tnum font-[family-name:var(--font-display)] text-[length:var(--text-h3)] leading-none text-accent-bright">
                      {formatPrice(cheapestMonthly.priceCents, cheapestMonthly.currency)}
                    </span>
                    <span className="text-[var(--text-body-sm)] text-mist">
                      per month
                    </span>
                  </div>
                  {PRICING_IS_PROVISIONAL ? (
                    <PlaceholderNote className="mt-6 max-w-xl">
                      Provisional pricing held in the database for testing —
                      edited in the admin area, not final business pricing.
                    </PlaceholderNote>
                  ) : null}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/signup" size="lg">
                      Join The Gym
                    </ButtonLink>
                    <ButtonLink href="/memberships" variant="secondary" size="lg">
                      Compare plans
                    </ButtonLink>
                  </div>
                </Reveal>
              ) : null}
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delay={120}>
                <h3 className="u-eyebrow">Opening hours</h3>
                <div className="mt-6">
                  <OpeningHoursTable hours={settings.openingHours} />
                </div>
                {OPENING_HOURS_ARE_PROVISIONAL ? (
                  <PlaceholderNote className="mt-6">
                    Indicative hours, editable in the admin area.
                  </PlaceholderNote>
                ) : null}
                <div className="mt-8">
                  <ArrowLink href="/contact">Get in touch</ArrowLink>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow index="10">FAQ</Eyebrow>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Questions
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal delay={100}>
                <Accordion items={faqs} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
