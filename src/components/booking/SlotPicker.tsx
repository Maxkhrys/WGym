"use client";

import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/booking/availability";

/**
 * Large, thumb-sized time buttons. Availability is communicated by text as
 * well as colour ("2 left", "Full"), so the state does not depend on being
 * able to distinguish teal from amber.
 */
export function SlotPicker({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (startsAt: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading times"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-[4.5rem] animate-pulse rounded-2xl border border-line bg-ink-raised"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-hi px-5 py-8 text-center text-[var(--text-body-sm)] text-mist">
        No times available on this date. Try another day.
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Choose a time"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
    >
      {slots.map((slot) => {
        const isSelected = slot.startsAt === selected;
        const disabled = slot.state === "full";

        return (
          <button
            key={slot.startsAt}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            tabIndex={isSelected || (!selected && !disabled) ? 0 : -1}
            onClick={() => onSelect(slot.startsAt)}
            className={cn(
              "u-tap flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-3",
              "transition-colors duration-250",
              isSelected
                ? "border-mint bg-mint text-ink"
                : disabled
                  ? "cursor-not-allowed border-line bg-ink text-mist-dim/50"
                  : "border-line-hi bg-ink-raised text-bone hover:border-accent",
            )}
          >
            <span className="u-tnum text-[1.15rem] font-medium leading-none">
              {slot.label}
            </span>
            <span
              className={cn(
                "text-[var(--text-micro)] uppercase tracking-[0.1em]",
                isSelected
                  ? "text-ink/70"
                  : disabled
                    ? "text-mist-dim/60"
                    : slot.state === "limited"
                      ? "text-caution"
                      : "text-mist-dim",
              )}
            >
              {disabled
                ? "Full"
                : slot.state === "limited"
                  ? `${slot.remaining} left`
                  : "Available"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
