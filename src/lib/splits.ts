export type SplitType = "equal" | "custom" | "equal-except";

export interface DetectedSplit {
  splitType: SplitType;
  /** Members left out of an "equal-except" split */
  excludedUserIds: number[];
  /** userId → amount string ("12.50"), only used for "custom" */
  customAmounts: Record<number, string>;
}

/**
 * Same distribution the expense API uses: base share for everyone, with the
 * leftover cents handed out one at a time in the order of `memberIds`.
 */
export function equalSplitCents(memberIds: number[], totalCents: number) {
  const base = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents % memberIds.length;
  return memberIds.map((userId, index) => ({
    userId,
    cents: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Work out how an existing expense was split, from its stored splits, so the
 * edit modal can show the original split instead of defaulting to "equal".
 *
 * The API stores no split type, so we infer it:
 *  - same as an equal split among every member      → "equal"
 *  - same as an equal split among a subset          → "equal-except"
 *  - anything else                                  → "custom" (exact amounts)
 */
export function detectSplit(
  memberIds: number[],
  splits: { userId: number; amountOwed: number | string }[],
  totalCents: number,
): DetectedSplit {
  const sortedMemberIds = [...memberIds].sort((a, b) => a - b);
  const actual = new Map<number, number>();
  for (const s of splits) {
    actual.set(s.userId, Math.round(Number(s.amountOwed) * 100));
  }

  const matchesEqualAmong = (ids: number[]) => {
    if (ids.length === 0 || ids.length !== actual.size) return false;
    return equalSplitCents(ids, totalCents).every(
      ({ userId, cents }) => actual.get(userId) === cents,
    );
  };

  if (matchesEqualAmong(sortedMemberIds)) {
    return { splitType: "equal", excludedUserIds: [], customAmounts: {} };
  }

  const included = sortedMemberIds.filter((id) => actual.has(id));
  if (matchesEqualAmong(included)) {
    return {
      splitType: "equal-except",
      excludedUserIds: sortedMemberIds.filter((id) => !actual.has(id)),
      customAmounts: {},
    };
  }

  const customAmounts: Record<number, string> = {};
  for (const [userId, cents] of actual) {
    customAmounts[userId] = (cents / 100).toFixed(2);
  }
  return { splitType: "custom", excludedUserIds: [], customAmounts };
}
