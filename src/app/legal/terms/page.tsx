import Link from "next/link";

import { LegalHeader } from "@/components/legal/LegalHeader";
import { LEGAL_VERSIONS, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: "The terms that apply to using this website.",
  path: "/legal/terms",
});

export default async function TermsPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || siteConfig.contact.email;

  return (
    <>
      <LegalHeader
        title="Terms of Use"
        version={LEGAL_VERSIONS.membershipTerms}
        summary="The terms that apply to this website. Membership itself is covered separately."
      />

      <h2>Who runs this site</h2>
      <p>
        This site is operated by {siteConfig.name}, {siteConfig.address.venue},{" "}
        {siteConfig.address.locality}, {siteConfig.address.postalCode}, Ireland.
        Contact us at {contact}.
      </p>

      <h2>Membership and bookings</h2>
      <p>
        Buying a membership is covered by our{" "}
        <Link href="/legal/membership-terms" className="underline underline-offset-4">
          membership terms
        </Link>
        , and cancelling either a membership or a session is covered by our{" "}
        <Link href="/legal/cancellation" className="underline underline-offset-4">
          cancellation policy
        </Link>
        . Where those documents conflict with this one, they take precedence for
        their own subject matter.
      </p>

      <h2>Your account</h2>
      <p>
        We sign you in by emailing a single-use link rather than using a
        password. Anyone with access to your email inbox can therefore sign in
        as you — please keep it secure, and tell us if you think someone else
        has used your account.
      </p>
      <p>
        Give us accurate details when you sign up. We rely on your email address
        to send booking confirmations and on your emergency contact if something
        happens on site.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>attempt to gain access to accounts or data that are not yours;</li>
        <li>
          interfere with the site&rsquo;s operation, including automated
          scraping or attempts to overload it;
        </li>
        <li>
          make bookings you do not intend to honour, or book to deny slots to
          others;
        </li>
        <li>submit false information, including on the health declaration.</li>
      </ul>

      <h2>Prices and availability</h2>
      <p>
        We take care to keep prices and availability accurate, but errors
        happen. If a clear pricing error means we cannot honour a purchase, we
        will contact you and offer a full refund rather than charging the wrong
        amount.
      </p>
      <p>
        Availability shown on the booking calendar is live at the time the page
        loads. A slot can be taken by someone else while you are deciding — a
        booking is only held once you begin payment, and confirmed once payment
        completes.
      </p>

      <h2>Content</h2>
      <p>
        The text, design, photography and code on this site belong to us or our
        licensors. You may not copy or reuse them commercially without our
        permission.
      </p>

      <h2>Availability of the site</h2>
      <p>
        We do not promise the site will always be available or error-free. We
        may suspend it for maintenance. If it is down, you can still contact us
        directly.
      </p>

      <h2>Health information</h2>
      <p>
        Anything on this site about training, sauna, ice baths or hot tubs is
        general information about our facilities. It is not medical advice and
        must not be treated as such. If you have a health condition, are
        pregnant, or are unsure whether something is suitable for you, speak to
        your GP or a qualified health professional.
      </p>

      <h2>Liability</h2>
      <p>
        Nothing here limits our liability for death or personal injury caused by
        our negligence, for fraud, or for anything else that cannot be limited
        under Irish law. Subject to that, we are not liable for indirect or
        consequential loss arising from your use of this site.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version number above changes when we do.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the law of Ireland, and the Irish courts
        have jurisdiction over any dispute.
      </p>
    </>
  );
}
