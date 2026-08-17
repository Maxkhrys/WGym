import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "u-tap relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap " +
  "font-medium tracking-tight transition-[background-color,border-color,color,opacity] " +
  "duration-300 ease-[var(--ease-out-quint)] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  // Solid pale mint on charcoal. Deliberately not a glowing brand-colour slab —
  // the contrast does the work.
  primary:
    "bg-mint text-ink hover:bg-bone active:bg-mint-dim border border-transparent",
  secondary:
    "border border-line-hi text-bone hover:border-accent hover:text-accent-bright bg-transparent",
  ghost:
    "border border-transparent text-bone/85 hover:text-bone hover:bg-surface bg-transparent",
  quiet: "text-mist hover:text-bone bg-transparent border border-transparent",
  danger:
    "border border-danger/40 text-danger hover:bg-danger hover:text-bone bg-transparent",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-[var(--text-body-sm)] rounded-full",
  md: "h-12 px-6 text-[var(--text-body-sm)] rounded-full",
  lg: "h-14 px-8 text-[var(--text-body)] rounded-full",
};

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor(variant, size, fullWidth, className)}
      {...rest}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classesFor(variant, size, fullWidth, className)} {...rest} />
  );
}

/**
 * Underlined text link with a rule that wipes in from the left on hover.
 * Used for the "Explore Gym" style calls to action inside editorial sections.
 */
export function ArrowLink({
  href,
  children,
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        // min-h-11 (44px) rather than the text's natural ~34px: this is a
        // standalone call to action, not an inline link inside a sentence, so
        // it needs a comfortable touch target.
        "group inline-flex min-h-11 items-center gap-3 text-[var(--text-body-sm)] font-medium",
        "uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:text-accent-bright",
        className,
      )}
      {...rest}
    >
      <span className="relative py-1">
        {children}
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-100 bg-current opacity-30 transition-opacity duration-300 group-hover:opacity-100"
        />
      </span>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" strokeLinecap="square" />
      </svg>
    </Link>
  );
}
