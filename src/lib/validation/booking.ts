import { z } from "zod";

/**
 * Every server entry point validates through these schemas. Nothing that
 * affects price, capacity or time is trusted from the request body — the
 * client sends identifiers and a timestamp, and the server resolves the rest.
 */

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD form.");

export const availabilityQuerySchema = z.object({
  serviceSlug: z.string().min(1).max(80),
  from: dateKeySchema,
  days: z.coerce.number().int().min(1).max(31).default(7),
});

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(80, "That name is too long.");

const phoneSchema = z
  .string()
  .trim()
  .max(32, "That phone number is too long.")
  // Deliberately permissive: Irish, UK and international formats all differ,
  // and rejecting a valid number is worse than storing an odd one.
  .regex(/^[+0-9()\s-]*$/, "Enter a valid phone number.")
  .optional()
  .or(z.literal(""));

export const createBookingSchema = z.object({
  serviceSlug: z.string().min(1).max(80),
  /** ISO instant of the slot start. Validated against the generated grid. */
  startsAt: z.iso.datetime({ message: "Choose a valid time." }),
  guestCount: z.coerce.number().int().min(1).max(20),
  customerName: nameSchema,
  customerEmail: z.email("Enter a valid email address.").max(254),
  customerPhone: phoneSchema,
  /** Terms must be accepted; a false value fails rather than being ignored. */
  acceptTerms: z.literal(true, {
    message: "You need to accept the booking terms.",
  }),
  /** Optional and deliberately separate from acceptTerms (GDPR). */
  marketingOptIn: z.boolean().optional().default(false),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1).max(60),
  reason: z.string().trim().max(300).optional(),
});
