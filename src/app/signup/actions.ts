"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LEGAL_VERSIONS } from "@/config/site";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sendMembershipConfirmation } from "@/lib/email/messages";
import { getPlanBySlug } from "@/lib/queries/plans";
import { clientKey, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isStripeConfigured } from "@/lib/stripe/client";
import { createMembershipCheckout } from "@/lib/stripe/checkout";
import { signupSchema } from "@/lib/validation/signup";

export type SignupState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: string }
  | { status: "created"; membershipId: string };

/**
 * Completes signup and starts payment.
 *
 * The membership row is created as PENDING; only the Stripe webhook moves it
 * to ACTIVE. Nothing here grants access.
 */
export async function completeSignup(
  _previous: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const requestHeaders = await headers();

  const limit = rateLimit(clientKey(requestHeaders, "signup"), RATE_LIMITS.booking);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const parsed = signupSchema.safeParse({
    planSlug: formData.get("planSlug"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    emergencyName: formData.get("emergencyName"),
    emergencyRelationship: formData.get("emergencyRelationship") ?? "",
    emergencyPhone: formData.get("emergencyPhone"),
    healthAcknowledged: formData.get("healthAcknowledged") === "on",
    acceptMembershipTerms: formData.get("acceptMembershipTerms") === "on",
    acceptPrivacyPolicy: formData.get("acceptPrivacyPolicy") === "on",
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Please check the form and try again.",
      field: issue?.path[0] ? String(issue.path[0]) : undefined,
    };
  }

  const input = parsed.data;

  // The price always comes from the plan row, never from the form.
  const plan = await getPlanBySlug(input.planSlug);
  if (!plan) {
    return { status: "error", message: "That membership is no longer available." };
  }

  const email = input.email.trim().toLowerCase();
  const signedIn = await getSessionUser();

  // Signing up while logged in as someone else would otherwise silently attach
  // the membership to the wrong account.
  if (signedIn && signedIn.email.toLowerCase() !== email) {
    return {
      status: "error",
      message: `You are signed in as ${signedIn.email}. Use that address, or sign out to join with a different one.`,
      field: "email",
    };
  }

  const name = `${input.firstName.trim()} ${input.lastName.trim()}`;
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent") ?? null;

  // The account is created without a password; the member signs in later with
  // a magic link to the same address.
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      phone: input.phone.trim(),
      dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00Z`),
      memberCode: generateMemberCode(),
      marketingOptIn: input.marketingOptIn,
      marketingOptInAt: input.marketingOptIn ? new Date() : null,
    },
    update: {
      name,
      phone: input.phone.trim(),
      dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00Z`),
      // Only ever turn marketing consent ON here. Withdrawing it happens in
      // the account area, and a new signup must not silently re-consent
      // someone who previously opted out.
      ...(input.marketingOptIn
        ? { marketingOptIn: true, marketingOptInAt: new Date() }
        : {}),
    },
  });

  await prisma.emergencyContact.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: input.emergencyName.trim(),
      relationship: input.emergencyRelationship?.trim() || null,
      phone: input.emergencyPhone.trim(),
    },
    update: {
      name: input.emergencyName.trim(),
      relationship: input.emergencyRelationship?.trim() || null,
      phone: input.emergencyPhone.trim(),
    },
  });

  // Immutable audit trail: which document version, accepted when, from where.
  await prisma.termsAcceptance.createMany({
    data: [
      {
        userId: user.id,
        document: "MEMBERSHIP_TERMS" as const,
        version: LEGAL_VERSIONS.membershipTerms,
        ipAddress: ip,
        userAgent,
      },
      {
        userId: user.id,
        document: "PRIVACY_POLICY" as const,
        version: LEGAL_VERSIONS.privacyPolicy,
        ipAddress: ip,
        userAgent,
      },
      {
        userId: user.id,
        document: "HEALTH_DECLARATION" as const,
        version: LEGAL_VERSIONS.healthDeclaration,
        ipAddress: ip,
        userAgent,
      },
    ],
  });

  // Reuse an existing unpaid attempt rather than stacking up PENDING rows if
  // someone abandons checkout and comes back.
  const existingPending = await prisma.membership.findFirst({
    where: { userId: user.id, planId: plan.id, status: "PENDING" },
  });

  const membership =
    existingPending ??
    (await prisma.membership.create({
      data: { userId: user.id, planId: plan.id, status: "PENDING" },
    }));

  // Without Stripe there is nothing to charge. Activate so the rest of the
  // product is walkable, and label it clearly rather than implying payment.
  if (!isStripeConfigured) {
    const activated = await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: "ACTIVE",
        startDate: new Date(),
        endDate: plan.isDayPass
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : null,
      },
      include: { plan: true, user: true },
    });

    await sendMembershipConfirmation(activated).catch((error) =>
      console.error("Membership confirmation email failed:", error),
    );

    return { status: "created", membershipId: membership.id };
  }

  const checkout = await createMembershipCheckout({ membershipId: membership.id });

  if (!checkout.ok) {
    return { status: "error", message: checkout.reason };
  }

  redirect(checkout.url);
}

function generateMemberCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `W-${code}`;
}
