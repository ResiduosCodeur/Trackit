"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import { LogOutIcon } from "@/components/icons";

export default function LeaveGroupButton({
  groupId,
  groupName,
  userId,
  isCreator,
}: {
  groupId: number;
  groupName: string;
  userId: number;
  isCreator: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  async function leave() {
    setIsLeaving(true);
    setError("");

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not leave the group.");
        setIsLeaving(false);
        return;
      }

      router.push("/groups");
      router.refresh();
    } catch {
      setError("Could not leave the group. Please try again.");
      setIsLeaving(false);
    }
  }

  return (
    <>
      <button
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neg/50 bg-neg/5 py-3.5 text-sm font-semibold text-neg transition-colors hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isCreator}
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
      >
        <LogOutIcon className="text-lg" />
        Leave group
      </button>

      {isCreator ? (
        <p className="-mt-4 text-center text-xs text-muted">
          As the group creator you can&apos;t leave this group.
        </p>
      ) : null}

      {isOpen ? (
        <ConfirmDialog
          title="Leave group"
          message={`Are you sure you want to leave ${groupName}?`}
          error={error}
          busy={isLeaving}
          onYes={leave}
          onNo={() => {
            if (!isLeaving) setIsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
