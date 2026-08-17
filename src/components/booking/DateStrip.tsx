"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import type { DayAvailability } from "@/lib/booking/availability";

/**
 * Horizontal date selector.
 *
 * This is the mobile-first half of the calendar: a scrollable rail of large
 * day buttons rather than a month grid squeezed onto a phone. It stays a rail
 * on desktop too, widened rather than replaced, so there is one interaction
 * model to learn and one set of code to keep correct.
 *
 * Keyboard: the rail is a radiogroup, so arrow keys move between dates and
 * only the selected day is a tab stop — the standard roving-tabindex pattern,
 * which is what makes the whole flow usable without a pointer.
 */
export function DateStrip({
  days,
  selected,
  onSelect,
  loading,
}: {
  days: DayAvailability[];
  selected: string | null;
  onSelect: (date: string) => void;
  loading?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the selected day in view when it changes from outside (e.g. the
  // service changed and the first open day was auto-picked).
  useEffect(() => {
    if (!selected) return;
    const node = railRef.current?.querySelector<HTMLElement>(
      `[data-date="${selected}"]`,
    );
    node?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selected]);

  function onKeyDown(event: React.KeyboardEvent) {
    const selectable = days.filter((day) => day.open);
    if (selectable.length === 0) return;

    const currentIndex = selectable.findIndex((day) => day.date === selected);

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = currentIndex + 1;
    if (event.key === "ArrowLeft") nextIndex = currentIndex - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = selectable.length - 1;

    if (nextIndex === null) return;
    if (nextIndex < 0 || nextIndex >= selectable.length) return;

    event.preventDefault();
    onSelect(selectable[nextIndex].date);
  }

  return (
    <div
      ref={railRef}
      role="radiogroup"
      aria-label="Choose a date"
      aria-busy={loading}
      onKeyDown={onKeyDown}
      className="u-rail u-no-scrollbar u-bleed gap-2.5 py-1"
    >
      {days.map((day) => {
        const isSelected = day.date === selected;
        const parts = formatDayParts(day.date);

        return (
          <button
            key={day.date}
            type="button"
            role="radio"
            data-date={day.date}
            aria-checked={isSelected}
            aria-label={`${parts.full}${day.open ? "" : ", unavailable"}`}
            disabled={!day.open}
            // Roving tabindex: one stop for the whole group.
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(day.date)}
            className={cn(
              "u-tap flex w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-3.5",
              "transition-colors duration-250 sm:w-[5.25rem]",
              isSelected
                ? "border-mint bg-mint text-ink"
                : day.open
                  ? "border-line-hi bg-ink-raised text-bone hover:border-accent"
                  : "cursor-not-allowed border-line bg-ink text-mist-dim/50",
            )}
          >
            <span
              className={cn(
                "text-[var(--text-micro)] uppercase tracking-[0.14em]",
                isSelected ? "text-ink/70" : "text-mist-dim",
              )}
            >
              {parts.weekday}
            </span>
            <span className="u-tnum text-[1.35rem] font-medium leading-none">
              {parts.day}
            </span>
            <span
              className={cn(
                "text-[var(--text-micro)]",
                isSelected ? "text-ink/70" : "text-mist-dim",
              )}
            >
              {parts.month}
            </span>

            <span aria-hidden className="mt-1 h-1.5">
              {day.open ? (
                <span
                  className={cn(
                    "block h-1.5 w-1.5 rounded-full",
                    isSelected
                      ? "bg-ink/50"
                      : day.bestRemaining <= 2
                        ? "bg-caution"
                        : "bg-accent-bright",
                  )}
                />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function formatDayParts(dateKey: string) {
  // Parse as a plain calendar date. Noon UTC keeps the date stable regardless
  // of the viewer's own timezone, since the label describes a Dublin day.
  const date = new Date(`${dateKey}T12:00:00Z`);

  return {
    weekday: new Intl.DateTimeFormat("en-IE", { weekday: "short" })
      .format(date)
      .toUpperCase(),
    day: new Intl.DateTimeFormat("en-IE", { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat("en-IE", { month: "short" }).format(date),
    full: new Intl.DateTimeFormat("en-IE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
  };
}
