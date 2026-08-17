import Image from "next/image";

import { media, type MediaKey } from "@/config/media";
import { cn } from "@/lib/cn";

/**
 * Renders a photographic slot from the manifest.
 *
 * With a real file it is a plain `next/image` fill. Without one it draws a
 * placeholder that keeps the exact composition of the final layout — same
 * ratio, same reveal behaviour, same tonal weight — and names the shot that
 * belongs there. The page reads as designed rather than as broken, and the
 * brief travels with the design.
 */
export function Media({
  slot,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
  ratio,
  overlay = true,
}: {
  slot: MediaKey;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Override the manifest ratio when a layout needs a different crop. */
  ratio?: string;
  /** Scrim that keeps overlaid text legible. */
  overlay?: boolean;
}) {
  const item = media[slot];
  const aspect = ratio ?? item.ratio;

  return (
    <div
      className={cn(
        "c-image-reveal relative isolate w-full overflow-hidden bg-ink-raised",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {item.src ? (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <Placeholder brief={item.brief} />
      )}

      {overlay ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent"
        />
      ) : null}
    </div>
  );
}

function Placeholder({ brief }: { brief: string }) {
  return (
    <div
      data-reveal-target
      className="absolute inset-0 flex items-end"
      // A soft off-axis wash rather than a flat grey — reads as a tonal plate
      // in the composition instead of a missing asset.
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 25% 15%, color-mix(in oklab, var(--accent) 16%, transparent) 0%, transparent 62%), " +
          "linear-gradient(155deg, var(--color-ink-raised) 0%, var(--color-ink-sunken) 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 22px, color-mix(in oklab, var(--color-line) 55%, transparent) 22px 23px)",
        }}
      />
      <p className="relative z-10 m-5 max-w-[24ch] text-[0.6875rem] uppercase leading-relaxed tracking-[0.18em] text-mist-dim sm:m-7">
        <span className="mb-1.5 block text-accent-bright/70">Image pending</span>
        {brief}
      </p>
    </div>
  );
}
