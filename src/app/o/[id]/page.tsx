import type { Metadata } from "next";
import { Suspense } from "react";
import { Organiser } from "@/components/Organiser";

export const metadata: Metadata = { title: "Organiser", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <Organiser id={id} />
    </Suspense>
  );
}
