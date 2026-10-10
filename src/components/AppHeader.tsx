import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { NotificationBell, UserMenu } from "./HeaderMenus";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image alt="" height={32} priority src="/images/logo-rupee.png" style={{ height: 32, width: "auto" }} unoptimized width={27} />
      <span className="text-2xl font-semibold tracking-tight text-ink">TrackIt</span>
    </span>
  );
}

export default async function AppHeader() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Account";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;

  return (
    <header className="flex items-center justify-between gap-3 py-5 sm:py-6">
      <Link aria-label="TrackIt home" href="/dashboard">
        <Logo />
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <NotificationBell />
        <UserMenu name={name} email={email} image={image} />
      </div>
    </header>
  );
}
