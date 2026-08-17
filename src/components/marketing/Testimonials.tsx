import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";

/**
 * ── NO TESTIMONIALS HAVE BEEN SUPPLIED ────────────────────────────────────
 * This array is intentionally empty. Nothing here is invented: fabricated
 * reviews are both dishonest and, for a business trading in Ireland, a
 * consumer-protection problem.
 *
 * To publish real ones, add entries below (or move this to the database and
 * an admin form — the component takes the same shape either way). The section
 * renders the quotes as soon as the array is non-empty and shows the
 * placeholder notice until then.
 * ──────────────────────────────────────────────────────────────────────────
 */
type Testimonial = {
  quote: string;
  name: string;
  /** e.g. "Member since 2024" — optional context, never a fabricated rating. */
  context?: string;
};

const testimonials: Testimonial[] = [];

export function Testimonials() {
  return (
    <Section tone="cool" size="md" className="border-t border-line">
      <div className="u-page">
        <SectionHeader
          eyebrow="Members"
          eyebrowIndex="07"
          title={
            <>
              In their
              <br />
              <span className="text-mist-dim">own words.</span>
            </>
          }
          align="stack"
        />

        {testimonials.length > 0 ? (
          <div className="mt-16 grid gap-x-12 gap-y-14 lg:mt-20 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 110}>
                <figure className="flex h-full flex-col border-t border-line-hi pt-7">
                  <blockquote className="text-[length:var(--text-body-lg)] leading-relaxed text-bone">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-7 text-[var(--text-body-sm)] text-mist">
                    {item.name}
                    {item.context ? (
                      <span className="mt-1 block text-[var(--text-caption)] text-mist-dim">
                        {item.context}
                      </span>
                    ) : null}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-12">
            <PlaceholderNote className="max-w-2xl">
              No member testimonials have been supplied yet, so none are shown.
              This section stays empty rather than displaying placeholder
              quotes — add real ones and they will appear here automatically.
            </PlaceholderNote>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
