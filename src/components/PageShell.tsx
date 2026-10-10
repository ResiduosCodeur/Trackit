import Link from "next/link";

import AppHeader from "./AppHeader";
import { ArrowLeftIcon } from "./icons";

/** Page chrome shared by every signed-in screen: header + centred content column. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <AppHeader />
        <div className="flex flex-col gap-8 pt-2 sm:pt-4">{children}</div>
      </div>
    </main>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      className="flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      href={href}
    >
      <ArrowLeftIcon />
      {children}
    </Link>
  );
}
