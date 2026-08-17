import { openBillingPortal } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";

/**
 * Posts to a server action that mints a fresh Stripe Customer Portal session.
 *
 * Deliberately not a link: portal URLs are single-use and short-lived, so one
 * has to be created per click rather than rendered into the page.
 */
export function BillingPortalButton() {
  return (
    <form action={openBillingPortal}>
      <Button type="submit" variant="secondary">
        Manage subscription &amp; invoices
      </Button>
    </form>
  );
}
