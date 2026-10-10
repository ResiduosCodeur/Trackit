import Link from "next/link";

import { GroupIcon } from "@/components/CategoryIcon";
import { ChevronRightIcon } from "@/components/icons";
import { formatINR } from "@/lib/format";
import type { GroupSummary } from "@/lib/groupSummaries";

export default function GroupCard({ group }: { group: GroupSummary }) {
  const cents = Math.round(group.net * 100);
  const state = cents > 0 ? "owed" : cents < 0 ? "owe" : "even";

  const label = { owed: "You are owed", owe: "You owe", even: "Settled up" }[state];
  const tone = { owed: "text-pos", owe: "text-neg", even: "text-muted" }[state];

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group tk-card flex flex-col gap-5 p-5 transition-colors hover:border-accent/40 hover:bg-surface-2"
    >
      <div className="flex items-center gap-4">
        <GroupIcon />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink">{group.name}</p>
          <p className="text-sm text-muted">
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <ChevronRightIcon className="text-xl text-muted transition-colors group-hover:text-accent" />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-white/8 pt-4">
        <div>
          <p className="text-sm text-muted">Total spent</p>
          <p className="tabular-amount mt-1 text-2xl font-semibold text-ink">
            {formatINR(group.totalSpent)}
          </p>
        </div>
        <div className="border-l border-white/8 pl-4">
          <p className={`text-sm ${tone}`}>{label}</p>
          <p className={`tabular-amount mt-1 text-2xl font-semibold ${tone}`}>
            {formatINR(Math.abs(group.net))}
          </p>
        </div>
      </div>
    </Link>
  );
}
