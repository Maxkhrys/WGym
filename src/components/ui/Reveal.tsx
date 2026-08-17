"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { PolymorphicTag } from "@/lib/polymorphic";

/**
 * A single shared IntersectionObserver drives every scroll reveal on the page.
 * Registering one observer instance rather than one-per-component keeps the
 * cost flat no matter how many sections are on screen, which matters on the
 * long marketing pages.
 */
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(element: Element, onEnter: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    onEnter();
    return () => {};
  }

  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        sharedObserver?.unobserve(entry.target);
        callbacks.delete(entry.target);
      }
    },
    // Fire slightly before the element is fully in view so the motion has
    // finished by the time the reader's eye arrives.
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );

  callbacks.set(element, onEnter);
  sharedObserver.observe(element);

  return () => {
    sharedObserver?.unobserve(element);
    callbacks.delete(element);
  };
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Milliseconds to stagger this element behind its neighbours. */
  delay?: number;
  /** Vertical travel distance. `0` gives a pure fade. */
  distance?: string;
  duration?: number;
} & Record<string, unknown>;

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  distance,
  duration,
  ...rest
}: RevealProps) {
  const Tag = as as PolymorphicTag;
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "in">("idle");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Reduced motion is handled entirely in CSS: the media query in
    // globals.css renders `[data-reveal="idle"]` fully visible and untransformed,
    // so there is nothing to check here and no state to force.
    return observe(element, () => setState("in"));
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      className={className}
      style={{
        ...(delay ? { "--reveal-delay": `${delay}ms` } : {}),
        ...(distance ? { "--reveal-y": distance } : {}),
        ...(duration ? { "--reveal-duration": `${duration}ms` } : {}),
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Splits a headline into masked lines that rise into place. Lines are supplied
 * explicitly rather than measured at runtime — that keeps the break points
 * art-directed per breakpoint instead of wherever the browser happens to wrap.
 */
export function MaskedLines({
  lines,
  as = "h2",
  className,
  lineClassName,
  stagger = 90,
  startDelay = 0,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  stagger?: number;
  startDelay?: number;
}) {
  const Tag = as as PolymorphicTag;
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "in">("idle");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return observe(element, () => setState("in"));
  }, []);

  return (
    <Tag ref={ref} data-reveal={state} className={cn(className)}>
      {lines.map((line, index) => (
        <span key={index} className={cn("c-mask-line", lineClassName)}>
          <span
            style={{
              ["--reveal-delay" as string]: `${startDelay + index * stagger}ms`,
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
