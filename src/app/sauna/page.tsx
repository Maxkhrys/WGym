import { OpeningHoursTable } from "@/components/marketing/OpeningHoursTable";
import { PageHero } from "@/components/marketing/PageHero";
import { Accordion } from "@/components/ui/Accordion";
import { ArrowLink, ButtonLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import type { MediaKey } from "@/config/media";
import { OPENING_HOURS_ARE_PROVISIONAL, bookingPolicy } from "@/config/site";
import { formatDuration, formatPrice } from "@/lib/format";
import { getActiveServices } from "@/lib/queries/services";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Sauna & Recovery",
  description:
    "Sauna, ice baths and hot tub at Wicklow Rugby Club. Book a recovery session at The W — sauna sessions, sauna and ice bath, or the full Sweat and Reset.",
  path: "/sauna",
});

const modalities: {
  slot: MediaKey;
  name: string;
  lead: string;
  copy: string;
}[] = [
  {
    slot: "sauna",
    name: "Sauna",
    lead: "Dry heat",
    copy: "Timber benches and a proper heat. Sit as long as you are comfortable, step out when you want to, and go back in if you feel like it. There is no schedule to keep to inside your slot.",
  },
  {
    slot: "iceBath",
    name: "Ice Baths",
    lead: "Cold water immersion",
    copy: "Cold water, taken at your own pace. Most people work up to it gradually — get in slowly, breathe steadily, and get out when you have had enough rather than when a timer says so.",
  },
  {
    slot: "hotTub",
    name: "Hot Tub",
    lead: "Warm water",
    copy: "Somewhere to finish, or somewhere to sit and do nothing at all. Useful between rounds of heat and cold, and just as good on its own.",
  },
];

const whatToBring = [
  "A towel — two if you plan to move between hot and cold",
  "Swimwear (required in all shared areas)",
  "Flip-flops or sliders",
  "A water bottle",
  "A change of clothes",
];

const rules = [
  "Arrive five minutes before your slot so you can change and start on time.",
  "Shower before entering the sauna, ice bath or hot tub.",
  "Swimwear must be worn in all shared areas.",
  "No glass, no alcohol, and no phones in the sauna.",
  "Sessions run to the booked time so the next group can start on schedule.",
  "Under-18s must be accompanied by a booking adult.",
];

const faqs = [
  {
    question: "Do I need to be a gym member to book?",
    answer:
      "No. Recovery sessions can be booked by anyone. Members get a reduced rate, and can book directly from their account.",
  },
  {
    question: "How many people can I book for?",
    answer:
      "Most sessions take a small group — the exact number depends on which session you choose and is shown on the booking page. Private hire takes the whole space for your group.",
  },
  {
    question: "What if I have never used a sauna or ice bath before?",
    answer:
      "That is fine, and common. Go at your own pace, take breaks whenever you want, and get out if anything feels uncomfortable. Staff are on site if you have questions about how it works.",
  },
  {
    question: "Should I check with a doctor first?",
    answer:
      "If you have any health condition, are pregnant, or are unsure whether heat or cold exposure is suitable for you, speak to your GP or a qualified health professional before booking. We are not able to give medical advice.",
  },
  {
    question: "Can I cancel or change my booking?",
    answer: `You can cancel from your account up to ${bookingPolicy.freeCancellationHours} hours before your session. Inside that window the session is non-refundable, since the slot can no longer be offered to anyone else.`,
  },
  {
    question: "What happens if I am late?",
    answer:
      "Your slot runs to its booked end time so the next booking is not pushed back. Arriving late shortens your session rather than extending it.",
  },
];

export default async function SaunaPage() {
  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const services = await getActiveServices();
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Sauna & Recovery"
        slot="saunaHero"
        tone="warm"
        title={
          <>
            Sweat.
            <br />
            Reset.
          </>
        }
        lead="Sauna, ice baths and hot tub at Wicklow Rugby Club. Booked by the slot, taken at your own pace."
        primary={{ label: "Book a session", href: "/sauna/book" }}
        secondary={{ label: "See what's included", href: "#sessions" }}
      />

      {/* Intro */}
      <Section
        tone="warm"
        size="lg"
        className="u-grain relative isolate"
        style={{
          background:
            "linear-gradient(180deg, var(--color-ember-wash) 0%, var(--color-ink) 60%)",
        }}
      >
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow index="01">Recovery</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Time set aside
                  <br />
                  <span className="text-accent-bright">for the after.</span>
                </h2>
              </Reveal>
            </div>
            <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-2">
              <Reveal delay={140}>
                <p className="u-measure text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                  Heat, cold and warm water in one place, booked as a session
                  rather than squeezed in around a gym slot. Come after
                  training, or come for this on its own.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="u-measure text-[var(--text-body)] leading-relaxed text-mist-dim">
                  Capacity is kept deliberately low so it stays calm. That is
                  the point of it.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* Modalities */}
      <Section tone="warm" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="flex flex-col gap-20 lg:gap-28">
            {modalities.map((item, index) => {
              const imageFirst = index % 2 === 0;

              return (
                <Reveal key={item.name}>
                  <div className="grid items-center gap-x-16 gap-y-8 lg:grid-cols-2">
                    <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
                      <Media
                        slot={item.slot}
                        ratio="4/5"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="rounded-sm"
                      />
                    </div>
                    <div
                      className={
                        imageFirst ? "lg:order-2 lg:pl-6" : "lg:order-1 lg:pr-6"
                      }
                    >
                      <p className="u-eyebrow text-accent-bright">{item.lead}</p>
                      <h2 className="mt-5 text-[length:var(--text-h2)] leading-[0.94]">
                        {item.name}
                      </h2>
                      <p className="u-measure mt-7 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Sessions & pricing */}
      <Section
        tone="warm"
        size="lg"
        id="sessions"
        className="border-t border-line"
      >
        <div className="u-page">
          <SectionHeader
            eyebrow="Sessions"
            eyebrowIndex="02"
            title={
              <>
                Choose your
                <br />
                <span className="text-mist-dim">session.</span>
              </>
            }
            lead="Each one is a booked slot with the space kept to a set number of people."
            action={<ArrowLink href="/sauna/book">Check availability</ArrowLink>}
          />

          <div className="mt-20 flex flex-col lg:mt-28">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 80}>
                <article className="grid items-baseline gap-x-10 gap-y-4 border-t border-line-hi py-9 last:border-b sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <h3 className="text-[length:var(--text-h4)]">
                      {service.name}
                    </h3>
                    {service.tagline ? (
                      <p className="mt-2 text-[var(--text-body-sm)] text-mist-dim">
                        {service.tagline}
                      </p>
                    ) : null}
                  </div>

                  <p className="u-measure text-[var(--text-body-sm)] leading-relaxed text-mist sm:col-span-4">
                    {service.description}
                  </p>

                  <dl className="flex flex-wrap gap-x-8 gap-y-2 sm:col-span-3 sm:justify-end sm:text-right">
                    <div>
                      <dt className="sr-only">Duration</dt>
                      <dd className="u-tnum text-[var(--text-body-sm)] text-mist">
                        {formatDuration(service.durationMinutes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Price</dt>
                      <dd className="u-tnum font-[family-name:var(--font-display)] text-[length:var(--text-h4)] leading-none text-accent-bright">
                        {formatPrice(service.priceCents, service.currency)}
                      </dd>
                    </div>
                  </dl>
                </article>
              </Reveal>
            ))}
          </div>

          {PRICING_IS_PROVISIONAL ? (
            <Reveal delay={120}>
              <PlaceholderNote className="mt-12 max-w-2xl">
                Session names, durations and prices are placeholders held in the
                database so booking and payment can be tested. They are edited
                in the admin area and are not final business pricing.
              </PlaceholderNote>
            </Reveal>
          ) : null}

          <Reveal delay={160} className="mt-14">
            <ButtonLink href="/sauna/book" size="lg">
              Book a session
            </ButtonLink>
          </Reveal>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="warm" size="lg" className="border-t border-line">
        <div className="u-page">
          <SectionHeader
            eyebrow="How it works"
            eyebrowIndex="03"
            title="Before you arrive"
            align="stack"
          />

          <div className="mt-16 grid gap-x-16 gap-y-14 lg:mt-20 lg:grid-cols-3">
            <Reveal>
              <h3 className="u-eyebrow">The session</h3>
              <ol className="mt-6 flex flex-col gap-5">
                {[
                  "Pick a session, date and time, and pay to confirm the slot.",
                  "You get a confirmation email with your booking reference.",
                  "Arrive five minutes early, change, and shower before you start.",
                  "Use the time however suits you — there is no set circuit.",
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 text-[var(--text-body-sm)] leading-relaxed text-mist"
                  >
                    <span className="u-tnum shrink-0 text-accent-bright">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={100}>
              <h3 className="u-eyebrow">What to bring</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {whatToBring.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[var(--text-body-sm)] leading-relaxed text-mist"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={180}>
              <h3 className="u-eyebrow">House rules</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {rules.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[var(--text-body-sm)] leading-relaxed text-mist"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-line-hi"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Deliberately general wording. No health claims are made anywhere
              on this page, and anything medical is directed to a professional. */}
          <Reveal delay={220}>
            <p className="u-measure mt-16 border-t border-line pt-8 text-[var(--text-caption)] leading-relaxed text-mist-dim">
              Sauna, ice bath and hot tub use is offered as a wellness facility.
              We do not make medical claims about it. If you have a health
              condition, are pregnant, or are unsure whether heat or cold
              exposure is suitable for you, please speak to your GP or a
              qualified health professional before booking.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Hours & booking */}
      <Section tone="warm" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow index="04">Opening hours</Eyebrow>
                <div className="mt-8">
                  <OpeningHoursTable hours={settings.openingHours} />
                </div>
                {OPENING_HOURS_ARE_PROVISIONAL ? (
                  <PlaceholderNote className="mt-6">
                    Indicative hours, editable in the admin area. Bookable slots
                    are generated from these.
                  </PlaceholderNote>
                ) : null}
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={100}>
                <Eyebrow index="05">Questions</Eyebrow>
                <div className="mt-8">
                  <Accordion items={faqs} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
