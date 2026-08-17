export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { label: "Gym", href: "/gym", description: "Strength, functional and cardio" },
  {
    label: "Sauna & Recovery",
    href: "/sauna",
    description: "Sauna, ice baths and hot tub",
  },
  { label: "Memberships", href: "/memberships", description: "Plans and pricing" },
  { label: "Facilities", href: "/facilities", description: "What's on site" },
  { label: "About", href: "/about", description: "The W and the team" },
  { label: "Contact", href: "/contact", description: "Find us and get in touch" },
];

export const footerNav = {
  visit: [
    { label: "Gym", href: "/gym" },
    { label: "Sauna & Recovery", href: "/sauna" },
    { label: "Facilities", href: "/facilities" },
    { label: "Personal Training", href: "/gym#personal-training" },
  ],
  join: [
    { label: "Memberships", href: "/memberships" },
    { label: "Join the gym", href: "/signup" },
    { label: "Book a session", href: "/sauna/book" },
    { label: "My account", href: "/account" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Opening hours", href: "/contact#hours" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Membership Terms", href: "/legal/membership-terms" },
    { label: "Cancellation Policy", href: "/legal/cancellation" },
  ],
} as const;

/**
 * Routes that show the persistent mobile action bar. These are the pages where
 * a visitor is deciding, so a thumb-reachable CTA earns its space; elsewhere it
 * would just cover content.
 */
export const MOBILE_CTA_ROUTES = ["/", "/gym", "/sauna", "/memberships", "/facilities"];
