"use client";

/**
 * Promise-based confirmation, rendered by <ConfirmHost/> as a compact glass
 * dialog with two capsule buttons (replaces the browser's confirm()).
 */
export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Can't be taken back (delete, redraw, reset a PIN): the confirm button is the cream ticket with red
      words, like the page's own Delete button, rather than the red ticket of an everyday main action. */
  destructive?: boolean;
}

export type Pending = ConfirmRequest & { resolve: (ok: boolean) => void };

let listener: ((p: Pending | null) => void) | null = null;

export function onConfirmRequest(fn: (p: Pending | null) => void): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function askConfirm(req: ConfirmRequest): Promise<boolean> {
  // Fallback if the host isn't mounted (shouldn't happen in the app).
  if (!listener) return Promise.resolve(window.confirm(req.message ? `${req.title}\n\n${req.message}` : req.title));
  return new Promise((resolve) => listener?.({ ...req, resolve }));
}
