"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { LogOutIcon } from "@/components/icons";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      className="tk-btn-outline w-full !py-3.5"
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
      <LogOutIcon className="text-lg" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
