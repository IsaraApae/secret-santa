"use client";

import { useEffect, useRef, useState } from "react";
import { onConfirmRequest, type Pending } from "@/lib/client/confirm";
import { useT } from "@/lib/i18n";

/** Compact centred paper dialog for confirmations; scales in from 88%. */
export function ConfirmHost() {
  const t = useT();
  const [req, setReq] = useState<Pending | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => onConfirmRequest(setReq), []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (req && !d.open) d.showModal();
    if (!req && d.open) d.close();
  }, [req]);

  const answer = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  return (
    <dialog
      ref={ref}
      className="alert"
      aria-labelledby="confirm-title"
      aria-describedby={req?.message ? "confirm-message" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        answer(false);
      }}
    >
      {req && (
        <div className="px-5 pt-7 pb-6 text-center">
          <h2 id="confirm-title" className="font-serif text-[20px]">
            {req.title}
          </h2>
          {req.message && (
            <p id="confirm-message" className="mt-1.5 text-[15px] leading-snug text-ink-2">
              {req.message}
            </p>
          )}
          <div className="mt-6 grid grid-cols-[auto_1fr] gap-2.5">
            {/* Cancel takes only its word's room, so the action ("Draw names") sits clear of its notches on one line.
                Opening the dialog focuses Cancel, the safe choice. */}
            <button type="button" className="btn-secondary h-12 px-4 whitespace-nowrap" onClick={() => answer(false)}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className={req.destructive ? "btn-secondary h-12 px-5 whitespace-nowrap !text-danger" : "btn-primary h-12 px-5 whitespace-nowrap"}
              onClick={() => answer(true)}
            >
              {req.confirmLabel ?? t("ok")}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
