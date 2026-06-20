"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: number;
  name: string;
  email: string;
}

type SplitType = "equal" | "custom" | "equal-except";

function amountToCents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [whole, decimal = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export default function AddExpenseModal({
  groupId,
  members,
}: {
  groupId: number;
  members: Member[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByUserId, setPaidByUserId] = useState(
    () => members[0]?.id.toString() ?? "",
  );
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [excludedUserIds, setExcludedUserIds] = useState<number[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function closeModal() {
    if (!isSaving) {
      setIsOpen(false);
      setError("");
    }
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const totalCents = amountToCents(amount);

    if (!description.trim()) {
      setError("Enter an expense description.");
      return;
    }

    if (totalCents === null || totalCents <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }

    if (!members.some((member) => member.id.toString() === paidByUserId)) {
      setError("Choose who paid for the expense.");
      return;
    }

    if (splitType === "equal-except" && excludedUserIds.length === members.length) {
      setError("At least one member must share the expense.");
      return;
    }

    if (splitType === "custom") {
      const customTotal = members.reduce(
        (sum, member) => sum + (amountToCents(customAmounts[member.id] ?? "0") ?? 0),
        0,
      );

      if (customTotal !== totalCents) {
        setError("Custom split amounts must equal the total.");
        return;
      }
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount,
          paidByUserId: Number(paidByUserId),
          splitType,
          excludedUserIds,
          customSplits: members.map((member) => ({
            userId: member.id,
            amount: customAmounts[member.id] || "0",
          })),
        }),
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add the expense.");
        return;
      }

      setDescription("");
      setAmount("");
      setPaidByUserId(members[0]?.id.toString() ?? "");
      setSplitType("equal");
      setExcludedUserIds([]);
      setCustomAmounts({});
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not add the expense. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        className="rounded-lg bg-[#3FA873] px-4 py-2 text-sm font-semibold text-[#141812] transition-colors hover:bg-[#4DBB84]"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Add expense
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            aria-labelledby="add-expense-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-6 text-[#EDEFE8] shadow-xl"
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-xl font-semibold" id="add-expense-title">
                Add expense
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

            <form className="flex flex-col gap-4" onSubmit={addExpense}>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#EDEFE8]/75">Description</span>
                <input
                  className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
                  value={description}
                  maxLength={255}
                  autoFocus
                  disabled={isSaving}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#EDEFE8]/75">Total amount</span>
                <input
                  className="tabular-amount rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
                  type="number"
                  value={amount}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isSaving}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#EDEFE8]/75">Split type</span>
                <select
                  className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
                  value={splitType}
                  disabled={isSaving}
                  onChange={(event) => setSplitType(event.target.value as SplitType)}
                >
                  <option value="equal">Equally among all</option>
                  <option value="custom">Custom split</option>
                  <option value="equal-except">Equally except...</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#EDEFE8]/75">Paid by</span>
                <select
                  className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
                  value={paidByUserId}
                  disabled={isSaving}
                  onChange={(event) => setPaidByUserId(event.target.value)}
                >
                  {members.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </label>

              {splitType === "equal-except" ? (
                <fieldset className="flex flex-col gap-2 rounded-lg border border-[#EDEFE8]/10 p-3">
                  <legend className="mb-1 px-1 text-sm font-medium text-[#EDEFE8]/75">
                    Exclude members
                  </legend>
                  {members.map((member) => (
                    <label className="flex items-center gap-2 text-sm text-[#EDEFE8]/90" key={member.id}>
                      <input
                        type="checkbox"
                        className="size-4 rounded border-[#EDEFE8]/30 bg-[#141812] accent-[#3FA873]"
                        checked={excludedUserIds.includes(member.id)}
                        disabled={isSaving}
                        onChange={(event) =>
                          setExcludedUserIds((current) =>
                            event.target.checked
                              ? [...current, member.id]
                              : current.filter((id) => id !== member.id),
                          )
                        }
                      />
                      {member.name} ({member.email})
                    </label>
                  ))}
                </fieldset>
              ) : null}

              {splitType === "custom" ? (
                <fieldset className="flex flex-col gap-2 rounded-lg border border-[#EDEFE8]/10 p-3">
                  <legend className="mb-1 px-1 text-sm font-medium text-[#EDEFE8]/75">
                    Amount owed by each member
                  </legend>
                  {members.map((member) => (
                    <label className="flex items-center justify-between gap-3" key={member.id}>
                      <span className="min-w-0 truncate text-sm text-[#EDEFE8]/90">{member.name}</span>
                      <input
                        className="tabular-amount w-32 rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3 py-2 text-sm text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
                        type="number"
                        value={customAmounts[member.id] ?? ""}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isSaving}
                        onChange={(event) =>
                          setCustomAmounts((current) => ({
                            ...current,
                            [member.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ) : null}

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
                  {isSaving ? "Adding..." : "Add expense"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}