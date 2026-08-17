# Photography

Drop the real photographs in here, then fill in the matching `src` in
[`src/config/media.ts`](../../src/config/media.ts).

Until a slot has a `src`, the site renders a designed placeholder plate in
exactly the right position and aspect ratio, captioned with the shot that
belongs there. Nothing looks broken, and the layout does not move when the real
image arrives.

Every slot already has its alt text written, so accessibility does not wait on
the photographer.

## Naming

Use the manifest key as the filename, e.g. the `gymFeature` slot becomes
`/public/media/gym-feature.jpg` and is referenced as `"/media/gym-feature.jpg"`.

## Format and size

- **JPEG or WebP.** `next/image` converts to AVIF/WebP on the fly, so supply
  the highest quality original you have rather than a pre-optimised file.
- **Roughly 2400px on the long edge** is plenty. Larger just slows the build.
- Keep the aspect ratio close to the `ratio` declared for that slot in the
  manifest — the layout reserves that box, and a very different crop will be
  centre-cropped to fit.
