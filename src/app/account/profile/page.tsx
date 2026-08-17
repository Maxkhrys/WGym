import { ProfileForm } from "@/components/account/ProfileForm";
import { Panel } from "@/components/ui/Surface";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDateLong } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your profile",
  description: "Update your details and contact preferences.",
  path: "/account/profile",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      marketingOptIn: true,
      emergencyContact: true,
      termsAcceptances: {
        orderBy: { acceptedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="u-eyebrow">Your details</h2>
        <Panel className="mt-5 p-6 sm:p-7">
          <ProfileForm
            defaultName={profile.name ?? ""}
            defaultPhone={profile.phone ?? ""}
            defaultMarketingOptIn={profile.marketingOptIn}
            email={profile.email}
          />
        </Panel>
      </section>

      {profile.emergencyContact ? (
        <section>
          <h2 className="u-eyebrow">Emergency contact</h2>
          <Panel className="mt-5 p-6 sm:p-7">
            <dl className="flex flex-col gap-3">
              <Row label="Name" value={profile.emergencyContact.name} />
              {profile.emergencyContact.relationship ? (
                <Row
                  label="Relationship"
                  value={profile.emergencyContact.relationship}
                />
              ) : null}
              <Row label="Phone" value={profile.emergencyContact.phone} />
            </dl>
            <p className="mt-6 text-[var(--text-caption)] leading-relaxed text-mist-dim">
              To change your emergency contact, please speak to us at the desk
              so we can confirm it with you directly.
            </p>
          </Panel>
        </section>
      ) : null}

      {/*
        GDPR: members can see exactly which documents they accepted and when.
        The record is append-only, so this is the audit trail rather than a
        current-state summary.
      */}
      {profile.termsAcceptances.length > 0 ? (
        <section>
          <h2 className="u-eyebrow">Agreements you have accepted</h2>
          <Panel className="mt-5 px-6 py-2">
            <dl>
              {profile.termsAcceptances.map((acceptance) => (
                <div
                  key={acceptance.id}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3.5 last:border-b-0"
                >
                  <dt className="text-[var(--text-body-sm)] text-mist">
                    {DOCUMENT_LABEL[acceptance.document]}
                    <span className="ml-2 text-[var(--text-caption)] text-mist-dim">
                      v{acceptance.version}
                    </span>
                  </dt>
                  <dd className="text-right text-[var(--text-caption)] text-mist-dim">
                    {formatDateLong(acceptance.acceptedAt)}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </section>
      ) : null}

      <section>
        <h2 className="u-eyebrow">Your data</h2>
        <Panel className="mt-5 p-6 sm:p-7">
          <p className="u-measure text-[var(--text-body-sm)] leading-relaxed text-mist">
            You can ask us for a copy of the personal data we hold about you, or
            ask us to correct or delete it. Email us and we will respond within
            one month, as required under GDPR.
          </p>
          <p className="mt-4 text-[var(--text-caption)] leading-relaxed text-mist-dim">
            Deleting your account does not remove records we are legally
            required to keep, such as payment records for tax purposes.
          </p>
        </Panel>
      </section>
    </div>
  );
}

const DOCUMENT_LABEL: Record<string, string> = {
  MEMBERSHIP_TERMS: "Membership terms",
  PRIVACY_POLICY: "Privacy policy",
  CANCELLATION_POLICY: "Cancellation policy",
  HEALTH_DECLARATION: "Health declaration",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-[var(--text-body-sm)] text-mist">{label}</dt>
      <dd className="text-right text-[var(--text-body-sm)] text-bone">{value}</dd>
    </div>
  );
}
