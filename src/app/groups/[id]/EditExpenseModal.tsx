"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ExpenseIcon } from "@/components/CategoryIcon";
import ModalShell from "@/components/ModalShell";
import { ChevronRightIcon, TrashIcon } from "@/components/icons";
import ExpenseFields, {
  ExpenseFormValue,
  Member,
  SplitType,
  expensePayload,
  validateExpense,
} from "./expenseForm";

interface Expense {
  id: number;
  description: string;
  amount: string;
  paidByUserId: number;
  /** How the expense is currently split, detected from the saved splits */
  split: {
    splitType: SplitType;
    excludedUserIds: number[];
    customAmounts: Record<number, string>;
  };
}

/**
 * The whole expense row is the trigger (`children` is the row's content);
 * tapping it opens the edit dialog.
 */
export default function EditExpenseModal({
  groupId,
  expense,
  members,
  children,
}: {
  groupId: number;
  expense: Expense;
  members: Member[];
  children: React.ReactNode;
}) {
  const router = useRouter();

  const initialForm = (): ExpenseFormValue => ({
    description: expense.description,
    amount: Number(expense.amount).toFixed(2),
    paidByUserId: expense.paidByUserId.toString(),
    splitType: expense.split.splitType,
    excludedUserIds: expense.split.excludedUserIds,
    customAmounts: expense.split.customAmounts,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormValue>(initialForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const busy = isSaving || isDeleting;

  function open() {
    setForm(initialForm());
    setError("");
    setConfirmDelete(false);
    setIsOpen(true);
  }

  function close() {
    if (busy) return;
    setIsOpen(false);
    setError("");
    setConfirmDelete(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const problem = validateExpense(form, members);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload(form, members)),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not update the expense.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not update the expense. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteExpense() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses/${expense.id}`, {
        method: "DELETE",
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not delete the expense.");
        setIsDeleting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not delete the expense. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        aria-label={`Edit ${expense.description || "expense"}`}
        className="tk-card group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:border-accent/40 hover:bg-surface-2 sm:gap-4 sm:px-5"
        type="button"
        onClick={open}
      >
        {children}
        <ChevronRightIcon className="shrink-0 text-xl text-ink/70 transition-colors group-hover:text-accent" />
      </button>

      {isOpen ? (
        <ModalShell title="Edit expense" icon={<ExpenseIcon size={48} />} busy={busy} onClose={close}>
          <form className="flex flex-col gap-5" onSubmit={save}>
            <ExpenseFields value={form} onChange={setForm} members={members} disabled={busy} />

            {error ? (
              <p className="tk-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-colors max-sm:border ${
                  confirmDelete
                    ? "bg-neg/20 text-neg max-sm:border-neg"
                    : "text-neg hover:bg-neg/10 max-sm:border-neg/50"
                }`}
                type="button"
                disabled={busy}
                onClick={deleteExpense}
              >
                <TrashIcon className="text-lg" />
                {isDeleting ? "Deleting..." : confirmDelete ? "Confirm delete" : "Delete expense"}
              </button>

              {confirmDelete ? (
                <button
                  className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-3"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep expense
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:flex">
                  <button
                    className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-3 sm:min-w-28"
                    type="button"
                    disabled={busy}
                    onClick={close}
                  >
                    Cancel
                  </button>
                  <button
                    className="tk-btn-primary !py-3 sm:min-w-36"
                    type="submit"
                    disabled={busy}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
