import type { Metadata } from "next";
import { Home } from "@/components/Home";
import { OPEN_GRAPH } from "@/lib/site";

// The one address for this page, however a visitor's link was written.
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { ...OPEN_GRAPH, url: "/" } };

export default function Page() {
  return <Home />;
}
