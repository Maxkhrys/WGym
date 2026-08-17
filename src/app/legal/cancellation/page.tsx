import { LegalHeader } from "@/components/legal/LegalHeader";
import { LEGAL_VERSIONS, bookingPolicy, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Cancellation Policy",
  description:
    "How to cancel a membership or a recovery booking at The W Gym & Sauna.",
  path: "/legal/cancellation",
});

export default async function CancellationPage() {
  const settings = await getSettings();
  const contact = settings.contactEmail || siteConfig.contact.email;

  return (
    <>
      <LegalHeader
        title="Cancellation Policy"
        version={LEGAL_VERSIONS.cancellationPolicy}
        summary="How to cancel a membership or a booked session, and what happens to your money."
      />

      <h2>Cancelling a membership</h2>
      <p>
        Cancel from your account at any time. You will not be charged again
        after that, and your access continues until the end of the period you
        have already paid for.
      </p>
      <ul>
        <li>
          If your plan has a notice period, it runs from the date you cancel.
        </li>
        <li>
          If your plan has a minimum term, you can cancel within it but remain
          liable for the payments due to the end of that term.
        </li>
        <li>
          We do not refund part months. Your membership simply stops renewing.
        </li>
      </ul>
      <p>
        If you cannot access your account, email {contact} from the address on
        your membership and we will cancel it for you. We treat the date we
        receive that email as the cancellation date.
      </p>

      <h2>Cancelling a recovery booking</h2>
      <p>
        You can cancel a sauna or recovery session yourself, free of charge, up
        to {bookingPolicy.freeCancellationHours} hours before it starts. Your
        slot is released immediately and refunded to the card you paid with.
      </p>
      <p>
        Inside {bookingPolicy.freeCancellationHours} hours the online
        cancellation button is disabled, because the slot can no longer
        realistically be offered to anyone else. Contact us and we will do what
        we can —{" "}
        {bookingPolicy.allowReschedule
          ? "we can often move you to another time, though we cannot promise it."
          : "though the session is normally non-refundable at that point."}
      </p>

      <h2>If you do not turn up</h2>
      <p>
        A session you do not attend and did not cancel is not refunded. Your
        slot was held for you and could not be used by anyone else.
      </p>

      <h2>Late arrival</h2>
      <p>
        Sessions run to their booked end time so the next booking is not pushed
        back. Arriving late shortens your session rather than extending it, and
        does not entitle you to a refund.
      </p>

      <h2>If we cancel</h2>
      <p>
        If we have to cancel a session — equipment failure, an unplanned
        closure, anything on our side — you get a full refund or a session at
        another time, whichever you prefer. We will contact you as soon as we
        know.
      </p>

      <h2>Day passes</h2>
      <p>
        Day passes are refundable until they are redeemed. Once used, they are
        not refundable.
      </p>

      <h2>Your statutory rights</h2>
      <p>
        Nothing in this policy affects your rights under Irish consumer law.
        Note that the 14-day cooling-off period for online purchases does not
        apply to leisure services booked for a specific date, which is standard
        for bookings of this kind.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the card used for the original payment. They usually
        appear within a few working days, depending on your bank. We cannot
        refund to a different card or by another method.
      </p>

      <h2>Questions</h2>
      <p>Email {contact} and we will sort it out.</p>
    </>
  );
}
