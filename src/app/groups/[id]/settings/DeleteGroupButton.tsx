"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons";

export default function DeleteGroupButton({
  groupId,
  groupName,
  disabled = false,
}: {
  groupId: number;
  groupName: string;
  /** Only the group leader can delete; everyone else sees it greyed out */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteGroup() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not delete the group.");
        setIsDeleting(false);
        return;
      }

      router.push("/groups");
      router.refresh();
    } catch {
      setError("Could not delete the group. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neg/50 bg-neg/5 py-3.5 text-sm font-semibold text-neg transition-colors enabled:hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        title={disabled ? "Only the group leader can delete the group" : undefined}
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
      >
        <TrashIcon className="text-lg" />
        Delete group
      </button>

      {isOpen ? (
        <ConfirmDialog
          title="Delete group"
          message={`Delete "${groupName}"? This permanently removes the group along with all of its expenses and settlements, for every member. This can't be undone.`}
          error={error}
          busy={isDeleting}
          yesLabel="Yes, delete"
          onYes={deleteGroup}
          onNo={() => {
            if (!isDeleting) setIsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
