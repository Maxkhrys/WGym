import { signOut } from "@/lib/auth/config";

/**
 * Sign-out as a form POST rather than a link.
 *
 * A GET link would let any page trigger a sign-out by embedding it (and could
 * be prefetched into an accidental logout). A form submit goes through
 * Auth.js's own CSRF-protected action.
 */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="u-tap inline-flex items-center rounded-full px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:text-bone"
      >
        Sign out
      </button>
    </form>
  );
}
