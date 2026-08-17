"use client";

import { useActionState } from "react";

import {
  updateMembershipStatus,
  type AdminActionState,
} from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import type { MembershipStatus } from "@/generated/prisma/enums";

const initialState: AdminActionState = { status: "idle" };

export function MembershipActions({
  membershipId,
  status,
  hasStripeSubscription,
}: {
  membershipId: string;
  status: MembershipStatus;
  hasStripeSubscription: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateMembershipStatus,
    initialState,
  );

  const cancellable = status === "ACTIVE" || status === "PAST_DUE";

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="membershipId" value={membershipId} />

        {cancellable ? (
          <button
            type="submit"
            name="action"
            value="cancel"
            disabled={pending}
            className={cn(
              "u-tap rounded-full border border-danger/40 px-3.5 text-[var(--text-caption)] text-danger",
              "transition-colors hover:bg-danger hover:text-bone disabled:opacity-40",
            )}
          >
            Cancel membership
          </button>
        ) : (
          <button
            type="submit"
            name="action"
            value="reactivate"
            disabled={pending}
            className="u-tap rounded-full border border-line-hi px-3.5 text-[var(--text-caption)] text-mist transition-colors hover:border-accent hover:text-bone disabled:opacity-40"
          >
            Reactivate
          </button>
        )}
      </form>

      {/*
        Cancelling here only changes our record. If Stripe holds a live
        subscription it keeps billing until it is cancelled there too — said
        plainly rather than hidden, because getting it wrong charges a member
        who thinks they have left.
      */}
      {cancellable && hasStripeSubscription ? (
        <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
          This membership has a live Stripe subscription. Cancelling here does
          not stop billing — cancel it in Stripe as well.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="text-[var(--text-caption)] text-danger">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" className="text-[var(--text-caption)] text-positive">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
