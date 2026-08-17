import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Public routes only.
 *
 * Account, admin, signin and the post-payment confirmation pages are
 * deliberately absent — they are per-user, noindex, and listing them would
 * invite crawlers to hammer dynamic routes for nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, frequency: "monthly" },
    { path: "/gym", priority: 0.9, frequency: "monthly" },
    { path: "/sauna", priority: 0.9, frequency: "monthly" },
    { path: "/memberships", priority: 0.9, frequency: "monthly" },
    { path: "/sauna/book", priority: 0.8, frequency: "daily" },
    { path: "/signup", priority: 0.8, frequency: "monthly" },
    { path: "/facilities", priority: 0.7, frequency: "monthly" },
    { path: "/about", priority: 0.6, frequency: "yearly" },
    { path: "/contact", priority: 0.6, frequency: "yearly" },
    { path: "/legal/privacy", priority: 0.2, frequency: "yearly" },
    { path: "/legal/cookies", priority: 0.2, frequency: "yearly" },
    { path: "/legal/terms", priority: 0.2, frequency: "yearly" },
    { path: "/legal/membership-terms", priority: 0.3, frequency: "yearly" },
    { path: "/legal/cancellation", priority: 0.3, frequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified: now,
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
