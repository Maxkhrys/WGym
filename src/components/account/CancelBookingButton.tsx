"use client";

import { useActionState, useRef, useState } from "react";

import { cancelBooking, type AccountActionState } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";
import { bookingPolicy } from "@/config/site";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

const initialState: AccountActionState = { status: "idle" };

/**
 * Cancellation with a confirmation dialog.
 *
 * Cancelling is irreversible and the slot is released immediately, so it is
 * never a single click. The dialog traps focus and closes on Escape; the
 * server re-checks ownership and the notice window regardless of what happens
 * here.
 */
/**
 * Rendered only when the booking is still cancellable — the window check lives
 * in the data layer so nothing here reads the clock during render. The server
 * action re-checks ownership and the window regardless.
 */
export function CancelBookingButton({
  bookingId,
  reference,
}: {
  bookingId: string;
  reference: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(cancelBooking, initialState);

  useFocusTrap(dialogRef, open, () => setOpen(false));

  if (state.status === "success") {
    return (
      <p role="status" className="text-[var(--text-body-sm)] text-positive">
        {state.message}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
          Cancel booking
        </Button>
        <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
          Free up to {bookingPolicy.freeCancellationHours} hours before.
        </p>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-[var(--text-body-sm)] text-danger">
          {state.message}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-sunken/80 backdrop-blur-sm"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-title-${bookingId}`}
            className="relative w-full max-w-md rounded-2xl border border-line bg-ink-raised p-7"
          >
            <h2
              id={`cancel-title-${bookingId}`}
              className="text-[length:var(--text-h4)]"
            >
              Cancel this booking?
            </h2>
            <p className="mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
              Booking <span className="u-tnum text-bone">{reference}</span> will
              be cancelled and the slot released for someone else. This cannot
              be undone.
            </p>

            <form action={formAction} className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
              <input type="hidden" name="bookingId" value={bookingId} />
              <Button type="submit" variant="danger" disabled={pending} fullWidth>
                {pending ? "Cancelling…" : "Yes, cancel it"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Keep booking
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
