import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

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
