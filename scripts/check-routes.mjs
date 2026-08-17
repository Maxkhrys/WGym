/**
 * Route smoke test.
 *
 * Hits every public route plus the protected ones, and asserts each returns
 * the status it should. Protected routes are checked *unauthenticated*, so
 * this doubles as an auth-guard test: /account must redirect to sign-in and
 * /admin must not be reachable.
 *
 * Usage: node scripts/check-routes.mjs [baseUrl]
 */

const base = process.argv[2] ?? "http://localhost:4327";

/** [path, expected status(es), label] */
const routes = [
  ["/", [200], "home"],
  ["/gym", [200], "gym"],
  ["/sauna", [200], "sauna"],
  ["/sauna/book", [200], "booking"],
  ["/memberships", [200], "memberships"],
  ["/signup", [200], "signup"],
  ["/facilities", [200], "facilities"],
  ["/about", [200], "about"],
  ["/contact", [200], "contact"],
  ["/signin", [200], "sign in"],
  ["/signin/check-email", [200], "check email"],
  ["/legal/privacy", [200], "privacy"],
  ["/legal/cookies", [200], "cookies"],
  ["/legal/terms", [200], "terms"],
  ["/legal/membership-terms", [200], "membership terms"],
  ["/legal/cancellation", [200], "cancellation"],
  ["/sitemap.xml", [200], "sitemap"],
  ["/robots.txt", [200], "robots"],
  ["/opengraph-image", [200], "og image"],
  ["/this-page-does-not-exist", [404], "404 page"],

  // Guards, checked signed-out.
  ["/account", [307, 302, 200], "account (guard)"],
  ["/account/bookings", [307, 302, 200], "bookings (guard)"],
  ["/account/profile", [307, 302, 200], "profile (guard)"],
  ["/admin", [307, 302, 404], "admin (guard)"],
  ["/admin/plans", [307, 302, 404], "admin plans (guard)"],

  // API surface.
  ["/api/availability?service=sauna-session&from=2026-09-01&days=7", [200], "availability api"],
  ["/api/availability?service=nope&from=2026-09-01&days=7", [404], "availability unknown service"],
  ["/api/availability?service=sauna-session&from=bad&days=7", [400], "availability bad date"],
];

let failures = 0;

for (const [path, expected, label] of routes) {
  try {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    const ok = expected.includes(response.status);

    // A guard that returns 200 must have landed on the sign-in page, not the
    // protected content — otherwise the guard is not doing its job.
    let detail = "";
    if (ok && label.includes("guard") && response.status === 200) {
      const body = await response.text();
      const looksLikeSignIn =
        body.includes("Sign in") || body.includes("sign-in link");
      const looksLike404 = body.includes("That page isn");
      if (!looksLikeSignIn && !looksLike404) {
        failures += 1;
        console.log(`  FAIL ${label} (${path}) — 200 but not the sign-in page`);
        continue;
      }
      detail = looksLike404 ? " → 404" : " → sign-in";
    }

    if (ok) {
      console.log(`  ok   ${label} (${path}) ${response.status}${detail}`);
    } else {
      failures += 1;
      console.log(
        `  FAIL ${label} (${path}) — got ${response.status}, expected ${expected.join("/")}`,
      );
    }
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${label} (${path}) — ${error.message}`);
  }
}

console.log(
  failures === 0
    ? `\nPASS — all ${routes.length} routes behaved as expected.`
    : `\nFAIL — ${failures} of ${routes.length} routes did not.`,
);

process.exitCode = failures === 0 ? 0 : 1;
