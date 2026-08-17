import Link from "next/link";

import { LogoLockup } from "@/components/brand/Logo";
import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

const columns = [
  { title: "Visit", items: footerNav.visit },
  { title: "Join", items: footerNav.join },
  { title: "The W", items: footerNav.company },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-ink-sunken">
      <div className="u-page py-20 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="The W Gym & Sauna — home">
              <LogoLockup />
            </Link>
            <p className="u-measure-tight mt-7 text-[var(--text-body-sm)] leading-relaxed text-mist">
              A gym and recovery space at Wicklow Rugby Club. Train hard, recover
              properly, and be part of something.
            </p>

            <address className="mt-8 not-italic text-[var(--text-body-sm)] leading-relaxed text-mist">
              {siteConfig.address.venue}
              <br />
              {siteConfig.address.locality}, {siteConfig.address.postalCode}
              <br />
              {siteConfig.address.country}
            </address>

            <div className="mt-6 flex flex-col gap-2 text-[var(--text-body-sm)]">
              {siteConfig.contact.email ? (
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="w-fit text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                >
                  {siteConfig.contact.email}
                </a>
              ) : null}
              {siteConfig.contact.phone ? (
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="w-fit text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                >
                  {siteConfig.contact.phone}
                </a>
              ) : null}
            </div>

            {siteConfig.social.instagram ? (
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-7 inline-flex items-center gap-2.5 text-[var(--text-body-sm)] text-mist transition-colors hover:text-bone"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                Instagram
              </a>
            ) : null}
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="u-eyebrow">{column.title}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[var(--text-body-sm)] text-mist transition-colors duration-300 hover:text-bone"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 sm:mt-20 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[var(--text-caption)] text-mist-dim">
            © {year} {siteConfig.name}. All rights reserved.
          </p>

          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[var(--text-caption)] text-mist-dim transition-colors duration-300 hover:text-mist"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
