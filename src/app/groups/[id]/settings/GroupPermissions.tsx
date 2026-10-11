"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShieldIcon } from "@/components/icons";

type Setting = "allowMemberRename" | "allowMemberAdd";

const OPTIONS: { key: Setting; title: string; hint: string }[] = [
  {
    key: "allowMemberRename",
    title: "Allow members to change the group name",
    hint: "When off, only you can rename the group.",
  },
  {
    key: "allowMemberAdd",
    title: "Allow members to add new members",
    hint: "When off, only you can add people to the group.",
  },
];

export default function GroupPermissions({
  groupId,
  allowMemberRename,
  allowMemberAdd,
}: {
  groupId: number;
  allowMemberRename: boolean;
  allowMemberAdd: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Setting, boolean>>({
    allowMemberRename,
    allowMemberAdd,
  });
  const [busy, setBusy] = useState<Setting | null>(null);
  const [error, setError] = useState("");

  async function toggle(key: Setting) {
    if (busy) return;

    const next = !values[key];
    setError("");
    setBusy(key);
    setValues((cur) => ({ ...cur, [key]: next }));

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json();
        throw new Error(data.error ?? "Could not save this setting.");
      }

      router.refresh();
    } catch (err) {
      setValues((cur) => ({ ...cur, [key]: !next }));
      setError(err instanceof Error ? err.message : "Could not save this setting.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="tk-card p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-xl font-semibold text-ink">
        <ShieldIcon className="text-2xl text-accent" />
        Member permissions
      </h2>
      <p className="mt-1 text-sm text-muted">Only you, as group leader, can change these.</p>

      <ul className="mt-4 flex flex-col gap-2">
        {OPTIONS.map(({ key, title, hint }) => {
          const on = values[key];

          return (
            <li
              className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.025] px-4 py-3.5"
              key={key}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs text-muted sm:text-sm">{hint}</p>
              </div>

              <button
                aria-checked={on}
                aria-label={title}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                  on ? "bg-accent-strong" : "bg-white/15"
                }`}
                disabled={busy === key}
                role="switch"
                type="button"
                onClick={() => toggle(key)}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                    on ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="tk-error mt-3" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
