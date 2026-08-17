"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/profile", label: "Profile" },
];

/**
 * Segmented control on mobile, vertical list from `lg` up. It is a rail on
 * small screens so it never wraps to two lines on a 320px phone.
 */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-32">
      <ul className="u-rail u-no-scrollbar gap-2 lg:flex-col lg:gap-1 lg:overflow-visible">
        {links.map((link) => {
          const active =
            link.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="lg:w-full">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "u-tap flex items-center rounded-full px-4 text-[var(--text-body-sm)] transition-colors duration-250",
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
