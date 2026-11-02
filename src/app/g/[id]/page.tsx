import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemberApp } from "@/components/MemberApp";
import { getPublicGroup } from "@/lib/server/groups";

type Props = { params: Promise<{ id: string }> };

// The title and the page both need the group: one database read for both.
const loadGroup = cache(getPublicGroup);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await loadGroup((await params).id);
  if (!group) return { title: "Not found", robots: { index: false } };
  // Printed beside the invite card when the link is sent in a chat.
  const description = group.drawn ? "Names are drawn. Open the link to unwrap yours." : "You're invited. Add your name, then see who you draw.";
  return { title: group.name, description, openGraph: { description }, twitter: { description }, robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const group = await loadGroup(id);
  if (!group) notFound();
  return <MemberApp id={id} initial={group} />;
}
