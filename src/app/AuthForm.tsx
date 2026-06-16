"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type Mode = "signin" | "signup";

interface SignupResponse {
  error?: string;
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function submitWithCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await response.json()) as SignupResponse;

        if (!response.ok) {
          setError(data.error ?? "Could not create your account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isSignup
            ? "Account created, but sign in failed. Try signing in."
            : "Email or password is incorrect.",
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase text-emerald-700">
          Trackit
        </p>
        <h1 className="text-3xl font-bold text-slate-950">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isSignup
            ? "Start tracking shared expenses with your people."
            : "Sign in to manage groups, expenses, and balances."}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold text-slate-600">
        <button
          className={`rounded-md px-4 py-2 transition ${
            !isSignup ? "bg-white text-slate-950 shadow-sm" : ""
          }`}
          type="button"
          onClick={() => {
            setMode("signin");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          className={`rounded-md px-4 py-2 transition ${
            isSignup ? "bg-white text-slate-950 shadow-sm" : ""
          }`}
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          Sign up
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={submitWithCredentials}>
        {isSignup ? (
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Name
            <input
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              value={name}
              autoComplete="name"
              disabled={isSubmitting}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            type="email"
            value={email}
            autoComplete="email"
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            type="password"
            value={password}
            autoComplete={isSignup ? "new-password" : "current-password"}
            disabled={isSubmitting}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="mt-2 rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={isSubmitting}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-blue-600">
          G
        </span>
        Sign in with Google
      </button>
    </div>
  );
}
