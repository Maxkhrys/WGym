"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { MOBILE_CTA_ROUTES } from "@/config/nav";
import { cn } from "@/lib/cn";

/**
 * Thumb-reachable CTA pair for conversion pages on mobile.
 *
 * It is deliberately not always-on. It appears only once the visitor has read
 * past the hero (where the same two CTAs already sit), and it retracts while
 * they scroll up — the assumption being they are heading back to the nav, not
 * to a button. It also hides near the footer so it never covers the legal
 * links, and the page reserves matching bottom padding so it can't obscure
 * content.
 */
export function MobileActionBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const enabled = MOBILE_CTA_ROUTES.includes(pathname);

  useEffect(() => {
    // Nothing to observe on pages without the bar; the component also returns
    // null below, so no state needs resetting here.
    if (!enabled) return;

    function evaluate() {
      ticking.current = false;

      const y = window.scrollY;
      const viewport = window.innerHeight;
      const scrolledPastHero = y > viewport * 0.85;
      const nearBottom =
        y + viewport > document.documentElement.scrollHeight - viewport * 0.6;
      const scrollingUp = y < lastY.current - 4;

      lastY.current = y;
      setVisible(scrolledPastHero && !nearBottom && !scrollingUp);
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(evaluate);
    }

    lastY.current = window.scrollY;
    const initial = requestAnimationFrame(evaluate);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <div
      // Hidden from assistive tech when off-screen: these CTAs are duplicates
      // of links already in the page, so announcing them twice adds noise.
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "border-t border-line-hi/70 bg-ink/90 backdrop-blur-xl",
        "px-[var(--spacing-gutter)] pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5",
        "transition-transform duration-500 ease-[var(--ease-out-quint)]",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex gap-3">
        <ButtonLink
          href="/sauna/book"
          variant="secondary"
          size="md"
          fullWidth
          tabIndex={visible ? undefined : -1}
        >
          Book Sauna
        </ButtonLink>
        <ButtonLink
          href="/signup"
          variant="primary"
          size="md"
          fullWidth
          tabIndex={visible ? undefined : -1}
        >
          Join Gym
        </ButtonLink>
      </div>
    </div>
  );
}
