"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "sign-in" | "sign-up";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "sign-up") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data: { error?: string } = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not create your account.");
          setIsSubmitting(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect email or password.");
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative w-full max-w-[420px] justify-self-center rounded-2xl border border-[#EDEFE8]/10 bg-[#1C211A] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_-8px_rgba(0,0,0,0.5)]">
      <span className="absolute left-0 top-8 h-10 w-[3px] rounded-r bg-[#3FA873]" />

      <div className="mb-7 flex rounded-lg bg-[#141812] p-1">
        {(["sign-in", "sign-up"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === option
                ? "bg-[#2A2F26] text-[#EDEFE8] shadow-sm"
                : "text-[#EDEFE8]/45 hover:text-[#EDEFE8]/80"
            }`}
          >
            {option === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#EDEFE8]">
        {mode === "sign-in" ? "Welcome back" : "Start your ledger"}
      </h2>
      <p className="mt-1 text-sm text-[#EDEFE8]/50">
        {mode === "sign-in"
          ? "Sign in to see your groups and balances."
          : "Takes under a minute. No card required."}
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
        {mode === "sign-up" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#EDEFE8]/75">Name</span>
            <input
              className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
              type="text"
              autoComplete="name"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#EDEFE8]/75">Email</span>
          <input
            className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#EDEFE8]/75">Password</span>
          <input
            className="rounded-lg border border-[#EDEFE8]/15 bg-[#141812] px-3.5 py-2.5 text-[#EDEFE8] outline-none transition-colors focus:border-[#3FA873] focus:ring-2 focus:ring-[#3FA873]/20"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-[#E0846F]/15 px-3 py-2 text-sm text-[#E0846F]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="mt-1 rounded-lg bg-[#3FA873] py-2.5 text-sm font-semibold text-[#141812] transition-colors hover:bg-[#4DBB84] disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#EDEFE8]/10" />
        <span className="text-xs uppercase tracking-wide text-[#EDEFE8]/35">or</span>
        <span className="h-px flex-1 bg-[#EDEFE8]/10" />
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#EDEFE8]/15 bg-[#141812] py-2.5 text-sm font-medium text-[#EDEFE8] transition-colors hover:bg-[#EDEFE8]/[0.06] disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.86-3.06.86-2.36 0-4.36-1.59-5.08-3.73H.9v2.34A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.92 10.69A5.4 5.4 0 0 1 3.63 9c0-.59.1-1.16.29-1.69V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.02-2.34z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A8.6 8.6 0 0 0 9 0a9 9 0 0 0-8.1 4.97l3.02 2.34C4.64 5.17 6.64 3.58 9 3.58z"
          />
        </svg>
        Continue with Google
      </button>
    </section>
  );
}