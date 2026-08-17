import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { localBusinessSchema } from "@/lib/seo";

import "./globals.css";

// Manrope carries the editorial headlines; Inter handles UI and body copy
// where its larger x-height reads better at small sizes. Both are subset to
// latin and served from our own origin by next/font, so there is no
// third-party request and no layout shift on first paint.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — Gym, Sauna & Recovery in Wicklow`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // Every other page sets its own canonical via buildMetadata; the homepage
  // inherits from here, so without this it would have none.
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_IE",
    siteName: siteConfig.name,
    url: SITE_URL,
    title: `${siteConfig.name} — Gym, Sauna & Recovery in Wicklow`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Gym, Sauna & Recovery in Wicklow`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07090a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom — capping it fails WCAG 1.4.4.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IE"
      // Opts back into Next's scroll-behaviour override so route changes jump
      // instantly while in-page anchors still glide.
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-ink antialiased">
        <a href="#main" className="u-sr-only left-4 top-4 z-[100] rounded-full bg-mint px-5 py-3 text-ink">
          Skip to content
        </a>

        <Header />

        <main id="main" tabIndex={-1}>
          {children}
        </main>

        <Footer />
        <MobileActionBar />

        <JsonLd data={localBusinessSchema()} />
      </body>
    </html>
  );
}
