import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** The two pages meant to be found. Groups are private and never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl()}/` }, { url: `${siteUrl()}/new` }];
}
