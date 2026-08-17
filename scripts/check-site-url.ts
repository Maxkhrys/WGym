/**
 * Site-URL resolution check.
 *
 * A blank `NEXT_PUBLIC_SITE_URL` — what an empty field in a hosting dashboard
 * produces — used to reach `new URL("")` and fail the production build with
 * `ERR_INVALID_URL` during page-data collection. These cases pin the
 * resolution rules so that cannot come back.
 *
 * Usage: npx tsx scripts/check-site-url.ts
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

type Case = {
  label: string;
  env: Record<string, string | undefined>;
  expect: string;
};

const cases: Case[] = [
  {
    label: "explicit origin is used as given",
    env: { NEXT_PUBLIC_SITE_URL: "https://thewgym.ie" },
    expect: "https://thewgym.ie",
  },
  {
    label: "trailing slash is trimmed",
    env: { NEXT_PUBLIC_SITE_URL: "https://thewgym.ie/" },
    expect: "https://thewgym.ie",
  },
  {
    label: "surrounding whitespace is trimmed",
    env: { NEXT_PUBLIC_SITE_URL: "  https://thewgym.ie  " },
    expect: "https://thewgym.ie",
  },
  {
    label: "blank falls through to the platform production domain",
    env: {
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "thewgym.vercel.app",
    },
    expect: "https://thewgym.vercel.app",
  },
  {
    label: "a scheme-less host gains https",
    env: { NEXT_PUBLIC_SITE_URL: "thewgym.ie" },
    expect: "https://thewgym.ie",
  },
  {
    label: "whitespace-only is treated as blank",
    env: { NEXT_PUBLIC_SITE_URL: "   ", VERCEL_URL: "dep-123.vercel.app" },
    expect: "https://dep-123.vercel.app",
  },
  {
    label: "production domain wins over the per-deployment URL",
    env: {
      VERCEL_PROJECT_PRODUCTION_URL: "thewgym.ie",
      VERCEL_URL: "dep-123.vercel.app",
    },
    expect: "https://thewgym.ie",
  },
  {
    label: "nothing set at all falls back to localhost",
    env: {},
    expect: "http://localhost:3000",
  },
  {
    label: "an unparseable value falls back rather than throwing",
    env: { NEXT_PUBLIC_SITE_URL: "http://" },
    expect: "http://localhost:3000",
  },
];

let failures = 0;

for (const testCase of cases) {
  // A fresh process per case: the module resolves its value once at load, so
  // reassigning process.env afterwards would prove nothing.
  const script = [
    "import { SITE_URL } from './src/lib/site-url.ts';",
    "process.stdout.write(SITE_URL);",
  ].join("");

  const env: NodeJS.ProcessEnv = { ...process.env };
  // Clear anything inherited that would otherwise leak into the case.
  delete env.NEXT_PUBLIC_SITE_URL;
  delete env.VERCEL_URL;
  delete env.VERCEL_PROJECT_PRODUCTION_URL;
  delete env.NEXT_PUBLIC_VERCEL_URL;
  delete env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  Object.assign(env, testCase.env);

  let actual: string;
  try {
    actual = execFileSync(
      process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-e", script],
      { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${testCase.label} — threw: ${(error as Error).message.split("\n")[0]}`);
    continue;
  }

  try {
    assert.equal(actual, testCase.expect);
    console.log(`  ok   ${testCase.label} — ${actual}`);
  } catch {
    failures += 1;
    console.log(`  FAIL ${testCase.label} — got ${actual}, expected ${testCase.expect}`);
  }
}

console.log(
  failures === 0
    ? `\nPASS — all ${cases.length} site-URL cases resolved correctly.`
    : `\nFAIL — ${failures} of ${cases.length} cases did not.`,
);

process.exitCode = failures === 0 ? 0 : 1;
