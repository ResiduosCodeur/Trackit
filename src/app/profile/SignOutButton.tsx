"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={isSigningOut}
      onClick={async () => {
        setIsSigningOut(true);

        try {
          await signOut({ redirect: false });
          window.location.assign("/");
        } catch {
          setIsSigningOut(false);
        }
      }}
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
