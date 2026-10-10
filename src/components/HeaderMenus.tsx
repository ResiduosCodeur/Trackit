"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import Avatar from "./Avatar";
import { BellIcon, ChevronDownIcon, LogOutIcon, UserIcon } from "./icons";

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}

export function NotificationBell() {
  const { open, setOpen, ref } = usePopover();

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label="Notifications"
        className="flex size-10 items-center justify-center rounded-full text-xl text-ink/80 transition-colors hover:bg-white/8 hover:text-ink"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-white/10 bg-surface-2 p-4 text-sm shadow-xl shadow-black/40">
          <p className="font-medium text-ink">You&apos;re all caught up</p>
          <p className="mt-1 text-muted">No new notifications.</p>
        </div>
      ) : null}
    </div>
  );
}

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const { open, setOpen, ref } = usePopover();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full border border-white/10 bg-surface/80 p-1 pr-1 transition-colors hover:border-white/20 sm:pr-4"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={name} seed={email} image={image} size={36} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:block">
          {name}
        </span>
        <ChevronDownIcon className="hidden text-muted sm:block" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-white/10 bg-surface-2 p-1.5 shadow-xl shadow-black/40"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <div className="my-1 h-px bg-white/8" />
          <Link
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/85 transition-colors hover:bg-white/8"
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="text-base text-muted" />
            Profile
          </Link>
          <button
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-neg transition-colors hover:bg-neg/10 disabled:opacity-60"
            disabled={isSigningOut}
            role="menuitem"
            type="button"
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
            <LogOutIcon className="text-base" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
