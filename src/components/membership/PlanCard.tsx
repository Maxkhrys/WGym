import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatBillingInterval, formatPrice } from "@/lib/format";
import type { MembershipPlanRecord } from "@/lib/queries/plans";

/**
 * Deliberately not a bordered pricing box in a row of three.
 *
 * The plan name is the largest element, the price sits on a baseline with the
 * interval, and the whole card is a flat panel that only separates from the
 * page on hover. Emphasis is carried by a hairline rule and a change of text
 * colour rather than by a coloured border or a "Most popular" ribbon.
 */
export function PlanCard({
  plan,
  emphasis = false,
  href,
  ctaLabel = "Choose plan",
  className,
}: {
  plan: MembershipPlanRecord;
  emphasis?: boolean;
  href?: string;
  ctaLabel?: string;
  className?: string;
}) {
  const target = href ?? `/signup?plan=${plan.slug}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col border-t pt-8 transition-colors duration-500",
        emphasis ? "border-accent" : "border-line-hi",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[length:var(--text-h3)] leading-none">{plan.name}</h3>
        {plan.isDayPass ? (
          <span className="u-eyebrow shrink-0 text-mist-dim">One-off</span>
        ) : null}
      </div>

      {plan.tagline ? (
        <p className="mt-3 text-[var(--text-body-sm)] text-mist-dim">
          {plan.tagline}
        </p>
      ) : null}

      <div className="mt-8 flex items-baseline gap-2.5">
        <span
          className={cn(
            "u-tnum font-[family-name:var(--font-display)] text-[length:var(--text-h2)] leading-none tracking-[-0.04em]",
            emphasis ? "text-accent-bright" : "text-bone",
          )}
        >
          {formatPrice(plan.priceCents, plan.currency)}
        </span>
        <span className="text-[var(--text-body-sm)] text-mist">
          {formatBillingInterval(plan.interval)}
        </span>
      </div>

      {plan.joiningFeeCents > 0 ? (
        <p className="mt-2.5 text-[var(--text-caption)] text-mist-dim">
          Plus a {formatPrice(plan.joiningFeeCents, plan.currency)} joining fee
        </p>
      ) : null}

      <p className="u-measure mt-7 text-[var(--text-body-sm)] leading-relaxed text-mist">
        {plan.description}
      </p>

      {plan.features.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-3.5">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-[var(--text-body-sm)] leading-relaxed text-mist"
            >
              <span
                aria-hidden
                className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-10">
        {plan.minimumTermMonths > 0 || plan.cancellationNotice ? (
          <p className="mb-6 text-[var(--text-caption)] leading-relaxed text-mist-dim">
            {plan.minimumTermMonths > 0
              ? `Minimum term of ${plan.minimumTermMonths} month${plan.minimumTermMonths === 1 ? "" : "s"}. `
              : ""}
            {plan.cancellationNotice ? `${plan.cancellationNotice} to cancel.` : ""}
          </p>
        ) : null}

        <ButtonLink
          href={target}
          variant={emphasis ? "primary" : "secondary"}
          size="md"
          fullWidth
        >
          {ctaLabel}
        </ButtonLink>
      </div>
    </article>
  );
}
