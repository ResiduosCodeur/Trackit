"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AddMemberForm({ groupId }: { groupId: number }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const memberEmail = email.trim();

    if (!memberEmail) {
      setError("Enter the member's email.");
      return;
    }

    setError("");
    setMessage("");
    setIsAdding(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: memberEmail }),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add the member.");
        return;
      }

      setEmail("");
      setMessage(`${memberEmail} was added to the group.`);
      router.refresh();
    } catch {
      setError("Could not add the member. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form className="flex max-w-md flex-col gap-3" onSubmit={addMember}>
      <label className="font-medium" htmlFor="member-email">
        Add a member
      </label>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-black/20 px-3 py-2 dark:border-white/25"
          id="member-email"
          name="email"
          type="email"
          value={email}
          maxLength={255}
          placeholder="Member email"
          autoComplete="email"
          disabled={isAdding}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
          type="submit"
          disabled={isAdding || !email.trim()}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
