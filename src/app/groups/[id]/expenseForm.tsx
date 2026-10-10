"use client";

import SelectField from "@/components/SelectField";

export type SplitType = "equal" | "custom" | "equal-except";

export interface Member {
  id: number;
  name: string;
  email: string;
}

export interface ExpenseFormValue {
  description: string;
  amount: string;
  paidByUserId: string;
  splitType: SplitType;
  excludedUserIds: number[];
  customAmounts: Record<number, string>;
}

export function amountToCents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimal = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

/** Returns an error message, or null when the form can be submitted. */
export function validateExpense(value: ExpenseFormValue, members: Member[]): string | null {
  const totalCents = amountToCents(value.amount);

  if (!value.description.trim()) return "Enter an expense description.";
  if (totalCents === null || totalCents <= 0) return "Enter a valid positive amount.";
  if (!members.some((m) => m.id.toString() === value.paidByUserId)) return "Choose who paid.";
  if (value.splitType === "equal-except" && value.excludedUserIds.length === members.length) {
    return "At least one member must share the expense.";
  }
  if (value.splitType === "custom") {
    const customTotal = members.reduce(
      (sum, m) => sum + (amountToCents(value.customAmounts[m.id] || "0") ?? 0),
      0,
    );
    if (customTotal !== totalCents) return "Custom split amounts must equal the total.";
  }
  return null;
}

/** Request body shared by the add and edit endpoints. */
export function expensePayload(value: ExpenseFormValue, members: Member[]) {
  return {
    description: value.description.trim(),
    amount: value.amount,
    paidByUserId: Number(value.paidByUserId),
    splitType: value.splitType,
    excludedUserIds: value.excludedUserIds,
    customSplits: members.map((m) => ({
      userId: m.id,
      amount: value.customAmounts[m.id] || "0",
    })),
  };
}

export default function ExpenseFields({
  value,
  onChange,
  members,
  disabled,
}: {
  value: ExpenseFormValue;
  onChange: (next: ExpenseFormValue) => void;
  members: Member[];
  disabled: boolean;
}) {
  const set = (patch: Partial<ExpenseFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink/85">Description</span>
        <input
          className="tk-input !py-3"
          value={value.description}
          maxLength={255}
          autoFocus
          disabled={disabled}
          onChange={(e) => set({ description: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink/85">Total amount (₹)</span>
        <input
          className="tk-input !py-3"
          type="number"
          inputMode="decimal"
          value={value.amount}
          min="0.01"
          step="0.01"
          placeholder="0.00"
          disabled={disabled}
          onChange={(e) => set({ amount: e.target.value })}
        />
      </label>

      <SelectField
        label="Split type"
        value={value.splitType}
        disabled={disabled}
        onChange={(v) => set({ splitType: v as SplitType })}
      >
        <option value="equal">Equally among all</option>
        <option value="custom">Custom split</option>
        <option value="equal-except">Equally except...</option>
      </SelectField>

      <SelectField
        label="Paid by"
        value={value.paidByUserId}
        disabled={disabled}
        onChange={(v) => set({ paidByUserId: v })}
      >
        {members.map((m) => (
          <option value={m.id} key={m.id}>
            {m.name} ({m.email})
          </option>
        ))}
      </SelectField>

      {value.splitType === "equal-except" ? (
        <fieldset className="flex flex-col gap-2.5 rounded-xl border border-white/10 p-4">
          <legend className="px-1.5 text-sm font-medium text-ink/85">Exclude members</legend>
          {members.map((m) => (
            <label className="flex items-center gap-2.5 text-sm text-ink/90" key={m.id}>
              <input
                type="checkbox"
                className="size-4 rounded accent-accent-strong"
                checked={value.excludedUserIds.includes(m.id)}
                disabled={disabled}
                onChange={(e) =>
                  set({
                    excludedUserIds: e.target.checked
                      ? [...value.excludedUserIds, m.id]
                      : value.excludedUserIds.filter((id) => id !== m.id),
                  })
                }
              />
              {m.name} ({m.email})
            </label>
          ))}
        </fieldset>
      ) : null}

      {value.splitType === "custom" ? (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-white/10 p-4">
          <legend className="px-1.5 text-sm font-medium text-ink/85">
            Amount owed by each member
          </legend>
          {members.map((m) => (
            <label className="flex items-center justify-between gap-3" key={m.id}>
              <span className="min-w-0 truncate text-sm text-ink/90">{m.name}</span>
              <input
                className="tk-input !w-32 !py-2 text-sm sm:!w-44"
                type="number"
                inputMode="decimal"
                value={value.customAmounts[m.id] ?? ""}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={disabled}
                onChange={(e) =>
                  set({ customAmounts: { ...value.customAmounts, [m.id]: e.target.value } })
                }
              />
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}
