"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { LogoLockup } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { primaryNav } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { cn } from "@/lib/cn";

/**
 * Full-screen navigation drawer.
 *
 * It stays mounted so the panel can transition out, but is fully inert while
 * closed — `hidden` removes it from the accessibility tree and the tab order,
 * which is what stops the classic "tabbing into an invisible menu" bug.
 */
export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);

  // Lock the page behind the drawer without the iOS "jump to top" that
  // `position: fixed` on body causes.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] lg:hidden",
        !open && "pointer-events-none",
      )}
      hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-sunken/80 backdrop-blur-sm transition-opacity duration-400",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col",
          "border-l border-line bg-ink transition-transform duration-500 ease-[var(--ease-out-expo)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-20 shrink-0 items-center justify-between px-[var(--spacing-gutter)]">
          <LogoLockup compact />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="u-tap -mr-2 flex items-center justify-center rounded-full px-2 text-mist transition-colors hover:text-bone"
          >
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m4.5 4.5 11 11M15.5 4.5l-11 11" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav
          aria-label="Primary"
          className="flex-1 overflow-y-auto overscroll-contain px-[var(--spacing-gutter)] pb-8 pt-4"
        >
          <ul className="flex flex-col">
            {primaryNav.map((item, index) => (
              <li key={item.href} className="border-b border-line last:border-b-0">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-baseline justify-between gap-4 py-5 transition-colors"
                  style={{
                    transitionDelay: open ? `${120 + index * 45}ms` : "0ms",
                  }}
                >
                  <span className="flex flex-col gap-1.5">
                    <span className="font-[family-name:var(--font-display)] text-[length:var(--text-h4)] tracking-[-0.02em] text-bone transition-colors group-hover:text-accent-bright">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="text-[var(--text-caption)] text-mist-dim">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-mist-dim transition-transform duration-400 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" strokeLinecap="square" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line px-[var(--spacing-gutter)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          <div className="flex flex-col gap-3">
            <ButtonLink href="/signup" variant="primary" size="lg" fullWidth>
              Join The Gym
            </ButtonLink>
            <ButtonLink href="/sauna/book" variant="secondary" size="lg" fullWidth>
              Book Sauna
            </ButtonLink>
          </div>
          <p className="mt-6 text-[var(--text-caption)] leading-relaxed text-mist-dim">
            {siteConfig.address.venue}, {siteConfig.address.postalCode}
            <br />
            <Link
              href="/account"
              className="mt-2 inline-block text-mist underline underline-offset-4 transition-colors hover:text-bone"
            >
              Member sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
