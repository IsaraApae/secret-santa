import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberApp } from "@/components/MemberApp";
import { getPublicGroup } from "@/lib/server/groups";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await getPublicGroup((await params).id);
  return { title: group?.name ?? "Not found", robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const group = await getPublicGroup(id);
  if (!group) notFound();
  return <MemberApp id={id} initial={group} />;
}
