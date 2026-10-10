"use client";

import ModalShell from "./ModalShell";

/** Yes / No confirmation. Keep `error` for failures reported by the server. */
export default function ConfirmDialog({
  title,
  message,
  error,
  busy,
  yesLabel = "Yes",
  noLabel = "No",
  onYes,
  onNo,
}: {
  title: string;
  message: string;
  error?: string;
  busy?: boolean;
  yesLabel?: string;
  noLabel?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <ModalShell title={title} size="sm" busy={busy} onClose={onNo}>
      <p className="text-muted">{message}</p>

      {error ? (
        <p className="tk-error mt-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-3"
          disabled={busy}
          type="button"
          onClick={onNo}
        >
          {noLabel}
        </button>
        <button
          className="tk-btn bg-neg text-white hover:bg-neg/85 !py-3"
          disabled={busy}
          type="button"
          onClick={onYes}
        >
          {busy ? "Please wait..." : yesLabel}
        </button>
      </div>
    </ModalShell>
  );
}
