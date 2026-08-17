"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { signIn } from "@/lib/auth/config";
import { clientKey, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export type SignInState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

const schema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  callbackUrl: z.string().optional(),
});

export async function requestSignInLink(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  const limit = rateLimit(
    clientKey(await headers(), "signin"),
    RATE_LIMITS.auth,
  );

  if (!limit.success) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  // Only ever redirect within this site.
  const callbackUrl =
    parsed.data.callbackUrl &&
    parsed.data.callbackUrl.startsWith("/") &&
    !parsed.data.callbackUrl.startsWith("//")
      ? parsed.data.callbackUrl
      : "/account";

  try {
    await signIn("resend", { email, redirect: false, redirectTo: callbackUrl });
  } catch (error) {
    console.error("Sign-in request failed:", error);
    // Deliberately vague. Reporting whether the address exists would let an
    // attacker enumerate the membership list.
    return {
      status: "error",
      message: "We could not send that link. Please try again shortly.",
    };
  }

  return { status: "sent", email };
}
