import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Real photography will be dropped into /public/media as local files, so
    // no remote patterns are needed yet. Add them here rather than the
    // deprecated `images.domains` when a CDN is introduced.
    formats: ["image/avif", "image/webp"],
  },
  // three.js and its examples ship untranspiled ESM that is cheaper to bundle
  // on the server than to externalise.
  transpilePackages: ["three"],
  experimental: {
    // Prerendering runs across parallel worker processes and each one opens
    // its own database connection pool, so a build briefly wants many more
    // connections than the running site does. Against a database with a small
    // connection ceiling that can drop a connection mid-query and fail the
    // whole build over one transient page.
    //
    // Retrying a failed page once absorbs that without hiding a genuine error:
    // a page that is actually broken still fails on the retry. Make sure the
    // production database allows a comfortable number of connections
    // (DATABASE_POOL_MAX × build workers) rather than relying on this.
    staticGenerationRetryCount: 1,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
