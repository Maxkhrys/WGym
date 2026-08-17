import { Media } from "@/components/ui/Media";
import type { MediaKey } from "@/config/media";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";

const facilities: { slot: MediaKey; label: string; note: string }[] = [
  { slot: "gymFeature", label: "Gym floor", note: "Open training space" },
  { slot: "gymStrength", label: "Strength", note: "Racks and platforms" },
  { slot: "gymCardio", label: "Cardio", note: "Conditioning kit" },
  { slot: "sauna", label: "Sauna", note: "Dry heat" },
  { slot: "iceBath", label: "Ice bath", note: "Cold immersion" },
  { slot: "hotTub", label: "Hot tub", note: "Warm water" },
  { slot: "changing", label: "Changing", note: "Showers and lockers" },
];

/**
 * Horizontal rail on every breakpoint.
 *
 * A scrolling gallery reads as a deliberate editorial device on desktop and is
 * the natural gesture on a phone, so the same component serves both rather
 * than collapsing a grid. The rail bleeds to the screen edge so the last card
 * is visibly cut off — that is what tells the reader there is more.
 */
export function FacilitiesGallery() {
  return (
    <Section tone="cool" size="lg" id="facilities" className="border-t border-line">
      <div className="u-page">
        <SectionHeader
          eyebrow="Facilities"
          eyebrowIndex="05"
          title={
            <>
              Everything on
              <br />
              <span className="text-mist-dim">one site.</span>
            </>
          }
          lead="Train, wash, sweat and reset without leaving the building."
        />
      </div>

      <Reveal className="mt-16 lg:mt-24">
        <div
          className="u-rail u-no-scrollbar gap-4 px-[var(--spacing-gutter)] pb-4 sm:gap-6"
          // A labelled, focusable region: keyboard users can scroll the rail
          // with arrow keys once it has focus, and it is announced as a list.
          tabIndex={0}
          role="region"
          aria-label="Facilities gallery"
        >
          {facilities.map((item, index) => (
            <figure
              key={item.slot}
              className="w-[76vw] max-w-[26rem] sm:w-[42vw] lg:w-[28vw]"
              style={{
                // Alternating vertical offset keeps the rail from reading as a
                // filmstrip of identical tiles.
                marginTop: index % 2 === 1 ? "2.5rem" : undefined,
              }}
            >
              <Media
                slot={item.slot}
                ratio="4/5"
                sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 76vw"
                className="rounded-sm"
              />
              <figcaption className="mt-5 flex items-baseline justify-between gap-4">
                <span className="text-[length:var(--text-body-lg)] text-bone">
                  {item.label}
                </span>
                <span className="text-[var(--text-caption)] text-mist-dim">
                  {item.note}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
