"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AddMemberForm({
  groupId,
  onDone,
}: {
  groupId: number;
  onDone?: () => void;
}) {
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
    <form className="flex flex-col gap-3" onSubmit={addMember}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1" htmlFor="member-email">
          <span className="sr-only">Member email</span>
          <input
            className="tk-input"
            id="member-email"
            name="email"
            type="email"
            value={email}
            maxLength={255}
            placeholder="Member email"
            autoComplete="email"
            autoFocus
            disabled={isAdding}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <button
            className="tk-btn-primary flex-1 sm:flex-none"
            type="submit"
            disabled={isAdding || !email.trim()}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
          {onDone ? (
            <button className="tk-btn-ghost" type="button" onClick={onDone}>
              Close
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="tk-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="tk-success" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
