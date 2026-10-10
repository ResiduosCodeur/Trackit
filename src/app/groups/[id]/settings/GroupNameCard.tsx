"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PencilIcon } from "@/components/icons";

export default function GroupNameCard({
  groupId,
  name,
  canEdit,
}: {
  groupId: number;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setValue(name);
    setError("");
    setIsEditing(true);
  }

  function cancel() {
    if (isSaving) return;
    setIsEditing(false);
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = value.trim();

    if (!next) {
      setError("Enter a group name.");
      return;
    }

    if (next === name) {
      setIsEditing(false);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not rename the group.");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Could not rename the group. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="tk-card p-5 sm:p-6">
      <p className="text-sm font-medium text-ink/85">Group name</p>

      {isEditing ? (
        <form className="mt-3 flex flex-col gap-3" onSubmit={save}>
          <input
            aria-label="Group name"
            autoFocus
            className="tk-input !py-3"
            disabled={isSaving}
            maxLength={255}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancel();
            }}
          />

          {error ? (
            <p className="tk-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-3"
              disabled={isSaving}
              type="button"
              onClick={cancel}
            >
              Cancel
            </button>
            <button
              className="tk-btn-primary !py-3 sm:min-w-40"
              disabled={isSaving || !value.trim()}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <p className="min-w-0 flex-1 break-words text-xl font-semibold text-ink">{name}</p>
          {canEdit ? (
            <button
              aria-label="Edit group name"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-ink/85 transition-colors hover:border-accent/50 hover:text-accent"
              type="button"
              onClick={startEditing}
            >
              <PencilIcon />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
