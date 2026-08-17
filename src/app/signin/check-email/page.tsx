import Link from "next/link";

import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Check your email",
  description: "A sign-in link is on its way.",
  path: "/signin/check-email",
  noIndex: true,
});

export default function CheckEmailPage() {
  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-md">
        <p className="u-eyebrow">Members</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          Check your email
        </h1>
        <p className="mt-6 text-[var(--text-body)] leading-relaxed text-mist">
          We have sent you a sign-in link. It works once and expires in 24
          hours.
        </p>
        <p className="mt-5 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
          If it has not arrived in a few minutes, check your spam folder, then{" "}
          <Link
            href="/signin"
            className="text-mist underline underline-offset-4 transition-colors hover:text-bone"
          >
            request another link
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
