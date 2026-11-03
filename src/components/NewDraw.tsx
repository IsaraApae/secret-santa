"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorText, rememberGroup } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import { detailsBody, DetailsFields, type DetailValues } from "./PeopleEditor";
import { Callout, Section } from "./ui";

export function NewDraw() {
  const t = useT();
  const router = useRouter();
  const [details, setDetails] = useState<DetailValues>({ name: "", budget: "", date: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    const body = detailsBody(details);
    const res = await api<{ id: string; key: string }>("/api/g", body);
    if (!res.ok) {
      setError(errorText(t, res));
      setBusy(false);
      return;
    }
    rememberGroup({ id: res.data.id, name: body.name, key: res.data.key });
    // The key stays on this phone only (rememberGroup), never in an address that could be shared.
    router.push(`/o/${res.data.id}`);
  }

  return (
    <>
      <h1 className="large-title px-1 pt-2 text-center">{t("newTitle")}</h1>
      <Section title={t("sectionDetails")} sticker="calendar">
        <DetailsFields value={details} onChange={setDetails} />
      </Section>
      <p className="px-1 text-center text-[15px] text-ink-2">{t("newHint")}</p>
      {error && <Callout tone="error">{error}</Callout>}
      <button type="button" className="btn-primary h-14 w-full text-[20px]" disabled={!details.name.trim() || busy} onClick={create}>
        {busy ? t("creating") : t("createGroup")}
      </button>
    </>
  );
}
