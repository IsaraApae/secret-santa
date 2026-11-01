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
  return { title: group?.name ?? "Not found", robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const group = await loadGroup(id);
  if (!group) notFound();
  return <MemberApp id={id} initial={group} />;
}
