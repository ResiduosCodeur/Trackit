"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PencilIcon } from "@/components/icons";

export default function ProfileNameEditor({ name }: { name: string }) {
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

    const next = value.trim().replace(/\s+/g, " ");

    if (!next) {
      setError("Enter your name.");
      return;
    }

    if (next === name) {
      setIsEditing(false);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not change your name.");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Could not change your name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-1 flex items-center gap-3">
        <h1 className="min-w-0 break-words text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {name}
        </h1>
        <button
          aria-label="Edit name"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-base text-ink/85 transition-colors hover:border-accent/50 hover:text-accent"
          type="button"
          onClick={startEditing}
        >
          <PencilIcon />
        </button>
      </div>
    );
  }

  return (
    <form className="mt-2 flex flex-col gap-3" onSubmit={save}>
      <input
        aria-label="Your name"
        autoFocus
        className="tk-input !py-3 sm:min-w-80"
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

      <div className="flex gap-3">
        <button
          className="tk-btn bg-white/6 text-ink hover:bg-white/10 !py-2.5"
          disabled={isSaving}
          type="button"
          onClick={cancel}
        >
          Cancel
        </button>
        <button
          className="tk-btn-primary !py-2.5 sm:min-w-36"
          disabled={isSaving || !value.trim()}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save name"}
        </button>
      </div>
    </form>
  );
}
