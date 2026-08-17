import Link from "next/link";

import { AccountNav } from "@/components/account/AccountNav";
import { SignOutButton } from "@/components/account/SignOutButton";
import { requireUser } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/guards";

/**
 * Every route under /account is protected here rather than page by page, so a
 * new page added later cannot accidentally ship unguarded.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/account");

  return (
    <div className="u-page pb-28 pt-32 sm:pt-36 lg:pb-32 lg:pt-44">
      <div className="flex flex-col gap-3 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="u-eyebrow">Your account</p>
          <h1 className="mt-4 text-[length:var(--text-h3)] leading-none">
            {user.name ?? "Member"}
          </h1>
          <p className="mt-3 text-[var(--text-body-sm)] text-mist">{user.email}</p>
        </div>

        <div className="flex items-center gap-4">
          {isStaff(user.role) ? (
            <Link
              href="/admin"
              className="u-tap inline-flex items-center rounded-full border border-line-hi px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:border-accent hover:text-bone"
            >
              Admin
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <AccountNav />
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
