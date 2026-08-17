"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { useSceneCapability } from "@/lib/hooks/useSceneCapability";

// Three.js only ever reaches the network on machines that pass the capability
// gate — the import lives inside a component that is not rendered otherwise.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export function HomeHero() {
  const capable = useSceneCapability();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const [active, setActive] = useState(true);

  // Scroll progress through the first viewport, written to a ref so the WebGL
  // frame loop can read it without re-rendering React on every scroll event.
  useEffect(() => {
    let ticking = false;

    function evaluate() {
      ticking = false;
      const viewport = window.innerHeight || 1;
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / viewport));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    }

    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pause the render loop once the hero is fully behind the reader.
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="u-grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        {capable ? (
          <HeroScene scrollRef={scrollRef} active={active} />
        ) : (
          <StaticHeroBackdrop />
        )}
      </div>

      {/* Scrim: keeps the headline legible over either backdrop without
          washing the scene out. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_20%,transparent_0%,rgba(7,9,10,0.55)_55%,rgba(7,9,10,0.92)_100%)]"
      />

      <div className="u-page relative flex flex-1 flex-col justify-end pb-16 pt-32 sm:pb-20 lg:pb-24">
        {/*
          No `ch`-based max-width on this wrapper: `ch` resolves against the
          element's own font size, so a value set on a plain div is measured in
          16px body text and would crush the 98px headline into a narrow column,
          breaking words mid-glyph. Each line is its own block anyway, so the
          headline needs no width constraint at all.
        */}
        <div>
          <h1 className="text-[length:var(--text-mega)] font-medium leading-[0.86] tracking-[-0.045em]">
            <HeroLine delay={120}>Train.</HeroLine>
            <HeroLine delay={220}>Recover.</HeroLine>
            <HeroLine delay={320} className="text-accent-bright">
              Reset.
            </HeroLine>
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-9 lg:mt-14 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <p
            className="c-fade-up u-measure text-[length:var(--text-lead)] leading-[1.45] text-mist"
            style={{ ["--reveal-delay" as string]: "620ms" }}
          >
            A modern gym and recovery space built around stronger training,
            better recovery and a better community.
          </p>

          <div
            className="c-fade-up flex shrink-0 flex-col gap-3 sm:flex-row"
            style={{ ["--reveal-delay" as string]: "760ms" }}
          >
            <ButtonLink href="/signup" variant="primary" size="lg">
              Join The Gym
            </ButtonLink>
            <ButtonLink href="/sauna/book" variant="secondary" size="lg">
              Book Sauna
            </ButtonLink>
          </div>
        </div>

        <div
          className="c-fade-up mt-14 flex items-center gap-4 border-t border-line pt-6"
          style={{ ["--reveal-delay" as string]: "900ms" }}
        >
          <span aria-hidden className="text-accent-bright">
            <svg viewBox="0 0 12 20" className="h-4 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M6 1v16M1.5 12.5 6 18l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="u-eyebrow">Wicklow Rugby Club</span>
        </div>
      </div>
    </section>
  );
}

function HeroLine({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span
      className="c-mask-line c-rise"
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      <span className={className}>{children}</span>
    </span>
  );
}

/**
 * Mobile and weak-GPU backdrop. Pure CSS: two very slow drifting radial
 * gradients standing in for the cool near-light and the deep warm glow. No
 * canvas, no images, no JS — it costs nothing and holds the same composition.
 */
function StaticHeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <div
        className="c-drift-cool absolute left-[-20%] top-[-10%] h-[80%] w-[90%] rounded-full opacity-70 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(63,125,121,0.5) 0%, rgba(63,125,121,0.12) 45%, transparent 70%)",
        }}
      />
      <div
        className="c-drift-warm absolute bottom-[-25%] right-[-15%] h-[75%] w-[80%] rounded-full opacity-45 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(194,112,60,0.42) 0%, rgba(194,112,60,0.1) 45%, transparent 70%)",
        }}
      />
      {/* Slab silhouettes, echoing the WebGL composition. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "linear-gradient(112deg, transparent 18%, rgba(22,41,43,0.9) 18.5%, rgba(22,41,43,0.9) 34%, transparent 34.5%), " +
            "linear-gradient(98deg, transparent 58%, rgba(27,21,18,0.75) 58.5%, rgba(27,21,18,0.75) 72%, transparent 72.5%)",
        }}
      />
    </div>
  );
}
