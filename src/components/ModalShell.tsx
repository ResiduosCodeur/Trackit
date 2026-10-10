"use client";

import { useEffect, useId } from "react";

import { CloseIcon } from "./icons";

/**
 * Shared dialog frame: a centred card on desktop, a bottom sheet on phones.
 * Closes on Escape, backdrop click or the X unless `busy` (a request is running).
 */
export default function ModalShell({
  title,
  icon,
  onClose,
  busy = false,
  size = "lg",
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  size?: "sm" | "lg";
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0e111b] p-5 text-ink shadow-2xl shadow-black/60 sm:rounded-2xl sm:p-7 ${
          size === "sm" ? "sm:max-w-md" : "sm:max-w-xl"
        }`}
        role="dialog"
      >
        <div className="mb-5 flex items-center gap-4">
          {icon}
          <h2 className="flex-1 text-2xl font-semibold tracking-tight" id={titleId}>
            {title}
          </h2>
          <button
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-xl text-muted transition-colors hover:bg-white/8 hover:text-ink disabled:opacity-50"
            disabled={busy}
            type="button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
