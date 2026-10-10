import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import PageShell from "@/components/PageShell";
import { ArrowRightIcon } from "@/components/icons";
import { authOptions } from "@/lib/auth";
import { firstName } from "@/lib/format";
import { getGroupSummaries } from "@/lib/groupSummaries";
import CreateGroupButton from "./CreateGroupButton";
import GroupCard from "./GroupCard";
import Greeting from "./Greeting";

const DASHBOARD_GROUP_LIMIT = 3;

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const groups = await getGroupSummaries(session.user.email);
  const shown = groups.slice(0, DASHBOARD_GROUP_LIMIT);

  return (
    <PageShell>
      {/* Greeting */}
      <section>
        <p className="text-xl text-muted sm:text-2xl">
          <span suppressHydrationWarning>
            <Greeting />
          </span>
        </p>
        <h1 className="mt-1 flex items-center gap-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {firstName(session.user.name) || "there"}
          
        </h1>
        <p className="mt-2 text-muted sm:text-lg">
          Keep track of shared expenses, all in one place.
        </p>
      </section>

      {/* Create group */}
      <section className="tk-card relative overflow-hidden p-6 sm:p-8">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Create a new group</h2>
          <p className="mt-1.5 text-muted">
            Start tracking expenses with your friends, roommates or teammates.
          </p>
          <div className="mt-6">
            <CreateGroupButton variant="hero" />
          </div>
        </div>
        <CreateIllustration />
      </section>

      {/* Your groups */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Your groups</h2>
            <span className="rounded-full border border-white/8 bg-surface px-3 py-1 text-sm text-muted">
              {groups.length} {groups.length === 1 ? "group" : "groups"}
            </span>
          </div>
          <Link
            href="/groups"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-ink/90 transition-colors hover:border-accent/50 hover:text-ink"
          >
            All groups
            <ArrowRightIcon className="text-base" />
          </Link>
        </div>

        {shown.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((group) => (
              <li key={group.id}>
                <GroupCard group={group} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface/40 p-8 text-center">
            <p className="text-sm text-muted">
              No groups yet. Create your first one above to get started.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

/** Decorative artwork on the create-group card (uploaded asset). */
function CreateIllustration() {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 lg:block"
      height={232}
      priority
      src="/images/create-illustration.png"
      unoptimized
      width={280}
    />
  );
}
