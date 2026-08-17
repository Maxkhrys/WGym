import { BUSINESS_TIMEZONE, WEEKDAY_ORDER, type DayHours, type Weekday } from "@/config/site";
import { cn } from "@/lib/cn";

const LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * Today is highlighted using the business timezone rather than the visitor's,
 * so someone checking from another country still sees the day the club is
 * actually in.
 */
function todayInDublin(): Weekday {
  const name = new Intl.DateTimeFormat("en-IE", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "long",
  })
    .format(new Date())
    .toLowerCase();

  return (WEEKDAY_ORDER.find((day) => day === name) ?? "monday") as Weekday;
}

export function OpeningHoursTable({
  hours,
  className,
}: {
  hours: Record<Weekday, DayHours>;
  className?: string;
}) {
  const today = todayInDublin();

  return (
    <dl className={cn("flex flex-col", className)}>
      {WEEKDAY_ORDER.map((day) => {
        const entry = hours[day];
        const isToday = day === today;

        return (
          <div
            key={day}
            className={cn(
              "flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-b-0",
              isToday && "text-bone",
            )}
          >
            <dt
              className={cn(
                "text-[var(--text-body-sm)]",
                isToday ? "font-medium text-bone" : "text-mist",
              )}
            >
              {LABELS[day]}
              {isToday ? (
                <span className="ml-2.5 text-[var(--text-micro)] uppercase tracking-[0.16em] text-accent-bright">
                  Today
                </span>
              ) : null}
            </dt>
            <dd
              className={cn(
                "u-tnum text-[var(--text-body-sm)]",
                entry === null
                  ? "text-mist-dim"
                  : isToday
                    ? "font-medium text-bone"
                    : "text-mist",
              )}
            >
              {entry === null ? "Closed" : `${entry.open} — ${entry.close}`}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
