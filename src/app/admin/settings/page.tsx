import { updateSiteSettings } from "@/app/admin/actions";
import { AdminField, EditableForm } from "@/components/admin/EditableForm";
import { Panel, PlaceholderNote } from "@/components/ui/Surface";
import { MANAGER_ROLES, requireRole } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { isEmailConfigured } from "@/lib/env";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata = buildMetadata({
  title: "Settings",
  description: "Contact details and integrations.",
  path: "/admin/settings",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole(MANAGER_ROLES, "/admin/settings");

  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="u-eyebrow">Contact details</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          These appear in the footer, on the contact page and in the site&rsquo;s
          structured data for search engines. Leave a field empty and it is
          hidden everywhere rather than shown blank.
        </p>

        <div className="mt-6">
          <EditableForm
            action={updateSiteSettings}
            title="Public contact"
            subtitle="Shown across the site"
          >
            <div className="grid gap-4">
              <AdminField
                label="Contact email"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
              />
              <AdminField
                label="Phone number"
                name="contactPhone"
                type="tel"
                defaultValue={settings.contactPhone}
                hint="Leave empty until a public number is available"
              />
              <AdminField
                label="Instagram URL"
                name="instagram"
                type="url"
                defaultValue={settings.instagram}
              />
            </div>
          </EditableForm>
        </div>
      </section>

      <section>
        <h2 className="u-eyebrow">Integrations</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          These are configured with environment variables rather than here, so
          keys are never stored in the database or visible in the browser.
        </p>

        <Panel className="mt-6 px-6 py-2">
          <dl>
            <IntegrationRow
              name="Stripe payments"
              connected={isStripeConfigured}
              whenMissing="Memberships and bookings are created without taking payment. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable checkout."
              whenPresent="Checkout is live. Memberships activate only when the webhook confirms payment."
            />
            <IntegrationRow
              name="Resend email"
              connected={isEmailConfigured}
              whenMissing="Emails are logged to the server console instead of being sent. Set RESEND_API_KEY to send them."
              whenPresent="Confirmation and sign-in emails are being sent."
            />
          </dl>
        </Panel>
      </section>

      <section>
        <h2 className="u-eyebrow">Content held in code</h2>
        <PlaceholderNote className="mt-5">
          Marketing copy, page headings and photography live in the codebase
          rather than here, so they stay version-controlled and reviewable. Ask
          your developer to change those. Everything that affects money,
          availability or contact details is editable in this admin area.
        </PlaceholderNote>
      </section>
    </div>
  );
}

function IntegrationRow({
  name,
  connected,
  whenMissing,
  whenPresent,
}: {
  name: string;
  connected: boolean;
  whenMissing: string;
  whenPresent: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-[var(--text-body-sm)] text-bone">{name}</dt>
        <dd
          className={
            connected
              ? "text-[var(--text-caption)] uppercase tracking-[0.12em] text-positive"
              : "text-[var(--text-caption)] uppercase tracking-[0.12em] text-caution"
          }
        >
          {connected ? "Connected" : "Not configured"}
        </dd>
      </div>
      <p className="u-measure text-[var(--text-caption)] leading-relaxed text-mist-dim">
        {connected ? whenPresent : whenMissing}
      </p>
    </div>
  );
}
