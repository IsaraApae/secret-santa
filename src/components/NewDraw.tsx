"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorText, rememberGroup } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import { detailsBody, DetailsFields, PeopleEditor, type DetailValues, type EditPerson, type Pair } from "./PeopleEditor";
import { Callout, Section } from "./ui";

export function NewDraw() {
  const t = useT();
  const router = useRouter();
  const [details, setDetails] = useState<DetailValues>({ name: "", budget: "", date: "", note: "" });
  const [people, setPeople] = useState<EditPerson[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function draw() {
    setBusy(true);
    setError("");
    const body = { ...detailsBody(details), people: people.map((p) => ({ ...p, name: p.name.trim() })), pairs };
    const res = await api<{ id: string; key: string }>("/api/g", body);
    if (!res.ok) {
      setError(errorText(t, res));
      setBusy(false);
      return;
    }
    rememberGroup({ id: res.data.id, name: body.name, key: res.data.key });
    router.push(`/o/${res.data.id}?k=${res.data.key}`);
  }

  const ready = details.name.trim() && people.length >= 3 && people.every((p) => p.name.trim());

  return (
    <>
      <h1 className="large-title px-1 pt-3">{t("newTitle")}</h1>
      <Section title={t("sectionDetails")}>
        <DetailsFields value={details} onChange={setDetails} />
      </Section>
      <PeopleEditor
        people={people}
        pairs={pairs}
        onChange={(a, b) => {
          setPeople(a);
          setPairs(b);
        }}
      />
      {error && <Callout tone="error">{error}</Callout>}
      {people.length > 0 && people.length < 3 && <p className="text-center text-[15px] text-ink-2">{t("needThree")}</p>}
      <button type="button" className="btn-primary h-13 w-full" disabled={!ready || busy} onClick={draw}>
        {busy ? t("drawing") : t("drawNames")}
      </button>
    </>
  );
}
