import { updatePlan } from "@/app/admin/actions";
import {
  AdminField,
  AdminToggle,
  EditableForm,
} from "@/components/admin/EditableForm";
import { PlaceholderNote } from "@/components/ui/Surface";
import { PRICING_IS_PROVISIONAL } from "@/config/catalogue";
import { MANAGER_ROLES, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatBillingInterval } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Membership plans",
  description: "Edit membership plans.",
  path: "/admin/plans",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireRole(MANAGER_ROLES, "/admin/plans");

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="u-eyebrow">Membership plans</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          Prices here are the live prices shown on the site and charged at
          checkout. They are read from the database on every request, so a
          change takes effect immediately.
        </p>
      </div>

      {PRICING_IS_PROVISIONAL ? (
        <PlaceholderNote>
          The site is still flagged as using provisional pricing. Once these are
          the real figures, set <code>PRICING_IS_PROVISIONAL</code> to false in{" "}
          <code>src/config/catalogue.ts</code> to remove the &ldquo;placeholder
          pricing&rdquo; notices from the public pages.
        </PlaceholderNote>
      ) : null}

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <EditableForm
            key={plan.id}
            action={updatePlan}
            title={plan.name}
            subtitle={`${plan.slug} · ${formatBillingInterval(plan.interval)}${
              plan.stripePriceId ? " · linked to a Stripe price" : ""
            }`}
          >
            <input type="hidden" name="planId" value={plan.id} />

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Name" name="name" defaultValue={plan.name} required />
              <AdminField
                label="Price (€)"
                name="priceEuros"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(plan.priceCents / 100).toFixed(2)}
                required
              />
              <AdminField
                label="Joining fee (€)"
                name="joiningFeeEuros"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(plan.joiningFeeCents / 100).toFixed(2)}
              />
            </div>

            <AdminToggle
              label="Available to join"
              name="active"
              defaultChecked={plan.active}
            />

            {plan.stripePriceId ? (
              <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
                This plan uses Stripe price{" "}
                <span className="u-tnum">{plan.stripePriceId}</span>, so Stripe
                charges that amount at checkout. The price above is what the
                site displays — keep the two in step.
              </p>
            ) : null}
          </EditableForm>
        ))}
      </div>
    </div>
  );
}
