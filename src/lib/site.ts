/** Absolute base URL for metadata / Open Graph images. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * What every page's link preview says about the site itself. A page that sets its own Open Graph
 * details replaces the layout's whole set, so each one starts from this. (It replaces the layout's
 * preview image too, unless the page has an opengraph-image of its own beside it.)
 */
export const OPEN_GRAPH = { siteName: "Secret Santa", type: "website" } as const;
