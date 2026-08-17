import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Panel used for cards, dashboard tiles and form containers. */
export function Panel({
  className,
  interactive = false,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-line bg-ink-raised",
        interactive &&
          "transition-colors duration-300 ease-[var(--ease-out-quint)] hover:border-line-hi",
        className,
      )}
      {...rest}
    />
  );
}

const badgeTones = {
  neutral: "border-line-hi text-mist",
  accent: "border-accent/45 text-accent-bright",
  positive: "border-positive/45 text-positive",
  caution: "border-caution/45 text-caution",
  danger: "border-danger/45 text-danger",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        "text-[var(--text-micro)] font-medium uppercase tracking-[0.14em]",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Marks a region whose content is not yet real. Visible in the UI on purpose:
 * the client should be able to see at a glance what still needs supplying,
 * and nothing invented can be mistaken for live data.
 */
export function PlaceholderNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-dashed border-line-hi",
        "bg-surface/40 px-4 py-3 text-[var(--text-caption)] leading-relaxed text-mist-dim",
        className,
      )}
    >
      <span aria-hidden className="mt-px text-accent-bright">
        ◇
      </span>
      {children}
    </p>
  );
}

/** Thin rule used to separate editorial blocks. */
export function Rule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-px w-full bg-line", className)} />;
}

/** Key/value row used in specs, hours tables and booking summaries. */
export function DataRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 border-b border-line py-3.5 last:border-b-0",
        className,
      )}
    >
      <dt className="text-[var(--text-body-sm)] text-mist">{label}</dt>
      <dd className="u-tnum text-right text-[var(--text-body-sm)] font-medium text-bone">
        {value}
      </dd>
    </div>
  );
}
