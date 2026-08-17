import { redirect } from "next/navigation";
import Link from "next/link";

import { SignInForm } from "@/components/account/SignInForm";
import { getSessionUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your account at The W Gym & Sauna.",
  path: "/signin",
  noIndex: true,
});

const ERROR_MESSAGES: Record<string, string> = {
  Verification:
    "That sign-in link has expired or has already been used. Request a new one below.",
  Configuration:
    "Sign-in is not configured correctly. Please contact us so we can sort it out.",
  AccessDenied: "That account cannot be signed in.",
  Default: "Something went wrong signing you in. Please try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  // Already signed in — send them where they were headed.
  if (user) {
    redirect(safeCallback(params.callbackUrl));
  }

  const error = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-md">
        <p className="u-eyebrow">Members</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          Sign in
        </h1>
        <p className="mt-6 text-[var(--text-body)] leading-relaxed text-mist">
          Enter your email and we will send you a link to sign in. No password
          to remember.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-8 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-10">
          <SignInForm callbackUrl={safeCallback(params.callbackUrl)} />
        </div>

        <p className="mt-10 border-t border-line pt-8 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
          Not a member yet?{" "}
          <Link
            href="/memberships"
            className="text-mist underline underline-offset-4 transition-colors hover:text-bone"
          >
            See membership options
          </Link>
          , or{" "}
          <Link
            href="/sauna/book"
            className="text-mist underline underline-offset-4 transition-colors hover:text-bone"
          >
            book a recovery session
          </Link>{" "}
          without an account.
        </p>
      </div>
    </div>
  );
}

/**
 * Only ever redirect within this site. An attacker-supplied absolute URL in
 * `callbackUrl` would otherwise turn the sign-in page into an open redirect.
 */
function safeCallback(value: string | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}
