/**
 * Single source of truth for business facts that appear across the site.
 *
 * Anything marked PLACEHOLDER has not been supplied by the client yet. It is
 * deliberately obvious rather than invented, so nothing fictional can ship by
 * accident. Values that staff must be able to change without a deploy
 * (opening hours, contact details, social links) are ALSO mirrored into the
 * SiteSetting table and read through `src/lib/settings.ts`; this file is the
 * fallback and the seed source.
 */

export const BUSINESS_TIMEZONE = "Europe/Dublin";

type SiteConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  address: {
    venue: string;
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
    countryCode: string;
  };
  geo: { latitude: number; longitude: number };
  /** Empty string means "not supplied yet" — callers must guard before render. */
  contact: { email: string; phone: string };
  social: { instagram: string; facebook: string; tiktok: string };
  parking: { summary: string; detail: string };
};

export const siteConfig: SiteConfig = {
  name: "The W Gym & Sauna",
  shortName: "The W",
  tagline: "Train. Recover. Reset.",
  description:
    "A modern gym and recovery space at Wicklow Rugby Club built around stronger training, better recovery and a better community.",

  address: {
    venue: "Wicklow Rugby Club",
    street: "Wicklow Rugby Club",
    locality: "Wicklow",
    region: "County Wicklow",
    postalCode: "A67 EY02",
    country: "Ireland",
    countryCode: "IE",
  },

  /** Approximate coordinates for Wicklow Rugby Club, used for the map frame. */
  geo: {
    latitude: 52.9808,
    longitude: -6.0446,
  },

  contact: {
    /** PLACEHOLDER — awaiting the client's public enquiry address. */
    email: "hello@thewgym.ie",
    /** PLACEHOLDER — awaiting the client's public phone number. */
    phone: "",
  },

  social: {
    instagram: "https://www.instagram.com/thew_gymandsauna/",
    facebook: "",
    tiktok: "",
  },

  /** PLACEHOLDER — confirm with the club before publishing. */
  parking: {
    summary: "Free on-site parking at Wicklow Rugby Club.",
    detail:
      "Parking is shared with the club grounds and can be busy during fixtures and training nights.",
  },
};

/**
 * Opening hours in Europe/Dublin wall-clock time.
 * `null` means closed. These drive both the displayed hours and the default
 * seeded availability rules for the booking engine.
 */
export type DayHours = { open: string; close: string } | null;

export const openingHours: Record<Weekday, DayHours> = {
  monday: { open: "06:00", close: "21:00" },
  tuesday: { open: "06:00", close: "21:00" },
  wednesday: { open: "06:00", close: "21:00" },
  thursday: { open: "06:00", close: "21:00" },
  friday: { open: "06:00", close: "20:00" },
  saturday: { open: "08:00", close: "18:00" },
  sunday: { open: "09:00", close: "16:00" },
};

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** JS `getDay()` index for each weekday key (0 = Sunday). */
export const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Marks the hours above as unconfirmed. While true, the UI labels them as
 * indicative. Flip to false once the client signs them off.
 */
export const OPENING_HOURS_ARE_PROVISIONAL = true;

/** Version strings stamped onto TermsAcceptance records. Bump on any edit. */
export const LEGAL_VERSIONS = {
  membershipTerms: "2026-01",
  privacyPolicy: "2026-01",
  cancellationPolicy: "2026-01",
  healthDeclaration: "2026-01",
} as const;

/** Booking-side rules surfaced to members and enforced server-side. */
export const bookingPolicy = {
  /** Members may cancel free of charge up to this many hours before a session. */
  freeCancellationHours: 12,
  /** Whether members can move an existing booking to another slot. */
  allowReschedule: true,
  /** How long a slot is held while the customer completes payment. */
  holdMinutes: 15,
  /** Guests can book without an account. */
  allowGuestBooking: true,
} as const;
