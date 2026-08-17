"use client";

import { useActionState } from "react";

import { updateBookingStatus, type AdminActionState } from "@/app/admin/actions";
import { Badge, Panel } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { formatDateShort, formatPrice, formatTime } from "@/lib/format";
import type { BookingStatus } from "@/generated/prisma/enums";

const STATUS: Record<
  BookingStatus,
  { label: string; tone: "positive" | "caution" | "danger" | "neutral" | "accent" }
> = {
  CONFIRMED: { label: "Confirmed", tone: "positive" },
  PENDING: { label: "Pending", tone: "caution" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  COMPLETED: { label: "Attended", tone: "accent" },
  NO_SHOW: { label: "No show", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

type Booking = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  startsAt: Date;
  endsAt: Date;
  guestCount: number;
  amountCents: number;
  currency: string;
  status: BookingStatus;
  service: { name: string };
};

const initialState: AdminActionState = { status: "idle" };

export function BookingRow({
  booking,
  showActions = false,
  showDate = false,
}: {
  booking: Booking;
  showActions?: boolean;
  showDate?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookingStatus,
    initialState,
  );

  const status = STATUS[booking.status];
  const settled =
    booking.status === "COMPLETED" ||
    booking.status === "NO_SHOW" ||
    booking.status === "CANCELLED" ||
    booking.status === "REFUNDED";

  return (
    <Panel className={cn("p-4 sm:p-5", settled && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="u-tnum text-[length:var(--text-body-lg)] font-medium text-bone">
              {formatTime(booking.startsAt)}
            </span>
            <span className="u-tnum text-[var(--text-caption)] text-mist-dim">
              – {formatTime(booking.endsAt)}
            </span>
            {showDate ? (
              <span className="text-[var(--text-caption)] text-mist-dim">
                {formatDateShort(booking.startsAt)}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-[var(--text-body-sm)] text-bone">
            {booking.service.name}
          </p>

          <p className="mt-1 truncate text-[var(--text-caption)] text-mist">
            {booking.customerName} · {booking.guestCount} guest
            {booking.guestCount === 1 ? "" : "s"} ·{" "}
            <span className="u-tnum">{booking.reference}</span>
          </p>

          <p className="mt-1 truncate text-[var(--text-caption)] text-mist-dim">
            <a
              href={`mailto:${booking.customerEmail}`}
              className="underline-offset-4 hover:underline"
            >
              {booking.customerEmail}
            </a>
            {booking.customerPhone ? (
              <>
                {" · "}
                <a
                  href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}
                  className="underline-offset-4 hover:underline"
                >
                  {booking.customerPhone}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="u-tnum text-[var(--text-caption)] text-mist">
            {formatPrice(booking.amountCents, booking.currency)}
          </span>
        </div>
      </div>

      {showActions && !settled ? (
        <form
          action={formAction}
          className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4"
        >
          <input type="hidden" name="bookingId" value={booking.id} />

          {booking.status === "PENDING" ? (
            <ActionButton name="action" value="confirm" disabled={pending}>
              Confirm
            </ActionButton>
          ) : null}
          <ActionButton name="action" value="attended" disabled={pending}>
            Mark attended
          </ActionButton>
          <ActionButton name="action" value="no_show" disabled={pending}>
            No show
          </ActionButton>
          <ActionButton
            name="action"
            value="cancel"
            disabled={pending}
            tone="danger"
          >
            Cancel
          </ActionButton>
        </form>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-[var(--text-caption)] text-danger">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" className="mt-3 text-[var(--text-caption)] text-positive">
          {state.message}
        </p>
      ) : null}
    </Panel>
  );
}

function ActionButton({
  children,
  tone = "neutral",
  ...rest
}: React.ComponentPropsWithoutRef<"button"> & { tone?: "neutral" | "danger" }) {
  return (
    <button
      type="submit"
      className={cn(
        "u-tap rounded-full border px-3.5 text-[var(--text-caption)] transition-colors duration-200 disabled:opacity-40",
        tone === "danger"
          ? "border-danger/40 text-danger hover:bg-danger hover:text-bone"
          : "border-line-hi text-mist hover:border-accent hover:text-bone",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
