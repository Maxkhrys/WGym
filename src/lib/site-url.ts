/**
 * The site's absolute origin, resolved once for the whole app.
 *
 * Deliberately not `process.env.NEXT_PUBLIC_SITE_URL ?? fallback`: `??` only
 * catches `undefined`, and a variable that exists but is blank — which is what
 * you get from an empty field in a hosting dashboard — passes straight through.
 * `new URL("")` then throws `ERR_INVALID_URL` at module scope, which fails the
 * build during page-data collection with an error that points at the metadata
 * line rather than at the missing configuration.
 *
 * So: treat blank as absent, fall back through the platform's own variables,
 * and always return something `new URL()` will accept.
 *
 * No `server-only` import here — this is read by the root layout, the sitemap
 * and robots as well as by server code, and it contains no secrets.
 */

function firstNonBlank(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalise(value: string): string {
  // Vercel exposes host names without a scheme (`my-app.vercel.app`), which is
  // not a valid URL on its own.
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  // Trailing slashes would double up when joined with a path.
  return withScheme.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const candidate = firstNonBlank(
    process.env.NEXT_PUBLIC_SITE_URL,
    // Set by Vercel to the stable production domain, so preview deployments
    // still emit canonical URLs that point at production.
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    // Last resort: this specific deployment's generated URL.
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL,
  );

  if (!candidate) return "http://localhost:3000";

  const normalised = normalise(candidate);

  try {
    // Prove it parses now, at module load, rather than failing later inside
    // Next's metadata handling where the cause is much harder to read.
    return new URL(normalised).origin;
  } catch {
    console.warn(
      `Ignoring unusable site URL ${JSON.stringify(candidate)}; falling back to localhost. ` +
        "Set NEXT_PUBLIC_SITE_URL to a full origin, e.g. https://thewgym.ie",
    );
    return "http://localhost:3000";
  }
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a path. Stripe redirects and emails cannot use relative paths. */
export function absoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}
