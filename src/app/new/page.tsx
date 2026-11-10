import type { Metadata } from "next";
import { NewDraw } from "@/components/NewDraw";

export const metadata: Metadata = { title: "New group", alternates: { canonical: "/new" } };

export default function Page() {
  return <NewDraw />;
}
