import type { MetadataRoute } from "next";

/**
 * What a phone uses when the site is added to its home screen: the name, the maroon of the page's
 * edges, and the gift on it. iPhones read apple-icon.png beside this file instead, and open the site
 * full screen already (appleWebApp in the layout), so Android does the same here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Secret Santa",
    short_name: "Secret Santa",
    description: "Draw names for your gift exchange. Share one link and everyone joins.",
    start_url: "/",
    display: "standalone",
    background_color: "#451f19",
    theme_color: "#451f19",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // The gift kept inside the circle Android may cut a maskable icon to.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
