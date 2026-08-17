import { ButtonLink } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PlaceholderNote } from "@/components/ui/Surface";
import { getActiveTrainers } from "@/lib/queries/services";

/**
 * Trainers come from the database, so adding a second coach later is a row,
 * not a code change. The founder is rendered as a full-width feature and any
 * subsequent trainers fall into a grid beneath.
 */
export async function TrainerSection() {
  const trainers = await getActiveTrainers();

  if (trainers.length === 0) return null;

  const [founder, ...others] = trainers;

  return (
    <Section
      tone="cool"
      size="lg"
      id="personal-training"
      className="border-t border-line"
    >
      <div className="u-page">
        <SectionHeader
          eyebrow="Personal Training"
          eyebrowIndex="06"
          title={
            <>
              Coaching, when
              <br />
              <span className="text-mist-dim">you want it.</span>
            </>
          }
          lead="One-to-one sessions for anyone starting from scratch, coming back from a break, or working toward something specific."
        />

        <div className="mt-20 grid gap-x-16 gap-y-12 lg:mt-28 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Media
              slot="founder"
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="rounded-sm"
            />
          </Reveal>

          <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
            <Reveal delay={90}>
              <p className="u-eyebrow text-accent-bright">{founder.role}</p>
              <h3 className="mt-5 text-[length:var(--text-h3)]">{founder.name}</h3>
            </Reveal>

            <Reveal delay={150}>
              <p className="u-measure mt-7 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
                {founder.bio}
              </p>
            </Reveal>

            {founder.specialties.length > 0 ? (
              <Reveal delay={200} className="mt-9">
                <ul className="flex flex-wrap gap-2.5">
                  {founder.specialties.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-line-hi px-3.5 py-1.5 text-[var(--text-caption)] text-mist"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            {founder.qualifications.length > 0 ? (
              <Reveal delay={240} className="mt-9">
                <h4 className="u-eyebrow">Qualifications</h4>
                <ul className="mt-4 flex flex-col gap-2">
                  {founder.qualifications.map((item) => (
                    <li
                      key={item}
                      className="text-[var(--text-body-sm)] text-mist"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : (
              <Reveal delay={240} className="mt-9">
                <PlaceholderNote>
                  Qualifications are stored per trainer in the admin area and
                  will appear here once supplied. Nothing is listed until then.
                </PlaceholderNote>
              </Reveal>
            )}

            <Reveal delay={290} className="mt-10">
              <ButtonLink href="/contact?subject=personal-training" variant="secondary">
                Enquire about training
              </ButtonLink>
            </Reveal>
          </div>
        </div>

        {others.length > 0 ? (
          <div className="mt-24 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((trainer, index) => (
              <Reveal key={trainer.id} delay={index * 100}>
                <Media slot="founder" ratio="4/5" sizes="(min-width: 640px) 33vw, 100vw" />
                <p className="u-eyebrow mt-6 text-accent-bright">{trainer.role}</p>
                <h3 className="mt-3 text-[length:var(--text-h4)]">{trainer.name}</h3>
                <p className="mt-3 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {trainer.bio}
                </p>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
