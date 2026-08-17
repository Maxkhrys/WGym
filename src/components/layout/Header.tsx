"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LogoLockup } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { primaryNav } from "@/config/nav";
import { cn } from "@/lib/cn";

import { MobileNav } from "./MobileNav";

/**
 * The header starts transparent so the hero reads full-bleed, then condenses
 * into a floating dark bar once the user has moved past the first viewport.
 *
 * Scroll state is read in a rAF-throttled listener rather than on every scroll
 * event, and only writes when the boolean actually flips, so the common case
 * costs one comparison per frame and causes no React work at all.
 */
export function Header() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const ticking = useRef(false);

  useEffect(() => {
    function evaluate() {
      ticking.current = false;
      setCondensed((current) => {
        const next = window.scrollY > 64;
        return next === current ? current : next;
      });
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(evaluate);
    }

    // Evaluate the initial position on the next frame rather than inline: the
    // page may be restored mid-scroll on a back navigation, and deferring
    // keeps the first paint identical to the server's markup.
    const initial = requestAnimationFrame(evaluate);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // The drawer closes itself when one of its links is followed (see MobileNav),
  // so there is no route-change effect here to undo it afterwards.

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-[var(--ease-out-quint)]",
          condensed ? "pt-3 sm:pt-4" : "pt-0",
        )}
      >
        <div
          className={cn(
            "u-page transition-all duration-500 ease-[var(--ease-out-quint)]",
            condensed && "max-w-[76rem]",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-6 transition-all duration-500 ease-[var(--ease-out-quint)]",
              condensed
                ? "h-16 rounded-full border border-line-hi/70 bg-ink/85 px-4 backdrop-blur-xl sm:px-6"
                : "h-20 border border-transparent px-0 sm:h-24",
            )}
          >
            <Link
              href="/"
              aria-label="The W Gym & Sauna — home"
              className="shrink-0 rounded-lg transition-opacity duration-300 hover:opacity-80"
            >
              <LogoLockup compact={condensed} />
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 lg:flex"
            >
              {primaryNav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-[var(--text-body-sm)]",
                      "transition-colors duration-300",
                      active ? "text-bone" : "text-mist hover:text-bone",
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-3.5 -bottom-0.5 h-px bg-accent-bright"
                      />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              {/*
                Hidden on the wrapper, not on the buttons themselves. Button
                sets `inline-flex` in its base classes, and Tailwind resolves
                competing display utilities by their order in the generated
                stylesheet rather than in the class attribute — so a `hidden`
                passed via className loses to it, and the buttons would stay
                visible on mobile, squashed to their min-width and pushing the
                menu button off the screen.
              */}
              <div className="hidden items-center gap-2.5 sm:flex">
                <ButtonLink href="/sauna/book" variant="secondary" size="sm">
                  Book Sauna
                </ButtonLink>
                <ButtonLink href="/signup" variant="primary" size="sm">
                  Join Gym
                </ButtonLink>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                className="u-tap -mr-2 flex items-center justify-center rounded-full px-2 text-bone lg:hidden"
              >
                <span aria-hidden className="flex w-6 flex-col gap-[5px]">
                  <span className="h-px w-full bg-current" />
                  <span className="h-px w-full bg-current" />
                  <span className="h-px w-2/3 bg-current" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
