import { Badge, Panel } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { formatDateLong, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { BookingWithService } from "@/lib/queries/account";
import type { BookingStatus } from "@/generated/prisma/enums";

import { CancelBookingButton } from "./CancelBookingButton";

const STATUS: Record<
  BookingStatus,
  { label: string; tone: "positive" | "caution" | "danger" | "neutral" | "accent" }
> = {
  CONFIRMED: { label: "Confirmed", tone: "positive" },
  PENDING: { label: "Awaiting payment", tone: "caution" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  COMPLETED: { label: "Attended", tone: "accent" },
  NO_SHOW: { label: "Missed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export function BookingCard({
  booking,
  showCancel = true,
  className,
}: {
  booking: BookingWithService;
  showCancel?: boolean;
  className?: string;
}) {
  const status = STATUS[booking.status];
  // `canCancel` is resolved in the data layer against a single `now` — see
  // decorateBookings — so nothing here reads the clock during render.
  const cancellable = showCancel && booking.canCancel;

  return (
    <Panel
      className={cn(
        "p-5 sm:p-6",
        booking.status === "CANCELLED" && "opacity-60",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[length:var(--text-body-lg)] font-medium text-bone">
            {booking.service.name}
          </h3>
          <p className="u-tnum mt-2 text-[var(--text-body-sm)] text-mist">
            {formatDateLong(booking.startsAt)}
          </p>
          <p className="u-tnum mt-1 text-[var(--text-body-sm)] text-mist">
            {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)} ·{" "}
            {formatDuration(booking.service.durationMinutes)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="u-tnum text-[var(--text-body-sm)] text-mist">
            {formatPrice(booking.amountCents, booking.currency)}
          </span>
        </div>
      </div>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4">
        <div className="flex gap-2">
          <dt className="text-[var(--text-caption)] text-mist-dim">Reference</dt>
          <dd className="u-tnum text-[var(--text-caption)] text-mist">
            {booking.reference}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[var(--text-caption)] text-mist-dim">Guests</dt>
          <dd className="u-tnum text-[var(--text-caption)] text-mist">
            {booking.guestCount}
          </dd>
        </div>
      </dl>

      {cancellable ? (
        <div className="mt-5">
          <CancelBookingButton
            bookingId={booking.id}
            reference={booking.reference}
          />
        </div>
      ) : null}
    </Panel>
  );
}
