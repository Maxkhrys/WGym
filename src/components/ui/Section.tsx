import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { PolymorphicTag } from "@/lib/polymorphic";
import { Reveal } from "@/components/ui/Reveal";

/** Page-width wrapper. Everything that isn't full-bleed sits inside one. */
export function Container({
  className,
  as = "div",
  ...rest
}: ComponentPropsWithoutRef<"div"> & { as?: ElementType }) {
  const Tag = as as PolymorphicTag;
  return <Tag className={cn("u-page", className)} {...rest} />;
}

type Tone = "cool" | "warm" | "dusk" | "none";

const toneAttr: Record<Tone, string | undefined> = {
  cool: undefined,
  warm: "warm",
  dusk: "dusk",
  none: undefined,
};

/**
 * Vertical rhythm unit. `tone` re-points the accent tokens for everything
 * inside, which is how the page travels from the gym's cool teal to the
 * sauna's warmth without any component knowing about the change.
 */
export function Section({
  children,
  className,
  tone = "cool",
  size = "md",
  as = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "none";
  as?: ElementType;
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">) {
  const Tag = as as PolymorphicTag;
  const padding = {
    none: "",
    sm: "py-16 sm:py-20",
    md: "py-24 sm:py-32 lg:py-40",
    lg: "py-32 sm:py-44 lg:py-56",
  }[size];

  return (
    <Tag
      data-tone={toneAttr[tone]}
      className={cn("relative", padding, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Small uppercase label with a leading rule. Used to number and name sections
 * in the editorial layout.
 */
export function Eyebrow({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {index ? (
        <span className="u-eyebrow u-tnum text-accent-bright">{index}</span>
      ) : null}
      <span aria-hidden className="h-px w-8 bg-line-hi sm:w-12" />
      <span className="u-eyebrow">{children}</span>
    </div>
  );
}

/**
 * The standard section opening: eyebrow, oversized heading, optional lead
 * paragraph. Asymmetric by default — the lead sits in the right column on
 * desktop rather than centred under the heading.
 */
export function SectionHeader({
  eyebrow,
  eyebrowIndex,
  title,
  lead,
  action,
  align = "split",
  className,
  headingLevel = "h2",
}: {
  eyebrow?: string;
  eyebrowIndex?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  align?: "split" | "stack";
  className?: string;
  headingLevel?: ElementType;
}) {
  const Heading = headingLevel as PolymorphicTag;

  if (align === "stack") {
    return (
      <div className={cn("max-w-4xl", className)}>
        {eyebrow ? (
          <Reveal>
            <Eyebrow index={eyebrowIndex}>{eyebrow}</Eyebrow>
          </Reveal>
        ) : null}
        <Reveal delay={80}>
          <Heading className="mt-7 text-[length:var(--text-h2)]">{title}</Heading>
        </Reveal>
        {lead ? (
          <Reveal delay={160}>
            <p className="u-measure mt-7 text-[length:var(--text-body-lg)] text-mist">
              {lead}
            </p>
          </Reveal>
        ) : null}
        {action ? <Reveal delay={220} className="mt-10">{action}</Reveal> : null}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-x-16 gap-y-8 lg:grid-cols-12", className)}>
      <div className="lg:col-span-7">
        {eyebrow ? (
          <Reveal>
            <Eyebrow index={eyebrowIndex}>{eyebrow}</Eyebrow>
          </Reveal>
        ) : null}
        <Reveal delay={80}>
          <Heading className="mt-7 text-[length:var(--text-h2)]">{title}</Heading>
        </Reveal>
      </div>
      {lead || action ? (
        <div className="flex flex-col justify-end lg:col-span-5 lg:pb-2">
          {lead ? (
            <Reveal delay={160}>
              <p className="u-measure text-[length:var(--text-body-lg)] text-mist">
                {lead}
              </p>
            </Reveal>
          ) : null}
          {action ? <Reveal delay={220} className="mt-8">{action}</Reveal> : null}
        </div>
      ) : null}
    </div>
  );
}
