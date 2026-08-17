import { ArrowLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section } from "@/components/ui/Section";

const capabilities = [
  {
    title: "Strength",
    copy: "Racks, platforms and barbells set up for real lifting, not a circuit of machines.",
  },
  {
    title: "Free weights",
    copy: "A full dumbbell range with the bench space to actually use it.",
  },
  {
    title: "Cardio",
    copy: "Conditioning kit for intervals, steady work and warm-ups.",
  },
  {
    title: "Functional",
    copy: "Open floor for sleds, carries, kettlebells and anything that needs room.",
  },
  {
    title: "Personal training",
    copy: "Coaching for anyone starting out, coming back, or chasing a number.",
  },
  {
    title: "Flexible membership",
    copy: "Monthly, student and day-pass options rather than a locked-in year.",
  },
];

export function GymFeature() {
  return (
    <Section tone="cool" size="lg" id="gym" className="border-t border-line">
      <div className="u-page">
        <div className="grid gap-x-16 gap-y-16 lg:grid-cols-12">
          {/* Image column leads on desktop — the page has been typographic for
              two sections and needs a photographic anchor here. */}
          <Reveal className="lg:col-span-6 lg:sticky lg:top-32 lg:self-start">
            <Media
              slot="gymFeature"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="rounded-sm"
            />
          </Reveal>

          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow index="02">The Gym</Eyebrow>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="mt-8 text-[length:var(--text-h2)] leading-[0.94]">
                Built for the work,
                <br />
                <span className="text-mist-dim">not the photos.</span>
              </h2>
            </Reveal>

            <Reveal delay={140}>
              <p className="u-measure mt-8 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                A properly equipped floor with enough space to move, whether
                you have trained for ten years or you are walking in for the
                first week.
              </p>
            </Reveal>

            <dl className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-2">
              {capabilities.map((item, index) => (
                <Reveal key={item.title} delay={60 + index * 60}>
                  <dt className="flex items-baseline gap-3 text-[length:var(--text-body)] font-medium text-bone">
                    <span
                      aria-hidden
                      className="h-1 w-1 shrink-0 translate-y-[-0.25em] rounded-full bg-accent-bright"
                    />
                    {item.title}
                  </dt>
                  <dd className="mt-2.5 pl-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
                    {item.copy}
                  </dd>
                </Reveal>
              ))}
            </dl>

            <Reveal delay={200} className="mt-14">
              <ArrowLink href="/gym">Explore Gym</ArrowLink>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
