"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ExpenseIcon } from "@/components/CategoryIcon";
import ModalShell from "@/components/ModalShell";
import { PlusIcon } from "@/components/icons";
import ExpenseFields, {
  ExpenseFormValue,
  Member,
  expensePayload,
  validateExpense,
} from "./expenseForm";

export default function AddExpenseModal({
  groupId,
  members,
}: {
  groupId: number;
  members: Member[];
}) {
  const router = useRouter();

  const emptyForm = (): ExpenseFormValue => ({
    description: "",
    amount: "",
    paidByUserId: members[0]?.id.toString() ?? "",
    splitType: "equal",
    excludedUserIds: [],
    customAmounts: {},
  });

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormValue>(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function close() {
    if (isSaving) return;
    setIsOpen(false);
    setError("");
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const problem = validateExpense(form, members);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload(form, members)),
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add the expense.");
        return;
      }

      setForm(emptyForm());
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
      <button className="tk-btn-primary" type="button" onClick={() => setIsOpen(true)}>
        <PlusIcon className="text-lg" />
        Add expense
      </button>

      {isOpen ? (
        <ModalShell title="Add expense" icon={<ExpenseIcon size={48} />} busy={isSaving} onClose={close}>
          <form className="flex flex-col gap-5" onSubmit={addExpense}>
            <ExpenseFields value={form} onChange={setForm} members={members} disabled={isSaving} />

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
                onClick={close}
              >
                Cancel
              </button>
              <button className="tk-btn-primary !py-3 sm:min-w-36" type="submit" disabled={isSaving}>
                {isSaving ? "Adding..." : "Add expense"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
