import type { ReactNode } from "react";

import { Media } from "@/components/ui/Media";
import type { MediaKey } from "@/config/media";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Interior page hero. Shorter than the homepage's full viewport so the reader
 * lands with content already visible, and it uses a photographic plate rather
 * than WebGL — the scene is reserved for the homepage so Three.js never loads
 * on these routes.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  slot,
  tone = "cool",
  primary,
  secondary,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  slot: MediaKey;
  tone?: "cool" | "warm";
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}) {
  return (
    <section
      data-tone={tone === "warm" ? "warm" : undefined}
      className={cn(
        "u-grain relative isolate flex min-h-[78svh] flex-col justify-end overflow-hidden bg-ink pb-16 pt-36 sm:min-h-[82svh] sm:pb-20 lg:pb-24 lg:pt-44",
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <Media
          slot={slot}
          ratio="16/9"
          sizes="100vw"
          priority
          overlay={false}
          className="h-full w-full"
          imageClassName="object-cover"
        />
        <div
          className={cn(
            "absolute inset-0",
            tone === "warm"
              ? "bg-[linear-gradient(180deg,rgba(7,9,10,0.72)_0%,rgba(25,16,16,0.6)_45%,rgba(7,9,10,0.94)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(7,9,10,0.72)_0%,rgba(14,26,26,0.55)_45%,rgba(7,9,10,0.94)_100%)]",
          )}
        />
      </div>

      <div className="u-page">
        <p className="u-eyebrow c-fade-up">{eyebrow}</p>

        <h1
          className="c-fade-up mt-7 max-w-[16ch] text-[length:var(--text-h1)] leading-[0.9]"
          style={{ ["--reveal-delay" as string]: "80ms" }}
        >
          {title}
        </h1>

        {lead ? (
          <p
            className="c-fade-up u-measure mt-8 text-[length:var(--text-lead)] leading-[1.45] text-mist"
            style={{ ["--reveal-delay" as string]: "180ms" }}
          >
            {lead}
          </p>
        ) : null}

        {primary || secondary ? (
          <div
            className="c-fade-up mt-11 flex flex-col gap-3 sm:flex-row"
            style={{ ["--reveal-delay" as string]: "260ms" }}
          >
            {primary ? (
              <ButtonLink href={primary.href} variant="primary" size="lg">
                {primary.label}
              </ButtonLink>
            ) : null}
            {secondary ? (
              <ButtonLink href={secondary.href} variant="secondary" size="lg">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
