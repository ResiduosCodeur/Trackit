"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from "@/components/icons";

type Mode = "sign-in" | "sign-up";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="tk-card relative w-full max-w-[420px] justify-self-center p-8 shadow-2xl shadow-black/40">
      <div className="mb-7 flex rounded-xl bg-bg p-1">
        {(["sign-in", "sign-up"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === option
                ? "bg-accent-strong/25 text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {option === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        {mode === "sign-in" ? "Welcome back" : "Start your ledger"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {mode === "sign-in"
          ? "Sign in to see your groups and balances."
          : "Takes under a minute. No card required."}
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
        {mode === "sign-up" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink/85">Name</span>
            <span className="relative block">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-muted" />
              <input
                className="tk-input !pl-11"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </span>
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/85">Email</span>
          <span className="relative block">
            <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-muted" />
            <input
              className="tk-input !pl-11"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/85">Password</span>
          <span className="relative block">
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-muted" />
            <input
              className="tk-input !pl-11 !pr-12"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              placeholder={mode === "sign-in" ? "Enter your password" : "At least 8 characters"}
              required
              minLength={8}
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-muted transition-colors hover:text-ink"
              tabIndex={-1}
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="tk-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="tk-btn-primary mt-1 w-full !py-3"
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
        <span className="h-px flex-1 bg-ink/10" />
        <span className="text-xs uppercase tracking-wide text-muted">or</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-bg py-2.5 text-sm font-medium text-ink transition-colors hover:bg-white/6 disabled:opacity-60"
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