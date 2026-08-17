"use client";

import { useActionState } from "react";

import type { AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { status: "idle" };

type ServerAction = (
  previous: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

export function RemoveBlockButton({
  blockId,
  action,
}: {
  blockId: string;
  action: ServerAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="blockId" value={blockId} />
      <button
        type="submit"
        disabled={pending}
        className="u-tap rounded-full border border-line-hi px-3.5 text-[var(--text-caption)] text-mist transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.status === "error" ? (
        <span role="alert" className="ml-3 text-[var(--text-caption)] text-danger">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
