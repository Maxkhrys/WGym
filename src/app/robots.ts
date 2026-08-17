import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private and transactional routes. These are also noindex at the page
        // level; disallowing here keeps crawlers from spending budget on them
        // in the first place.
        disallow: [
          "/account",
          "/account/",
          "/admin",
          "/admin/",
          "/signin",
          "/signin/",
          "/api/",
          "/signup/complete",
          "/sauna/book/confirmed",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
