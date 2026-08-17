import { PageHero } from "@/components/marketing/PageHero";
import { TrainerSection } from "@/components/marketing/TrainerSection";
import { ButtonLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "The W Gym & Sauna is a gym and recovery space at Wicklow Rugby Club, built around serious training, proper recovery and the community around it.",
  path: "/about",
});

const principles = [
  {
    title: "Train properly",
    copy: "Real equipment, enough of it, and the space to use it. No queuing for a rack, no session planned around what happens to be free.",
  },
  {
    title: "Recover properly",
    copy: "Sauna, ice and hot water on the same site, booked as a session in its own right rather than an afterthought.",
  },
  {
    title: "Keep it calm",
    copy: "Capacity is deliberately limited in the recovery space. It is meant to be somewhere you can think.",
  },
  {
    title: "Belong to it",
    copy: "A local gym inside a local club. The same faces every week, and staff who know your name.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        slot="location"
        title={
          <>
            A gym built
            <br />
            for Wicklow.
          </>
        }
        lead="The W sits inside Wicklow Rugby Club — a full gym floor and a proper recovery space, run for the people who live and train around it."
        primary={{ label: "Join The Gym", href: "/signup" }}
        secondary={{ label: "See facilities", href: "/facilities" }}
      />

      <Section tone="cool" size="lg">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow index="01">The idea</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Two halves of
                  <br />
                  <span className="text-mist-dim">the same thing.</span>
                </h2>
              </Reveal>
            </div>

            <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-2">
              <Reveal delay={140}>
                <p className="u-measure text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                  Most gyms treat recovery as something you do elsewhere, if at
                  all. The W was set up on the view that the work and the
                  recovery belong in the same building, because that is the only
                  way most people will actually do both.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="u-measure text-[var(--text-body)] leading-relaxed text-mist-dim">
                  So there is a properly equipped floor for training, and a
                  sauna, ice bath and hot tub for afterwards — with the recovery
                  side kept small on purpose so it stays worth using.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal className="mt-20 lg:mt-28">
            <Media
              slot="location"
              ratio="21/9"
              sizes="100vw"
              className="rounded-sm"
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <SectionHeader
            eyebrow="What we care about"
            eyebrowIndex="02"
            title="How we run it"
            lead="Four things we try to get right, and keep getting right."
          />

          <div className="mt-20 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:mt-28">
            {principles.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <div className="border-t border-line-hi pt-7">
                  <p className="u-tnum u-eyebrow text-accent-bright">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 text-[length:var(--text-h4)]">
                    {item.title}
                  </h3>
                  <p className="u-measure mt-4 text-[var(--text-body)] leading-relaxed text-mist">
                    {item.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TrainerSection />

      <Section tone="cool" size="md" className="border-t border-line">
        <div className="u-page">
          <Reveal>
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="max-w-[20ch] text-[length:var(--text-h3)] leading-[0.96]">
                  Come and have a look.
                </h2>
                <p className="u-measure mt-5 text-[var(--text-body)] leading-relaxed text-mist">
                  {siteConfig.address.venue}, {siteConfig.address.locality},{" "}
                  {siteConfig.address.postalCode}.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/contact" size="lg">
                  Get in touch
                </ButtonLink>
                <ButtonLink href="/memberships" variant="secondary" size="lg">
                  See memberships
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
