/** ₹1,234 for whole amounts, ₹1,234.50 otherwise (or fixed decimals when given). */
export function formatINR(value: number, decimals?: number): string {
  const fixed = decimals ?? (Number.isInteger(value) ? 0 : 2);
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: fixed,
    maximumFractionDigits: fixed,
  })}`;
}

/** "2 days ago", "5 hours ago", "just now" */
export function timeAgo(date: Date | string | null, now: Date = new Date()): string {
  if (!date) return "No activity yet";

  const diffMs = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}
