"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Route-level error boundary.
 *
 * Shows nothing about what actually failed — a stack trace or database message
 * on a public page is an information leak. The digest is Next's own opaque
 * identifier, which is safe to display and lets us match a report to a server
 * log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-lg">
        <p className="u-eyebrow text-accent-bright">Something went wrong</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          We hit a problem
        </h1>
        <p className="mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
          Sorry about that. Try again — and if it keeps happening, get in touch
          and we will sort it out.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to home
          </ButtonLink>
        </div>

        {error.digest ? (
          <p className="u-tnum mt-10 border-t border-line pt-6 text-[var(--text-caption)] text-mist-dim">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
