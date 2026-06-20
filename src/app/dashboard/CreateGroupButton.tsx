"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function CreateGroupButton() {
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

  return (
    <form className="flex max-w-md flex-col gap-3" onSubmit={createGroup}>
      <label className="text-sm font-medium text-[#EDEFE8]/75" htmlFor="group-name">
        Create a new group
      </label>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
          id="group-name"
          name="name"
          type="text"
          value={name}
          maxLength={255}
          placeholder="Group name"
          disabled={isCreating}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          className="rounded-lg bg-[#3FA873] px-4 py-2 text-sm font-semibold text-[#141812] transition-colors hover:bg-[#4DBB84] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isCreating || !name.trim()}
        >
          {isCreating ? "Creating..." : "Create"}
        </button>
      </div>
      {error ? (
        <p className="rounded-lg bg-[#E0846F]/15 px-3 py-2 text-sm text-[#E0846F]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}