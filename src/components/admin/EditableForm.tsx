"use client";

import { useActionState } from "react";

import type { AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Surface";

const initialState: AdminActionState = { status: "idle" };

type ServerAction = (
  previous: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

/**
 * Shared shell for the small admin edit forms.
 *
 * Each row is its own form so saving one plan cannot overwrite another, and
 * the pending/error/success feedback stays local to the row being edited.
 */
export function EditableForm({
  action,
  title,
  subtitle,
  children,
  submitLabel = "Save",
}: {
  action: ServerAction;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Panel className="p-5 sm:p-6">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <h3 className="text-[length:var(--text-body-lg)] font-medium text-bone">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-[var(--text-caption)] text-mist-dim">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>

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
      </form>
    </Panel>
  );
}

/** Compact labelled input for the admin grids. */
export function AdminField({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  min,
  max,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  step?: string;
  min?: number;
  max?: number;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[var(--text-caption)] uppercase tracking-[0.12em] text-mist-dim">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line-hi bg-ink px-3 py-2.5 text-[var(--text-body-sm)] text-bone focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      />
      {hint ? (
        <span className="text-[var(--text-micro)] text-mist-dim">{hint}</span>
      ) : null}
    </label>
  );
}

export function AdminToggle({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-line-hi bg-ink transition-colors checked:border-mint checked:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint bg-[length:12px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M2 6.2 4.6 8.8 10 3.4%22 fill=%22none%22 stroke=%22%2307090a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')]"
      />
      <span className="text-[var(--text-body-sm)] text-bone">{label}</span>
    </label>
  );
}
