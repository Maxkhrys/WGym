import type { ComponentType, ElementType } from "react";

/**
 * `ElementType` is a union of every intrinsic tag and component. Rendering a
 * value of that type generically makes TypeScript intersect all their prop
 * types, which resolves to `never` — so `<Tag className="…">` fails to compile
 * even though it is perfectly valid at runtime.
 *
 * `PolymorphicTag` narrows it to an open prop bag so JSX works normally. Use it
 * as a cast at the point of use:
 *
 *   const Tag = as as PolymorphicTag;
 *
 * A cast rather than a helper *function* matters: anything that looks like it
 * builds a component during render trips React's static-components rule, and a
 * genuinely new component identity each render would remount the subtree and
 * throw away its state. A cast keeps the original reference.
 */
export type PolymorphicTag = ComponentType<Record<string, unknown>>;

export type { ElementType };
