import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Search engines may read the pages; the API has nothing for them. Groups are not shut out here: their
 * pages say "noindex" themselves, and a chat app has to be able to fetch one to draw its invite card.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${siteUrl()}/sitemap.xml` };
}
