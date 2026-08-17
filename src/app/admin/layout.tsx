import Link from "next/link";

import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/account/SignOutButton";
import { Badge } from "@/components/ui/Surface";
import { STAFF_ROLES, requireRole } from "@/lib/auth/guards";

/**
 * Role gate for the whole admin area.
 *
 * Guarding in the layout rather than per page means a page added later is
 * protected by default. A signed-in member without a staff role gets a 404,
 * not a redirect — see requireRole for why.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(STAFF_ROLES, "/admin");

  return (
    <div className="u-page pb-28 pt-32 sm:pt-36 lg:pb-32 lg:pt-44">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="u-eyebrow">Admin</p>
            <Badge tone="accent">{user.role}</Badge>
          </div>
          <h1 className="mt-4 text-[length:var(--text-h3)] leading-none">
            The W
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/account"
            className="u-tap inline-flex items-center rounded-full border border-line-hi px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:border-accent hover:text-bone"
          >
            My account
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-2">
          <AdminNav role={user.role} />
        </div>
        <div className="lg:col-span-10">{children}</div>
      </div>
    </div>
  );
}
