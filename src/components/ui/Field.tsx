"use client";

import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const controlClasses =
  "w-full rounded-xl border border-line-hi bg-ink-raised px-4 py-3.5 text-bone " +
  "placeholder:text-mist-dim/70 transition-colors duration-200 " +
  "hover:border-line-hi focus:border-accent focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint " +
  "disabled:opacity-50 aria-[invalid=true]:border-danger";

/**
 * Wraps a control with its label, hint and error. The error is wired through
 * `aria-describedby` and announced politely, so a failed submit is
 * understandable without sight of the red border.
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between gap-3 text-[var(--text-body-sm)] font-medium text-bone"
      >
        <span>
          {label}
          {required ? (
            <span aria-hidden className="ml-1 text-accent-bright">
              *
            </span>
          ) : null}
        </span>
        {optional ? (
          <span className="text-[var(--text-caption)] font-normal text-mist-dim">
            Optional
          </span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-[var(--text-caption)] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  error,
  required,
  optional,
  className,
  wrapperClassName,
  id,
  ...rest
}: ComponentPropsWithoutRef<"input"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <Field
      label={label}
      hint={hint ? <span id={`${inputId}-hint`}>{hint}</span> : undefined}
      error={error}
      required={required}
      optional={optional}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id,
  ...rest
}: ComponentPropsWithoutRef<"textarea"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      htmlFor={inputId}
    >
      <textarea
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        rows={4}
        className={cn(controlClasses, "resize-y", className)}
        {...rest}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id,
  children,
  ...rest
}: ComponentPropsWithoutRef<"select"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      htmlFor={inputId}
    >
      <select
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, "appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}

/**
 * Checkbox with the label as a real target. Used for terms acceptance and, as
 * a separate unbundled control, marketing consent.
 */
export function Checkbox({
  label,
  description,
  error,
  className,
  id,
  ...rest
}: ComponentPropsWithoutRef<"input"> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start gap-3.5">
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[5px]",
            "border border-line-hi bg-ink-raised transition-colors duration-200",
            "checked:border-mint checked:bg-mint",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
            "bg-[length:12px] bg-center bg-no-repeat",
            "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M2 6.2 4.6 8.8 10 3.4%22 fill=%22none%22 stroke=%22%2307090a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')]",
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer text-[var(--text-body-sm)] leading-relaxed text-bone"
        >
          {label}
          {description ? (
            <span className="mt-1 block text-[var(--text-caption)] leading-relaxed text-mist-dim">
              {description}
            </span>
          ) : null}
        </label>
      </div>
      {error ? (
        <p role="alert" className="pl-8.5 text-[var(--text-caption)] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
