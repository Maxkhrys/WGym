import { cn } from "@/lib/cn";

/**
 * ── SWAP POINT ────────────────────────────────────────────────────────────
 * When the client supplies the real logo, drop the file into
 * `/public/brand/logo.svg` and replace the body of `LogoMark` with:
 *
 *   <Image src="/brand/logo.svg" alt="" width={40} height={40} priority />
 *
 * Nothing else needs to change — every surface consumes `LogoMark` /
 * `LogoLockup` rather than drawing the mark inline.
 *
 * Until then this is a neutral placeholder built from the same stacked-stone
 * idea as the existing logo: three balanced forms, cool blue-green, no
 * redesign of the brand implied.
 * ──────────────────────────────────────────────────────────────────────────
 */

export function LogoMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      {/* Stacked stones: broad base, balanced middle, poised cap. */}
      <ellipse cx="20" cy="31.5" rx="13" ry="5" fill="currentColor" opacity="0.9" />
      <ellipse cx="20" cy="21.5" rx="9.5" ry="4.2" fill="currentColor" opacity="0.62" />
      <ellipse cx="20" cy="13" rx="6" ry="3.1" fill="currentColor" opacity="0.4" />
      {/* The W notch, cut into the base stone. */}
      <path
        d="M13.4 30.2 16.6 34l3.4-2.8 3.4 2.8 3.2-3.8"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function LogoLockup({
  className,
  markClassName,
  compact = false,
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={cn("text-accent-bright", markClassName)} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-[-0.02em]",
            compact ? "text-[0.95rem]" : "text-[1.05rem]",
          )}
        >
          THE W
        </span>
        {!compact ? (
          <span className="mt-1 text-[0.58rem] uppercase tracking-[0.28em] text-mist-dim">
            Gym &amp; Sauna
          </span>
        ) : null}
      </span>
    </span>
  );
}
