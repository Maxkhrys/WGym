import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import { OPENING_HOURS_ARE_PROVISIONAL, siteConfig } from "@/config/site";
import { getSettings } from "@/lib/settings";
import { OpeningHoursTable } from "@/components/marketing/OpeningHoursTable";

export async function LocationSection() {
  const settings = await getSettings();
  const { address, parking } = siteConfig;

  const mapQuery = encodeURIComponent(
    `${address.venue}, ${address.locality}, ${address.postalCode}, ${address.country}`,
  );

  return (
    <Section tone="cool" size="lg" id="location" className="border-t border-line">
      <div className="u-page">
        <SectionHeader
          eyebrow="Find Us"
          eyebrowIndex="08"
          title={
            <>
              Wicklow
              <br />
              <span className="text-mist-dim">Rugby Club.</span>
            </>
          }
          lead="On the club grounds, with parking on site."
        />

        <div className="mt-20 grid gap-x-16 gap-y-14 lg:mt-28 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-sm border border-line bg-ink-raised">
              {/* OpenStreetMap needs no API key and sets no third-party
                  tracking cookies, which keeps the cookie banner unnecessary.
                  Lazy-loaded so it never blocks the page. */}
              <iframe
                title={`Map showing ${siteConfig.name} at ${address.venue}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[22rem] w-full border-0 grayscale-[0.4] contrast-[1.1] sm:h-[28rem]"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  siteConfig.geo.longitude - 0.012
                }%2C${siteConfig.geo.latitude - 0.007}%2C${
                  siteConfig.geo.longitude + 0.012
                }%2C${siteConfig.geo.latitude + 0.007}&layer=mapnik&marker=${
                  siteConfig.geo.latitude
                }%2C${siteConfig.geo.longitude}`}
              />
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-2.5 text-[var(--text-body-sm)] text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
            >
              Open in Google Maps
              <span aria-hidden>↗</span>
            </a>
          </Reveal>

          <div className="flex flex-col gap-12 lg:col-span-5">
            <Reveal delay={90}>
              <h3 className="u-eyebrow">Address</h3>
              <address className="mt-5 not-italic text-[length:var(--text-body-lg)] leading-relaxed text-bone">
                {address.venue}
                <br />
                {address.locality}, {address.region}
                <br />
                {address.postalCode}
                <br />
                {address.country}
              </address>
            </Reveal>

            <Reveal delay={140} id="hours">
              <h3 className="u-eyebrow">Opening hours</h3>
              <div className="mt-5">
                <OpeningHoursTable hours={settings.openingHours} />
              </div>
              {OPENING_HOURS_ARE_PROVISIONAL ? (
                <PlaceholderNote className="mt-5">
                  These hours are indicative and editable in the admin area.
                  Confirm them before launch.
                </PlaceholderNote>
              ) : null}
            </Reveal>

            <Reveal delay={190}>
              <h3 className="u-eyebrow">Parking</h3>
              <p className="mt-5 text-[var(--text-body-sm)] leading-relaxed text-mist">
                {settings.parkingSummary}
              </p>
              <p className="mt-3 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
                {parking.detail}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <h3 className="u-eyebrow">Contact</h3>
              <div className="mt-5 flex flex-col gap-2.5 text-[var(--text-body-sm)]">
                {settings.contactEmail ? (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="w-fit text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                ) : null}
                {settings.contactPhone ? (
                  <a
                    href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                    className="w-fit text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                  >
                    {settings.contactPhone}
                  </a>
                ) : (
                  <PlaceholderNote>
                    No public phone number has been supplied yet. Add one in the
                    admin area and it will appear here and in the footer.
                  </PlaceholderNote>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
