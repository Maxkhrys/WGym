/**
 * Seed catalogue for membership plans and sauna services.
 *
 * ── PRICES ARE PROVISIONAL ────────────────────────────────────────────────
 * Every amount below is a structural placeholder so the purchase and booking
 * flows are testable end to end. None of it is business data. The live values
 * are edited in /admin (which writes to the database) — this file only ever
 * supplies the initial seed. `PRICING_IS_PROVISIONAL` drives a visible notice
 * in the UI and should be flipped to false once the client signs off.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const PRICING_IS_PROVISIONAL = true;

export type SeedPlan = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  interval: "MONTH" | "YEAR" | "ONE_TIME";
  joiningFeeCents: number;
  features: string[];
  minimumTermMonths: number;
  cancellationNotice: string | null;
  cancellationPolicy: string | null;
  isDayPass: boolean;
  sortOrder: number;
};

export const seedPlans: SeedPlan[] = [
  {
    slug: "monthly",
    name: "Monthly",
    tagline: "Full access, rolling",
    description:
      "Unlimited gym access on a rolling monthly membership. Cancel with one month's notice.",
    priceCents: 4500,
    interval: "MONTH",
    joiningFeeCents: 0,
    features: [
      "Unlimited gym access during opening hours",
      "Full strength, free weight and cardio floor",
      "Member rate on sauna and recovery sessions",
      "Rolling monthly — no fixed term",
    ],
    minimumTermMonths: 0,
    cancellationNotice: "One full month's notice",
    cancellationPolicy:
      "Cancel any time from your account. Access continues to the end of the paid period.",
    isDayPass: false,
    sortOrder: 10,
  },
  {
    slug: "student",
    name: "Student",
    tagline: "Reduced rate, valid ID",
    description:
      "The same full access at a reduced rate for students in full-time education.",
    priceCents: 3500,
    interval: "MONTH",
    joiningFeeCents: 0,
    features: [
      "Unlimited gym access during opening hours",
      "Full strength, free weight and cardio floor",
      "Member rate on sauna and recovery sessions",
      "Valid student ID required at first visit",
    ],
    minimumTermMonths: 0,
    cancellationNotice: "One full month's notice",
    cancellationPolicy:
      "Cancel any time from your account. Access continues to the end of the paid period.",
    isDayPass: false,
    sortOrder: 20,
  },
  {
    slug: "day-pass",
    name: "Day Pass",
    tagline: "One visit, no commitment",
    description:
      "Single-day access to the gym floor. Useful if you are visiting or trying the place out.",
    priceCents: 1000,
    interval: "ONE_TIME",
    joiningFeeCents: 0,
    features: [
      "One full day of gym access",
      "No membership or direct debit",
      "Redeemable during staffed hours",
    ],
    minimumTermMonths: 0,
    cancellationNotice: null,
    cancellationPolicy: "Day passes are non-refundable once redeemed.",
    isDayPass: true,
    sortOrder: 30,
  },
];

export type SeedService = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  capacity: number;
  maxGuestsPerBooking: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  isExclusive: boolean;
  sortOrder: number;
};

export const seedServices: SeedService[] = [
  {
    slug: "sauna-session",
    name: "Sauna Session",
    tagline: "Heat, on your own time",
    description:
      "A booked slot in the sauna. Arrive a few minutes early, bring a towel, and take it at your own pace.",
    durationMinutes: 45,
    bufferMinutes: 15,
    priceCents: 1500,
    capacity: 6,
    maxGuestsPerBooking: 4,
    minNoticeMinutes: 120,
    maxAdvanceDays: 45,
    isExclusive: false,
    sortOrder: 10,
  },
  {
    slug: "sauna-ice-bath",
    name: "Sauna + Ice Bath",
    tagline: "Hot and cold, in sequence",
    description:
      "A longer slot with access to both the sauna and the ice bath so you can move between the two.",
    durationMinutes: 60,
    bufferMinutes: 15,
    priceCents: 2200,
    capacity: 4,
    maxGuestsPerBooking: 4,
    minNoticeMinutes: 120,
    maxAdvanceDays: 45,
    isExclusive: false,
    sortOrder: 20,
  },
  {
    slug: "sweat-and-reset",
    name: "Sweat and Reset",
    tagline: "The full recovery round",
    description:
      "The full circuit — sauna, ice bath and hot tub — with time to work through it properly rather than rushing.",
    durationMinutes: 90,
    bufferMinutes: 20,
    priceCents: 3000,
    capacity: 4,
    maxGuestsPerBooking: 4,
    minNoticeMinutes: 180,
    maxAdvanceDays: 45,
    isExclusive: false,
    sortOrder: 30,
  },
  {
    slug: "private-session",
    name: "Private Session",
    tagline: "The space to yourselves",
    description:
      "Exclusive hire of the recovery area for you and your group. Nobody else is booked into the slot.",
    durationMinutes: 90,
    bufferMinutes: 30,
    priceCents: 9000,
    capacity: 8,
    maxGuestsPerBooking: 8,
    minNoticeMinutes: 1440,
    maxAdvanceDays: 90,
    isExclusive: true,
    sortOrder: 40,
  },
];

export type SeedTrainer = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  qualifications: string[];
  specialties: string[];
  isFounder: boolean;
  sortOrder: number;
};

export const seedTrainers: SeedTrainer[] = [
  {
    slug: "josh-watson",
    name: "Josh Watson",
    role: "Founder & Personal Trainer",
    bio: "Josh founded The W to give Wicklow a place that takes both halves of training seriously — the work on the floor and the recovery that makes it count. He coaches members one to one, from first sessions through to long-term strength work.",
    // PLACEHOLDER — awaiting Josh's actual certifications. Nothing is invented
    // here; the array stays empty until the client supplies them, and the UI
    // omits the block rather than showing filler.
    qualifications: [],
    specialties: ["Strength training", "Beginners", "Return to training"],
    isFounder: true,
    sortOrder: 10,
  },
];
