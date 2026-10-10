"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { LockIcon } from "@/components/icons";
import PasswordField from "./PasswordField";

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
      <div className="flex items-start gap-3">
        <LockIcon className="mt-1 text-2xl text-ink/85" />
        <div>
          <h2 className="text-xl font-semibold text-ink">
            {hasPassword ? "Change password" : "Create a password"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {hasPassword
              ? "Update your password to keep your account secure."
              : "You signed up with Google. Set a password to also sign in with email."}
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
        {hasPassword ? (
          <PasswordField
            label="Current password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            value={currentPassword}
            disabled={isSaving}
            onChange={setCurrentPassword}
          />
        ) : null}

        <PasswordField
          label={hasPassword ? "New password" : "Password"}
          placeholder={hasPassword ? "Enter your new password" : "Choose a password"}
          autoComplete="new-password"
          value={newPassword}
          disabled={isSaving}
          onChange={setNewPassword}
        />

        <PasswordField
          label="Confirm password"
          placeholder="Confirm your new password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={isSaving}
          onChange={setConfirmPassword}
        />

        {error ? (
          <p className="tk-error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="tk-success" role="status">
            {success}
          </p>
        ) : null}

        <button className="tk-btn-primary mt-2 w-full !py-3.5" type="submit" disabled={isSaving}>
          <LockIcon className="text-lg" />
          {isSaving ? "Saving..." : hasPassword ? "Update password" : "Create password"}
        </button>
      </form>
    </div>
  );
}
