"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ExpenseIcon } from "@/components/CategoryIcon";
import ModalShell from "@/components/ModalShell";

interface Props {
  groupId: number;
  /** The other person in the settlement */
  counterparty: { userId: number; name: string; email: string };
  /**
   * "pay":     the current user owes `counterparty` and is paying them.
   * "receive": `counterparty` owes the current user and has paid them.
   */
  direction: "pay" | "receive";
  /** Pre-fill with the outstanding amount */
  suggestedAmount: number;
}

export default function SettleUpModal({
  groupId,
  counterparty,
  direction,
  suggestedAmount,
}: Props) {
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
          ...(direction === "pay"
            ? { receiverId: counterparty.userId }
            : { payerId: counterparty.userId }),
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
      <button className="tk-btn-soft" type="button" onClick={openModal}>
        Settle up
      </button>

      {isOpen ? (
        <ModalShell
          title="Settle up"
          size="sm"
          icon={<ExpenseIcon size={48} />}
          busy={isSaving}
          onClose={closeModal}
        >
          <p className="mb-5 text-sm text-muted">
            {direction === "pay" ? "Recording a payment to" : "Recording a payment received from"}{" "}
            <span className="font-medium text-ink">{counterparty.name}</span> ({counterparty.email})
          </p>

          <form className="flex flex-col gap-5" onSubmit={settle}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink/85">Amount (₹)</span>
              <input
                className="tk-input !py-3"
                type="number"
                inputMode="decimal"
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
              <p className="tk-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-5 sm:flex sm:justify-end">
              <button
                className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-3 sm:min-w-28"
                type="button"
                disabled={isSaving}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button className="tk-btn-primary !py-3 sm:min-w-40" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Record payment"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
