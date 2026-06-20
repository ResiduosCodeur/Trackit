"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (hasPassword && !currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(
        hasPassword ? "Password updated." : "Password created. You can now sign in with email and password.",
      );
      router.refresh();
    } catch {
      setError("Could not update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-[#EDEFE8]">
        {hasPassword ? "Change password" : "Create a password"}
      </h2>
      <p className="mt-1 text-sm text-[#EDEFE8]/50">
        {hasPassword
          ? "Update the password you use to sign in."
          : "You signed up with Google. Set a password to also sign in with email."}
      </p>

      <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
        {hasPassword ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#EDEFE8]/75">Current password</span>
            <input
              className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              disabled={isSaving}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#EDEFE8]/75">
            {hasPassword ? "New password" : "Password"}
          </span>
          <input
            className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            disabled={isSaving}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#EDEFE8]/75">Confirm password</span>
          <input
            className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={isSaving}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-[#E0846F]/15 px-3 py-2 text-sm text-[#E0846F]" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg bg-[#3FA873]/15 px-3 py-2 text-sm text-[#3FA873]" role="status">
            {success}
          </p>
        ) : null}

        <button
          className="mt-1 w-fit rounded-lg bg-[#3FA873] px-4 py-2 text-sm font-semibold text-[#141812] transition-colors hover:bg-[#4DBB84] disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : hasPassword ? "Update password" : "Create password"}
        </button>
      </form>
    </div>
  );
}