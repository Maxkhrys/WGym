import { LegalHeader } from "@/components/legal/LegalHeader";
import { LEGAL_VERSIONS, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Cookie Policy",
  description: "The cookies this site uses, and why there is no cookie banner.",
  path: "/legal/cookies",
});

export default async function CookiesPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || siteConfig.contact.email;

  return (
    <>
      <LegalHeader
        title="Cookie Policy"
        version={LEGAL_VERSIONS.privacyPolicy}
        summary="This site uses only strictly necessary cookies, which is why you are not asked to consent to any."
      />

      <h2>Why there is no cookie banner</h2>
      <p>
        Under the ePrivacy Regulations, consent is required for cookies that are
        not strictly necessary — analytics, advertising and tracking. This site
        sets none of those. Asking you to accept cookies we do not use would be
        theatre, so we do not.
      </p>
      <p>
        If we ever add analytics or any other non-essential cookie, a consent
        banner will appear before it is set, and nothing will be stored on your
        device until you agree.
      </p>

      <h2>The cookies we do set</h2>
      <ul>
        <li>
          <strong>Session cookie</strong> — set after you sign in, so the site
          knows it is you on the next page. Deleted when it expires or when you
          sign out. Without it you could not stay signed in.
        </li>
        <li>
          <strong>CSRF token</strong> — a short-lived value that proves a form
          submission came from this site and not from somewhere else. It
          protects your account from being acted on without your knowledge.
        </li>
        <li>
          <strong>Callback cookie</strong> — remembers which page you were
          heading to when you were asked to sign in, so you land back there
          afterwards. It is cleared immediately after use.
        </li>
      </ul>
      <p>
        All three are strictly necessary for a members&rsquo; area to function,
        and none of them track you across other websites.
      </p>

      <h2>Cookies set by others</h2>
      <p>
        When you pay, you are taken to Stripe&rsquo;s own checkout page. Stripe
        sets its own cookies there, under its own policy, to process the payment
        and prevent fraud. That happens on Stripe&rsquo;s domain, not ours.
      </p>
      <p>
        Our location map is embedded from OpenStreetMap, which we chose in part
        because it does not set advertising or tracking cookies.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can block or delete cookies in your browser settings. Blocking the
        cookies listed above will stop you from being able to sign in or manage
        your bookings, since there would be no way for the site to recognise you
        between pages.
      </p>

      <h2>Questions</h2>
      <p>If anything here is unclear, email {contact} and we will explain.</p>
    </>
  );
}
