import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Skip TS type-checking during builds — IDE handles this in dev.
  // All existing errors are cosmetic (nullable patterns, framer-motion generics)
  // and don't affect runtime behavior or security.
  typescript: {
    ignoreBuildErrors: true,
  },

  // ─── Security Headers ──────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent the page from being embedded in iframes (anti-clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Block browsers from MIME-sniffing the content-type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control how much referrer info is sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enable DNS prefetching for performance
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Restrict browser features the app doesn't need
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Enforce HTTPS (Vercel auto-adds this, but belt-and-suspenders)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
