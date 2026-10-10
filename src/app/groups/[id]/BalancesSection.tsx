"use client";

import { useState } from "react";

import { SwapIcon } from "@/components/icons";
import type { Debt } from "@/lib/balances";
import { firstName, formatINR } from "@/lib/format";
import SettleUpModal from "./SettleUpModal";

export default function BalancesSection({
  groupId,
  currentUserId,
  debts,
  simplifiedDebts,
}: {
  groupId: number;
  currentUserId: number | null;
  /** Who owes whom, pair by pair */
  debts: Debt[];
  /** Fewest-transfers version of the same balances */
  simplifiedDebts: Debt[];
}) {
  const [simplified, setSimplified] = useState(false);

  const shown = simplified ? simplifiedDebts : debts;
  // Rows that involve the current user come first
  const rows = [...shown].sort((a, b) => {
    const aMine = a.from.userId === currentUserId || a.to.userId === currentUserId;
    const bMine = b.from.userId === currentUserId || b.to.userId === currentUserId;
    return Number(bMine) - Number(aMine);
  });

  const canSimplify = simplifiedDebts.length < debts.length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Balances</h2>
        {debts.length > 0 && (canSimplify || simplified) ? (
          <button
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-3.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:border-accent/50 hover:text-ink"
            type="button"
            aria-pressed={simplified}
            onClick={() => setSimplified((value) => !value)}
          >
            <SwapIcon className="text-base text-accent" />
            {simplified ? "Show original debts" : "Simplify debts"}
          </button>
        ) : null}
      </div>

      {simplified ? (
        <p className="-mt-2 text-xs text-muted">
          Showing the fewest payments that settle everyone up.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-surface/40 p-6 text-center">
          <p className="text-sm text-muted">Everyone&apos;s settled up. Nice and tidy.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((debt) => {
            const iOwe = debt.from.userId === currentUserId;
            const owedToMe = debt.to.userId === currentUserId;

            const bar = owedToMe ? "bg-pos" : iOwe ? "bg-accent-strong" : "bg-white/20";
            const amountTone = owedToMe ? "text-pos" : iOwe ? "text-neg" : "text-ink/70";

            return (
              <li
                key={`${simplified ? "s" : "p"}-${debt.from.userId}-${debt.to.userId}`}
                className="tk-card relative flex items-center justify-between gap-3 overflow-hidden py-3 pl-5 pr-3 sm:py-3.5 sm:pr-4"
              >
                <span className={`absolute inset-y-0 left-0 w-[3px] ${bar}`} />

                <p className="min-w-0 flex-1 break-words text-sm text-muted sm:text-[0.95rem]">
                  <span className="font-semibold text-ink">
                    <span className="sm:hidden">{firstName(debt.from.name)}</span>
                    <span className="hidden sm:inline">{debt.from.name}</span>
                  </span>{" "}
                  owes{" "}
                  <span className="font-semibold text-ink">
                    <span className="sm:hidden">{firstName(debt.to.name)}</span>
                    <span className="hidden sm:inline">{debt.to.name}</span>
                  </span>
                </p>

                <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                  <span className={`tabular-amount text-base font-semibold sm:text-lg ${amountTone}`}>
                    {formatINR(debt.amount, 2)}
                  </span>
                  {iOwe ? (
                    <SettleUpModal
                      groupId={groupId}
                      counterparty={debt.to}
                      direction="pay"
                      suggestedAmount={debt.amount}
                    />
                  ) : owedToMe ? (
                    <SettleUpModal
                      groupId={groupId}
                      counterparty={debt.from}
                      direction="receive"
                      suggestedAmount={debt.amount}
                    />
                  ) : (
                    // keeps amounts aligned on rows that have no button
                    <span aria-hidden="true" className="hidden w-[5.4rem] sm:block" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
