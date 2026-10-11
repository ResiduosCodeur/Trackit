import Image from "next/image";
import Link from "next/link";

import AppHeader from "./AppHeader";

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

/** Image-only back button; `children` is the accessible label ("Back to group"). */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  const label = typeof children === "string" ? children : "Back";

  return (
    <Link
      aria-label={label}
      className="-ml-1 flex w-fit rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      href={href}
      title={label}
    >
      <Image alt="" height={48} src="/images/back-button.png" unoptimized width={48} />
    </Link>
  );
}
