# Brand assets

Put the supplied logo here as `logo.svg` (preferred) or `logo.png`.

Then follow the single swap point marked in
[`src/components/brand/Logo.tsx`](../../src/components/brand/Logo.tsx) — every
surface on the site consumes `LogoMark` / `LogoLockup`, so replacing the body of
that one component updates the header, the mobile drawer, the footer and the
emails at once.

The current mark is a neutral placeholder built from the same stacked-stone idea
and muted blue-green as the existing logo. It is not a redesign, and it is meant
to be replaced.

Also useful here:

- `favicon.ico` / `icon.png` — see
  [app icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons);
  these live in `src/app/` rather than this folder.
- A square logo on a transparent background, for social profiles.
