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
        className="rounded-lg bg-[#EDEFE8] px-3 py-1.5 text-sm font-medium text-[#141812] transition-colors hover:bg-[#EDEFE8]/85"
        type="button"
        onClick={openModal}
      >
        Settle up
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            aria-labelledby="settle-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-6 text-[#EDEFE8] shadow-xl"
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-xl font-semibold" id="settle-title">
                Settle up
              </h2>
              <button
                className="text-sm text-[#EDEFE8]/45 hover:text-[#EDEFE8]"
                type="button"
                disabled={isSaving}
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-[#EDEFE8]/55">
              Recording a payment to{" "}
              <span className="font-medium text-[#EDEFE8]">
                {receiver.name}
              </span>{" "}
              ({receiver.email})
            </p>

            <form className="flex flex-col gap-4" onSubmit={settle}>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#EDEFE8]/75">Amount</span>
                <input
                  className="tabular-amount rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
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
                <p className="rounded-lg bg-[#E0846F]/15 px-3 py-2 text-sm text-[#E0846F]" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#EDEFE8]/55 hover:text-[#EDEFE8]"
                  type="button"
                  disabled={isSaving}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-[#3FA873] px-4 py-2 text-sm font-semibold text-[#141812] transition-colors hover:bg-[#4DBB84] disabled:opacity-60"
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