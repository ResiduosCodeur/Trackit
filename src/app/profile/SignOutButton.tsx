"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      className="rounded-lg bg-[#E0846F]/15 px-4 py-2 text-sm font-medium text-[#E0846F] transition-colors hover:bg-[#E0846F]/25 disabled:cursor-not-allowed disabled:opacity-60"
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