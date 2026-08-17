import { LegalHeader } from "@/components/legal/LegalHeader";
import { LEGAL_VERSIONS, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How The W Gym & Sauna collects, uses and protects your personal data.",
  path: "/legal/privacy",
});

export default async function PrivacyPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || siteConfig.contact.email;

  return (
    <>
      <LegalHeader
        title="Privacy Policy"
        version={LEGAL_VERSIONS.privacyPolicy}
        summary="What personal data we hold about you, why we hold it, and what you can do about it."
      />

      <h2>Who we are</h2>
      <p>
        {siteConfig.name} at {siteConfig.address.venue},{" "}
        {siteConfig.address.locality}, {siteConfig.address.postalCode}, Ireland,
        is the data controller for the personal data described here. You can
        contact us at {contact}.
      </p>

      <h2>What we collect</h2>
      <p>We collect only what we need to run a gym and a booking system:</p>
      <ul>
        <li>
          <strong>Account details</strong> — your name, email address, phone
          number and date of birth. Date of birth confirms you are old enough to
          join.
        </li>
        <li>
          <strong>Emergency contact</strong> — the name and number of someone we
          can contact if you become unwell on site.
        </li>
        <li>
          <strong>Health declaration</strong> — a record that you confirmed our
          health statement. We do not collect medical records or ask you to
          describe any condition.
        </li>
        <li>
          <strong>Membership and bookings</strong> — which membership you hold,
          which sessions you booked, and whether you attended.
        </li>
        <li>
          <strong>Payment records</strong> — the amount, date and outcome of
          payments, plus the reference Stripe gives us. We never see or store
          your card number.
        </li>
        <li>
          <strong>Agreement records</strong> — which version of our terms you
          accepted, when, and the IP address it came from.
        </li>
      </ul>

      <h2>Why we hold it, and on what basis</h2>
      <ul>
        <li>
          <strong>To provide what you signed up for</strong> — managing your
          membership, taking bookings and payments. Legal basis: performance of
          a contract.
        </li>
        <li>
          <strong>To keep you safe on site</strong> — your emergency contact and
          health acknowledgement. Legal basis: legitimate interests, and vital
          interests in an emergency.
        </li>
        <li>
          <strong>To meet our legal obligations</strong> — retaining financial
          records for tax purposes. Legal basis: legal obligation.
        </li>
        <li>
          <strong>To send you marketing</strong> — only if you asked us to.
          Legal basis: consent, which you can withdraw at any time.
        </li>
      </ul>
      <p>
        Marketing consent is entirely separate from joining. You can be a member
        and receive nothing but the emails needed to run your membership and
        bookings.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We do not sell your data and we do not share it for advertising. We use
        a small number of processors to run the service:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing. Your card details go
          directly to Stripe and never reach our servers.
        </li>
        <li>
          <strong>Resend</strong> — sending confirmation and sign-in emails.
        </li>
        <li>
          <strong>Our hosting and database provider</strong> — storing the data
          described above.
        </li>
      </ul>
      <p>
        Each of these acts on our instructions only. Where data is processed
        outside the EEA, that transfer is covered by the safeguards those
        providers have in place.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          Membership and booking records: for as long as you are a member, and
          for six years afterwards where they form part of our financial
          records.
        </li>
        <li>
          Payment records: six years, as required for tax purposes in Ireland.
        </li>
        <li>
          Marketing consent records: until you withdraw consent, plus a record
          that you did so.
        </li>
        <li>
          Sign-in tokens and sessions: these expire automatically and are
          deleted.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>Under GDPR you can ask us to:</p>
      <ul>
        <li>give you a copy of the personal data we hold about you;</li>
        <li>correct anything that is wrong;</li>
        <li>
          delete your data, where we are not required to keep it for legal
          reasons;
        </li>
        <li>restrict or object to how we use it;</li>
        <li>send your data to another provider in a portable format;</li>
        <li>withdraw marketing consent at any time.</li>
      </ul>
      <p>
        Email {contact} and we will respond within one month. If you are not
        satisfied with how we have handled your data, you can complain to the
        Irish Data Protection Commission at dataprotection.ie.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in and to protect
        forms from cross-site request forgery. We do not use analytics,
        advertising or tracking cookies, which is why you are not asked to
        consent to any. See our cookie policy for the detail.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the version number above. Where
        the change is significant and affects how we use your data, we will tell
        members directly.
      </p>
    </>
  );
}
