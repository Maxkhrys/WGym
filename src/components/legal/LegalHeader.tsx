import { PlaceholderNote } from "@/components/ui/Surface";

/**
 * Heading block for a legal document.
 *
 * Every one of these carries a visible note that it has not been reviewed by a
 * solicitor. These documents are structurally complete and specific to this
 * business, but they are not legal advice, and shipping them silently as if
 * they were would be the wrong call for a real trading company.
 */
export function LegalHeader({
  title,
  version,
  summary,
}: {
  title: string;
  version: string;
  summary: string;
}) {
  return (
    <header>
      <p className="u-eyebrow">Legal</p>
      <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">{title}</h1>
      <p className="mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
        {summary}
      </p>
      <p className="mt-6 text-[var(--text-caption)] text-mist-dim">
        Version {version}
      </p>

      <PlaceholderNote className="mt-8">
        Draft for review. This document has been written for The W but has not
        been checked by a solicitor. Have it reviewed before the site goes live,
        and bump the version in <code>src/config/site.ts</code> when it changes
        so acceptance records stay accurate.
      </PlaceholderNote>
    </header>
  );
}
