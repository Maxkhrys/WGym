"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Confines Tab focus to `container` while `active`, restores focus to whatever
 * was focused before, and closes on Escape.
 *
 * Shared by the mobile drawer and every modal so the booking flow behaves the
 * same way for keyboard and screen-reader users wherever a dialog appears.
 */
export function useFocusTrap(
  container: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return;

    const element = container.current;
    if (!element) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus in on the next frame: the panel may still be mid-transition,
    // and focusing a `visibility: hidden` node is a no-op.
    const raf = requestAnimationFrame(() => {
      const first = element.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? element).focus({ preventScroll: true });
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onEscape?.();
        return;
      }

      if (event.key !== "Tab" || !element) return;

      const focusable = Array.from(
        element.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null || node === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === element)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active, container, onEscape]);
}
