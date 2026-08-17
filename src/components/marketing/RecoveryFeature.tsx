import { ArrowLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section } from "@/components/ui/Section";

const modalities = [
  {
    slot: "sauna",
    name: "Sauna",
    copy: "Dry heat, timber benches, and time away from a screen.",
  },
  {
    slot: "iceBath",
    name: "Ice Baths",
    copy: "Cold water immersion, straight after heat or on its own.",
  },
  {
    slot: "hotTub",
    name: "Hot Tub",
    copy: "Warm water to finish on, or to sit in and do nothing at all.",
  },
] as const;

/**
 * The temperature change.
 *
 * A tall gradient band carries the page from the gym's cool teal into the
 * sauna's amber before any warm content appears, so the shift reads as the
 * light changing rather than the brand changing. Everything below it opts into
 * `tone="warm"`, which re-points the accent tokens — the type, spacing and
 * component language are identical to the gym section above.
 */
export function RecoveryFeature() {
  return (
    <>
      <div
        aria-hidden
        data-tone="dusk"
        className="relative h-40 w-full sm:h-56 lg:h-72"
        style={{
          background:
            "linear-gradient(180deg, var(--color-ink) 0%, #0b1213 28%, #131010 68%, var(--color-ember-wash) 100%)",
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 100%, rgba(194,112,60,0.35) 0%, transparent 70%)",
          }}
        />
      </div>

      <Section
        tone="warm"
        size="lg"
        id="recovery"
        className="u-grain relative isolate overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--color-ember-wash) 0%, var(--color-ink) 55%)",
        }}
      >
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow index="03">Sauna &amp; Recovery</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                  Heat, cold,
                  <br />
                  <span className="text-accent-bright">and quiet.</span>
                </h2>
              </Reveal>
            </div>

            <div className="flex flex-col justify-end lg:col-span-5 lg:pb-2">
              <Reveal delay={140}>
                <p className="u-measure text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                  Recovery here is a session in its own right, not an
                  afterthought bolted onto the gym. Book it on its own, or use
                  it to finish a session properly.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="mt-20 grid gap-6 sm:grid-cols-3 lg:mt-28 lg:gap-8">
            {modalities.map((item, index) => (
              <Reveal
                key={item.name}
                delay={index * 110}
                // Staggered vertical offsets stop the three cards reading as a
                // template row.
                className={index === 1 ? "sm:mt-12" : index === 2 ? "sm:mt-24" : ""}
              >
                <Media
                  slot={item.slot}
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="rounded-sm"
                />
                <h3 className="mt-6 text-[length:var(--text-h4)]">{item.name}</h3>
                <p className="mt-3 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {item.copy}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160} className="mt-20 lg:mt-28">
            <ArrowLink href="/sauna">Book Recovery</ArrowLink>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
