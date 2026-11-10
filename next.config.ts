import type { NextConfig } from "next";

/**
 * What a page may load, and where it may send anything: this site only. Next.js writes each page's
 * data into the page as inline scripts, and most pages here are built ahead of time, so there is no
 * per-visit code to mark them with: inline scripts stay allowed, and so do the inline styles the
 * animations use. What this adds is that nothing can be loaded from, sent to or framed by another site.
 * React's development tools need eval; the built site doesn't get it.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // data: is the paper grain in the stylesheet, and the QR code.
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      { source: "/lights.webp", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
      // Every page shows a few stickers. Without this a browser asks about each one again on every visit.
      { source: "/stickers/:file", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // On pages, not on the scripts, fonts and pictures a page loads: those have no use for these two,
        // and thirty files each carrying them is thirty times the weight.
        source: "/((?!_next/static/|stickers/|lights\\.webp$).*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          // The site uses none of these, so nothing running on it can ask for them.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
