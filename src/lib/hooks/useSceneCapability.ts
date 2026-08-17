"use client";

import { useEffect, useState } from "react";

/**
 * Decides whether this device should run the WebGL hero.
 *
 * The check runs after mount and starts pessimistic, so the server renders the
 * lightweight fallback and only capable machines ever download and start the
 * scene. Three.js is dynamically imported behind this gate, which keeps it out
 * of the initial bundle for everyone who won't see it.
 *
 * Gates, in order of importance:
 *  - reduced motion: an explicit user request, honoured absolutely
 *  - coarse pointer / narrow viewport: the scene is pointer-reactive and phones
 *    pay the battery cost for an interaction they cannot perform
 *  - low core count or low reported memory: cheap proxies for a weak GPU
 *  - no WebGL context available at all
 */
export function useSceneCapability(): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function evaluate() {
      if (reducedMotion.matches) {
        setCapable(false);
        return;
      }

      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 1024;
      if (coarsePointer || narrow) {
        setCapable(false);
        return;
      }

      const cores = navigator.hardwareConcurrency ?? 4;
      const memory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      if (cores < 4 || memory < 4) {
        setCapable(false);
        return;
      }

      setCapable(hasWebGL());
    }

    evaluate();

    reducedMotion.addEventListener("change", evaluate);
    window.addEventListener("resize", evaluate);
    return () => {
      reducedMotion.removeEventListener("change", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  return capable;
}

let webglSupport: boolean | null = null;

function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(context);
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}
