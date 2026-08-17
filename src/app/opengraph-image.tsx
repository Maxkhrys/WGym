import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

/**
 * Default social sharing image.
 *
 * Generated rather than designed as a static file so it stays in step with the
 * brand tokens and never has to be re-exported by hand. Individual pages can
 * add their own `opengraph-image` file to override this one.
 *
 * Uses the platform font stack rather than fetching Manrope: an OG image is
 * rendered on demand at the edge, and a font fetch is both a latency cost and
 * a failure mode for something that must always produce an image.
 */
export const alt = `${siteConfig.name} — gym, sauna and recovery in Wicklow`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07090a",
          padding: "72px",
          position: "relative",
        }}
      >
        {/* Cool teal wash from the top left, echoing the site's hero. */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -150,
            width: 900,
            height: 700,
            background:
              "radial-gradient(circle, rgba(63,125,121,0.55) 0%, rgba(63,125,121,0.12) 45%, rgba(7,9,10,0) 70%)",
            display: "flex",
          }}
        />
        {/* Warm sauna glow, deeper and smaller. */}
        <div
          style={{
            position: "absolute",
            bottom: -220,
            right: -160,
            width: 760,
            height: 620,
            background:
              "radial-gradient(circle, rgba(194,112,60,0.42) 0%, rgba(194,112,60,0.1) 45%, rgba(7,9,10,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#62a8a2",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#9aa8a5",
              display: "flex",
            }}
          >
            The W · Gym &amp; Sauna
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 118,
              lineHeight: 1,
              letterSpacing: -4,
              color: "#eef2f0",
              fontWeight: 600,
              display: "flex",
            }}
          >
            Train. Recover. Reset.
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              color: "#9aa8a5",
              maxWidth: 900,
              display: "flex",
            }}
          >
            A modern gym and recovery space at Wicklow Rugby Club.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #1e2728",
            paddingTop: 28,
            fontSize: 26,
            color: "#6b7876",
          }}
        >
          <div style={{ display: "flex" }}>
            {siteConfig.address.venue}, {siteConfig.address.postalCode}
          </div>
          <div style={{ display: "flex", color: "#62a8a2" }}>
            Gym · Sauna · Ice Baths · Hot Tub
          </div>
        </div>
      </div>
    ),
    size,
  );
}
