import { LegalHeader } from "@/components/legal/LegalHeader";
import { LEGAL_VERSIONS, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Membership Terms",
  description: "The terms that apply to gym membership at The W Gym & Sauna.",
  path: "/legal/membership-terms",
});

export default async function MembershipTermsPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || siteConfig.contact.email;

  return (
    <>
      <LegalHeader
        title="Membership Terms"
        version={LEGAL_VERSIONS.membershipTerms}
        summary="What you agree to when you join, and what we commit to in return."
      />

      <h2>1. Your membership</h2>
      <p>
        Your membership is personal to you and cannot be transferred or shared.
        Access is for you alone, using the member code issued to your account.
        We may end a membership without refund if the code is shared or if
        access is misused.
      </p>
      <p>
        The membership you chose, its price, its minimum term and the notice
        needed to cancel were shown to you before payment and are recorded on
        your account.
      </p>

      <h2>2. Payment</h2>
      <p>
        Recurring memberships are collected automatically by card through
        Stripe, on the same date each period, until cancelled. Day passes are a
        single payment.
      </p>
      <p>
        If a payment fails we will retry it and your membership will show as
        past due. If it remains unpaid, access may be suspended until it is
        settled. Please keep your card details up to date in the billing portal.
      </p>

      <h2>3. Price changes</h2>
      <p>
        We may change membership prices. If we do, we will give existing members
        at least 30 days&rsquo; notice by email before the new price applies,
        and you may cancel before it takes effect.
      </p>

      <h2>4. Cancelling</h2>
      <p>
        You can cancel from your account at any time, subject to any minimum
        term and the notice period shown on your plan. Your access continues to
        the end of the period you have already paid for. We do not refund part
        periods.
      </p>
      <p>
        Full detail is in our cancellation policy, which forms part of these
        terms.
      </p>

      <h2>5. Using the facilities</h2>
      <ul>
        <li>Use equipment as intended, and ask if you are unsure how.</li>
        <li>Return weights and equipment after use.</li>
        <li>Wear appropriate clothing and clean indoor footwear.</li>
        <li>Follow reasonable instructions from staff.</li>
        <li>Do not train under the influence of alcohol or drugs.</li>
        <li>
          Behave in a way that lets others train — abusive, threatening or
          intimidating behaviour ends a membership immediately.
        </li>
      </ul>

      <h2>6. Your health</h2>
      <p>
        You confirmed a health declaration when you joined. You use the gym and
        recovery facilities at your own pace and your own risk. We are not
        qualified to give medical advice and do not assess your fitness to
        train. If your health changes in a way that might affect your safety
        here, please tell us and speak to your GP.
      </p>

      <h2>7. Opening hours and availability</h2>
      <p>
        Opening hours are published on this site and may change. We may close
        the facility, or parts of it, for maintenance, staff training, private
        events or reasons outside our control. Where a closure is planned we
        will give as much notice as we reasonably can.
      </p>
      <p>
        The gym sits within {siteConfig.address.venue}, and access to the wider
        grounds and parking is shared with the club.
      </p>

      <h2>8. Your belongings</h2>
      <p>
        Lockers are provided for use during your visit. Please do not leave
        anything overnight. We are not responsible for loss or damage to
        personal property except where caused by our negligence.
      </p>

      <h2>9. Our liability</h2>
      <p>
        Nothing in these terms limits our liability for death or personal injury
        caused by our negligence, for fraud, or for anything else that cannot be
        limited under Irish law. Subject to that, we are not liable for indirect
        or consequential loss.
      </p>

      <h2>10. Ending a membership</h2>
      <p>
        We may end a membership immediately for a serious or repeated breach of
        these terms. Where we do, we will explain why in writing. We may also
        end a membership by giving one month&rsquo;s notice and refunding any
        period paid for beyond that.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        If we change these terms we will publish the new version here with a new
        version number, and tell members by email where the change is
        significant.
      </p>

      <h2>12. Law</h2>
      <p>
        These terms are governed by the law of Ireland, and the Irish courts
        have jurisdiction over any dispute.
      </p>

      <h2>Questions</h2>
      <p>Email {contact} and we will come back to you.</p>
    </>
  );
}
