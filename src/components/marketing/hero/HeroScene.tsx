"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Slow-moving translucent slabs in dark space.
 *
 * Deliberately restrained: no post-processing, no environment map, no loading
 * screen. The whole look comes from two coloured lights (cool teal near, warm
 * ember deep), exponential fog, and a very low rotation rate — so it reads as
 * light moving through stone rather than as a 3D widget.
 *
 * Cost control:
 *  - 7 shared-geometry meshes, one material instance per tone
 *  - no shadow maps
 *  - dpr capped at 1.5; the scene is soft and gains nothing from retina
 *  - the frameloop pauses when the hero scrolls out of view (see `Paused`)
 */

const SLABS: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  drift: number;
  tone: "cool" | "warm";
}[] = [
  { position: [-2.6, 0.4, 0], rotation: [0.1, 0.3, 0.24], scale: [2.2, 3.1, 0.16], drift: 0.7, tone: "cool" },
  { position: [1.9, -0.9, -1.4], rotation: [-0.16, -0.4, -0.12], scale: [2.6, 2.2, 0.14], drift: 0.55, tone: "cool" },
  { position: [0.2, 1.7, -2.6], rotation: [0.28, 0.12, -0.3], scale: [3.1, 1.5, 0.12], drift: 0.42, tone: "cool" },
  { position: [-3.6, -1.8, -3.4], rotation: [-0.1, 0.5, 0.4], scale: [1.9, 2.4, 0.12], drift: 0.33, tone: "warm" },
  { position: [3.4, 1.4, -4.6], rotation: [0.2, -0.24, 0.16], scale: [2.4, 2.8, 0.1], drift: 0.28, tone: "warm" },
  { position: [-0.9, -2.4, -5.6], rotation: [0.34, 0.18, -0.2], scale: [3.4, 1.8, 0.1], drift: 0.2, tone: "warm" },
  { position: [1.2, 0.2, -7.2], rotation: [-0.2, 0.36, 0.1], scale: [4.2, 3.4, 0.08], drift: 0.14, tone: "warm" },
];

function Slabs({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  // One geometry, two materials, shared across every slab.
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const materials = useMemo(
    () => ({
      cool: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#16292b"),
        roughness: 0.42,
        metalness: 0.08,
        transparent: true,
        opacity: 0.9,
      }),
      warm: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1b1512"),
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0.82,
      }),
    }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const scroll = scrollRef.current;

    if (group.current) {
      // Pointer parallax: the camera barely moves, and eases rather than
      // tracking, so it feels like weight rather than a mouse-follow gimmick.
      const targetX = state.pointer.x * 0.42;
      const targetY = state.pointer.y * 0.26;
      group.current.rotation.y += (targetX * 0.16 - group.current.rotation.y) * Math.min(1, delta * 1.6);
      group.current.rotation.x += (-targetY * 0.12 - group.current.rotation.x) * Math.min(1, delta * 1.6);
    }

    for (let i = 0; i < SLABS.length; i += 1) {
      const mesh = meshes.current[i];
      if (!mesh) continue;

      const slab = SLABS[i];

      // Idle drift.
      mesh.rotation.z = slab.rotation[2] + Math.sin(t * 0.08 * slab.drift + i) * 0.06;
      mesh.rotation.x = slab.rotation[0] + Math.cos(t * 0.06 * slab.drift + i) * 0.05;
      mesh.position.y =
        slab.position[1] + Math.sin(t * 0.14 * slab.drift + i * 1.7) * 0.18;

      // On scroll the forms separate outward and the camera pushes through the
      // gap, which is what uncovers the headline behind them.
      const spread = scroll * 5.5;
      const direction = Math.sign(slab.position[0]) || 1;
      mesh.position.x = slab.position[0] + direction * spread * (0.4 + slab.drift);
      mesh.position.z = slab.position[2] + scroll * 3.2;
    }
  });

  return (
    <group ref={group}>
      {SLABS.map((slab, index) => (
        <mesh
          key={index}
          ref={(node) => {
            meshes.current[index] = node;
          }}
          geometry={geometry}
          material={materials[slab.tone]}
          position={slab.position}
          rotation={slab.rotation}
          scale={slab.scale}
        />
      ))}
    </group>
  );
}

function Lighting() {
  return (
    <>
      {/* Barely-there ambient so the darkest faces don't crush to pure black. */}
      <ambientLight intensity={0.16} color="#9fc4c0" />

      {/* Cool teal edge light from the gym side, close to camera. */}
      <pointLight position={[-6, 3.5, 3]} intensity={26} color="#5fb0a9" distance={22} decay={2} />

      {/* Warm sauna glow, deep in the scene, never in front. */}
      <pointLight position={[4, -1.5, -7]} intensity={34} color="#d8823f" distance={26} decay={2} />

      {/* Soft top fill to describe the slab edges. */}
      <directionalLight position={[1.5, 6, 2]} intensity={0.5} color="#cfe0dc" />
    </>
  );
}

export default function HeroScene({
  scrollRef,
  active,
}: {
  scrollRef: React.RefObject<number>;
  /** False once the hero leaves the viewport — pauses the render loop. */
  active: boolean;
}) {
  return (
    <Canvas
      // R3F applies `style` to the element that wraps the canvas and sizes the
      // drawing buffer from it, so the fill has to be set here rather than on
      // an outer element — otherwise the buffer stays at its 300x150 default.
      style={{ position: "absolute", inset: 0 }}
      // Measure synchronously. The default debounce can leave the drawing
      // buffer at its 300x150 default until the first resize event.
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 7.5], fov: 42, near: 0.1, far: 40 }}
      // The scene is decorative; screen readers should skip it entirely.
      aria-hidden
      tabIndex={-1}
    >
      <fog attach="fog" args={["#07090a", 6, 20]} />
      <Lighting />
      <Slabs scrollRef={scrollRef} />
    </Canvas>
  );
}
