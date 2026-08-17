import Link from "next/link";

import { footerNav } from "@/config/nav";

/**
 * Shared shell for the legal pages: a narrow measure for long-form reading,
 * with sibling documents listed at the foot so someone checking terms can move
 * between them without going back to the footer.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="u-page pb-28 pt-32 sm:pt-40 lg:pb-36 lg:pt-48">
      <article className="mx-auto w-full max-w-[46rem]">
        <div className="[&_h2]:mt-14 [&_h2]:text-[length:var(--text-h4)] [&_h2]:leading-tight [&_h3]:mt-9 [&_h3]:text-[length:var(--text-body-lg)] [&_h3]:font-medium [&_li]:leading-relaxed [&_li]:text-mist [&_ol]:mt-4 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2.5 [&_ol]:pl-5 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-mist [&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2.5 [&_ul]:pl-5">
          {children}
        </div>

        <nav
          aria-label="Legal documents"
          className="mt-20 border-t border-line pt-8"
        >
          <h2 className="u-eyebrow">Other documents</h2>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            {footerNav.legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[var(--text-body-sm)] text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}
