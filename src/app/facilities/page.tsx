import { FacilitiesGallery } from "@/components/marketing/FacilitiesGallery";
import { OpeningHoursTable } from "@/components/marketing/OpeningHoursTable";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import type { MediaKey } from "@/config/media";
import { OPENING_HOURS_ARE_PROVISIONAL, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Facilities",
  description:
    "Gym floor, strength and cardio equipment, sauna, ice baths, hot tub and changing facilities at The W, Wicklow Rugby Club.",
  path: "/facilities",
});

const detail: { slot: MediaKey; name: string; copy: string }[] = [
  {
    slot: "gymFeature",
    name: "Gym floor",
    copy: "Open training space with room to move between stations rather than squeezing past them.",
  },
  {
    slot: "gymStrength",
    name: "Strength area",
    copy: "Racks, platforms, barbells and plates set up for programmed lifting.",
  },
  {
    slot: "gymFreeWeights",
    name: "Free weights",
    copy: "A full dumbbell range with adjustable benches.",
  },
  {
    slot: "gymCardio",
    name: "Cardio",
    copy: "Machines for intervals, steady work and warm-ups.",
  },
  {
    slot: "sauna",
    name: "Sauna",
    copy: "Timber-lined, booked by the slot so it never gets crowded.",
  },
  {
    slot: "iceBath",
    name: "Ice baths",
    copy: "Cold water immersion, taken at your own pace.",
  },
  {
    slot: "hotTub",
    name: "Hot tub",
    copy: "Warm water to finish on, or to use on its own.",
  },
  {
    slot: "changing",
    name: "Changing facilities",
    copy: "Showers and lockers on site. Bring a towel and a padlock.",
  },
];

export default async function FacilitiesPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Facilities"
        slot="gymHero"
        title={
          <>
            Everything
            <br />
            under one roof.
          </>
        }
        lead="A full gym floor and a proper recovery space, on the grounds of Wicklow Rugby Club with parking outside."
        primary={{ label: "Join The Gym", href: "/signup" }}
        secondary={{ label: "Book Sauna", href: "/sauna/book" }}
      />

      <FacilitiesGallery />

      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <SectionHeader
            eyebrow="In detail"
            eyebrowIndex="06"
            title="What's on site"
            lead="The full list, so you know exactly what you are getting before you come."
          />

          <div className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4">
            {detail.map((item, index) => (
              <Reveal key={item.name} delay={(index % 4) * 90}>
                <Media
                  slot={item.slot}
                  ratio="1/1"
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 100vw"
                  className="rounded-sm"
                />
                <h3 className="mt-6 text-[length:var(--text-h4)]">{item.name}</h3>
                <p className="mt-3 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {item.copy}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="cool" size="lg" className="border-t border-line">
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow index="07">Opening hours</Eyebrow>
                <div className="mt-8">
                  <OpeningHoursTable hours={settings.openingHours} />
                </div>
                {OPENING_HOURS_ARE_PROVISIONAL ? (
                  <PlaceholderNote className="mt-6">
                    Indicative hours, editable in the admin area.
                  </PlaceholderNote>
                ) : null}
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={100}>
                <Eyebrow index="08">Getting here</Eyebrow>
                <p className="u-measure mt-8 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                  We are on the grounds of {siteConfig.address.venue} in{" "}
                  {siteConfig.address.locality}, {siteConfig.address.postalCode}.
                </p>
                <p className="u-measure mt-5 text-[var(--text-body)] leading-relaxed text-mist-dim">
                  {settings.parkingSummary} {siteConfig.parking.detail}
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/contact">Find us</ButtonLink>
                  <ButtonLink href="/memberships" variant="secondary">
                    See memberships
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
