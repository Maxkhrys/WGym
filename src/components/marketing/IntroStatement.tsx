import { Media } from "@/components/ui/Media";
import { MaskedLines, Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section } from "@/components/ui/Section";

/**
 * The editorial statement that follows the hero. Asymmetric on purpose: the
 * headline sits hard left across nine columns, the supporting copy drops into
 * the right column well below it, and a tall image breaks the grid on the far
 * side. Nothing is centred.
 */
export function IntroStatement() {
  return (
    <Section tone="cool" size="lg" className="overflow-hidden">
      <div className="u-page">
        <Reveal>
          <Eyebrow index="01">The W</Eyebrow>
        </Reveal>

        <div className="mt-12 grid gap-x-16 gap-y-14 lg:mt-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <MaskedLines
              className="text-[length:var(--text-h1)] font-medium leading-[0.92] tracking-[-0.04em]"
              lines={[
                "More than",
                "somewhere",
                <span key="train" className="text-mist-dim">
                  to train.
                </span>,
              ]}
            />
          </div>

          <div className="flex flex-col justify-end gap-7 lg:col-span-4 lg:pb-3">
            <Reveal delay={120}>
              <p className="text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                The W brings serious training and proper recovery under one
                roof. A full gym floor for the work, then sauna, ice and hot
                water for everything that comes after it.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-[length:var(--text-body)] leading-relaxed text-mist-dim">
                It sits inside Wicklow Rugby Club, and it is built for the
                people around it — members who want somewhere to train hard,
                reset properly, and see the same faces every week.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:mt-28 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <Media
              slot="gymCommunity"
              ratio="4/3"
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
            />
          </Reveal>

          <div className="flex flex-col justify-center gap-10 sm:col-span-1 lg:col-span-3 lg:px-2">
            {[
              { value: "3", label: "Recovery modalities on site" },
              { value: "7", label: "Days a week" },
            ].map((stat, index) => (
              <Reveal key={stat.label} delay={100 + index * 90}>
                <p className="u-tnum font-[family-name:var(--font-display)] text-[length:var(--text-h2)] leading-none text-accent-bright">
                  {stat.value}
                </p>
                <p className="mt-3 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal className="lg:col-span-4 lg:mt-24" delay={140}>
            <Media
              slot="sauna"
              ratio="3/4"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
