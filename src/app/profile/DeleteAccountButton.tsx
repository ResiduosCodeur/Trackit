"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons";

export default function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteAccount() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not delete your account.");
        setIsDeleting(false);
        return;
      }

      await signOut({ redirect: false });
      window.location.assign("/");
    } catch {
      setError("Could not delete your account. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neg/50 bg-neg/5 py-3.5 text-sm font-semibold text-neg transition-colors hover:bg-neg/10"
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
      >
        <TrashIcon className="text-lg" />
        Delete account
      </button>

      {isOpen ? (
        <ConfirmDialog
          title="Delete account"
          message="Delete your account? You'll be removed from all your groups and signed out for good. This can't be undone. You can only do this when you're settled up in every group."
          error={error}
          busy={isDeleting}
          yesLabel="Yes, delete"
          onYes={deleteAccount}
          onNo={() => {
            if (!isDeleting) setIsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}