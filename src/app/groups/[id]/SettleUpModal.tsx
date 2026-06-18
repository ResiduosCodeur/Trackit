"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  groupId: number;
  /** The person the current user owes money to */
  receiver: { userId: number; name: string; email: string };
  /** Pre-fill with the outstanding amount */
  suggestedAmount: number;
}

export default function SettleUpModal({ groupId, receiver, suggestedAmount }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(suggestedAmount.toFixed(2));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openModal() {
    setAmount(suggestedAmount.toFixed(2));
    setError("");
    setIsOpen(true);
  }

  function closeModal() {
    if (!isSaving) setIsOpen(false);
  }

  async function settle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: receiver.userId,
          amount,
          groupId,
        }),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not record the settlement.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not record the settlement. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        type="button"
        onClick={openModal}
      >
        Settle up
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            aria-labelledby="settle-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-6 text-black shadow-xl dark:bg-zinc-900 dark:text-white"
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold" id="settle-title">
                Settle up
              </h2>
              <button type="button" disabled={isSaving} onClick={closeModal}>
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-black/60 dark:text-white/60">
              Recording a payment to{" "}
              <span className="font-medium text-black dark:text-white">
                {receiver.name}
              </span>{" "}
              ({receiver.email})
            </p>

            <form className="flex flex-col gap-4" onSubmit={settle}>
              <label className="flex flex-col gap-1">
                <span>Amount</span>
                <input
                  className="rounded-lg border border-black/20 px-3 py-2 dark:border-white/25"
                  type="number"
                  value={amount}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                  disabled={isSaving}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button type="button" disabled={isSaving} onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Record payment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}