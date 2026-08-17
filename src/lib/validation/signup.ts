import { z } from "zod";

const MIN_AGE_YEARS = 16;

/** Date of birth as a calendar date, validated for plausibility and minimum age. */
const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return date.getTime() <= Date.now();
  }, "Date of birth cannot be in the future.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - MIN_AGE_YEARS);
    return date.getTime() <= cutoff.getTime();
  }, `You need to be at least ${MIN_AGE_YEARS} to join online. Please contact us instead.`)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 120);
    return date.getTime() >= cutoff.getTime();
  }, "Please check that date.");

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Enter a contact number.")
  .max(32, "That phone number is too long.")
  .regex(/^[+0-9()\s-]+$/, "Enter a valid phone number.");

/**
 * The whole signup, validated in one place.
 *
 * The client walks through it in steps, but the server never trusts the step
 * it claims to be on — the complete object is validated on submit, so a
 * request that skips the health acknowledgement or the membership agreement is
 * rejected regardless of what the UI did.
 */
export const signupSchema = z.object({
  planSlug: z.string().min(1, "Choose a membership.").max(80),

  // Step 2 — account
  firstName: z.string().trim().min(1, "Enter your first name.").max(60),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60),
  email: z.email("Enter a valid email address.").max(254),
  phone: phoneSchema,
  dateOfBirth: dateOfBirthSchema,

  // Step 3 — emergency contact
  emergencyName: z.string().trim().min(2, "Enter a contact name.").max(80),
  emergencyRelationship: z.string().trim().max(60).optional().or(z.literal("")),
  emergencyPhone: phoneSchema,

  // Step 4 — health acknowledgement.
  // A self-declaration only. The site gives no medical advice and makes no
  // assessment; this records that the member confirmed the statement.
  healthAcknowledged: z.literal(true, {
    message: "Please confirm the health declaration.",
  }),

  // Step 5 — agreement
  acceptMembershipTerms: z.literal(true, {
    message: "You need to accept the membership terms.",
  }),
  acceptPrivacyPolicy: z.literal(true, {
    message: "You need to accept the privacy policy.",
  }),

  // Optional, and deliberately never bundled with the required boxes above.
  marketingOptIn: z.boolean().optional().default(false),
});

export type SignupInput = z.infer<typeof signupSchema>;

/** Per-step field lists, so the client can validate progressively. */
export const SIGNUP_STEP_FIELDS = {
  2: ["firstName", "lastName", "email", "phone", "dateOfBirth"],
  3: ["emergencyName", "emergencyRelationship", "emergencyPhone"],
  4: ["healthAcknowledged"],
  5: ["acceptMembershipTerms", "acceptPrivacyPolicy", "marketingOptIn"],
} as const satisfies Record<number, readonly (keyof SignupInput)[]>;
