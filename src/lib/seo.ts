import type { Metadata } from "next";

import { openingHours, siteConfig, WEEKDAY_ORDER } from "@/config/site";

import { SITE_URL } from "@/lib/site-url";

/**
 * Builds page metadata from a short description of the page. Titles are
 * templated in the root layout, so pass the bare page title here.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_IE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${siteConfig.name}`,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

const SCHEMA_DAY: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * LocalBusiness graph for the venue.
 *
 * `HealthClub` and `SportsActivityLocation` are both valid schema.org types
 * for this business and are declared together as an array, which is legal
 * JSON-LD and describes the site more completely than either alone. Fields
 * that are still placeholders (phone) are omitted rather than emitted empty —
 * an empty telephone is worse than none for local SEO.
 */
export function localBusinessSchema() {
  const openingHoursSpecification = WEEKDAY_ORDER.filter(
    (day) => openingHours[day] !== null,
  ).map((day) => {
    const hours = openingHours[day]!;
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAY[day]}`,
      opens: hours.open,
      closes: hours.close,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": ["HealthClub", "SportsActivityLocation", "LocalBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: SITE_URL,
    ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    openingHoursSpecification,
    ...(siteConfig.social.instagram ? { sameAs: [siteConfig.social.instagram] } : {}),
    amenityFeature: [
      "Gym",
      "Sauna",
      "Ice Baths",
      "Hot Tub",
      "Personal Training",
      "Changing Facilities",
      "Free Parking",
    ].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
  };
}
