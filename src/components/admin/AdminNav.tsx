"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import type { Role } from "@/generated/prisma/enums";

const links: { href: string; label: string; managerOnly?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/plans", label: "Plans", managerOnly: true },
  { href: "/admin/services", label: "Sessions", managerOnly: true },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/settings", label: "Settings", managerOnly: true },
];

/**
 * Manager-only links are hidden from STAFF. This is presentation only — the
 * actions themselves re-check the role server-side, so hiding a link is
 * convenience rather than the security boundary.
 */
export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const isManager = role === "OWNER" || role === "ADMIN";

  const visible = links.filter((link) => !link.managerOnly || isManager);

  return (
    <nav aria-label="Admin" className="lg:sticky lg:top-32">
      <ul className="u-rail u-no-scrollbar gap-2 lg:flex-col lg:gap-1 lg:overflow-visible">
        {visible.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="lg:w-full">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "u-tap flex items-center whitespace-nowrap rounded-full px-4 text-[var(--text-body-sm)] transition-colors duration-250",
                  "lg:rounded-xl lg:px-4 lg:py-2.5",
                  active
                    ? "bg-surface text-bone"
                    : "text-mist hover:bg-surface/60 hover:text-bone",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
