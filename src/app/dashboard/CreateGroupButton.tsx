"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ArrowRightIcon, UsersIcon } from "@/components/icons";

/**
 * Create-group form.
 *  - "hero":    dashboard card, arrow on the button
 *  - "compact": the all-groups page, plain "Create" button
 */
export default function CreateGroupButton({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const groupName = name.trim();

    if (!groupName) {
      setError("Enter a group name.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName }),
      });

      const data: { groupId?: number; error?: string } = await response.json();

      if (!response.ok || !data.groupId) {
        setError(data.error ?? "Could not create the group.");
        return;
      }

      router.push(`/groups/${data.groupId}`);
    } catch {
      setError("Could not create the group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const label = isCreating ? "Creating..." : variant === "hero" ? "Create group" : "Create";

  return (
    <form className="flex flex-col gap-3" onSubmit={createGroup}>
      <div className={`flex gap-3 ${variant === "hero" ? "flex-col sm:flex-row" : "flex-col sm:flex-row"}`}>
        <label className="relative min-w-0 flex-1" htmlFor="group-name">
          <span className="sr-only">Group name</span>
          <UsersIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted" />
          <input
            className="tk-input !py-3.5 !pl-12"
            id="group-name"
            name="name"
            type="text"
            value={name}
            maxLength={255}
            placeholder="Group name"
            disabled={isCreating}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          className="tk-btn-primary !py-3.5 sm:px-6"
          type="submit"
          disabled={isCreating || !name.trim()}
        >
          {label}
          {variant === "hero" && !isCreating ? <ArrowRightIcon className="text-lg" /> : null}
        </button>
      </div>
      {error ? (
        <p className="tk-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
