"use client";

import { PlusIcon } from "@/components/icons";

/** Jumps to the create-group field on the same page. */
export default function FocusCreateButton() {
  return (
    <button
      className="tk-btn-primary shrink-0"
      type="button"
      onClick={() => {
        const input = document.getElementById("group-name");
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        input?.focus({ preventScroll: true });
      }}
    >
      <PlusIcon className="text-lg" />
      Create group
    </button>
  );
}
