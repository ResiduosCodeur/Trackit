import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { GroupIcon } from "@/components/CategoryIcon";
import PageShell, { BackLink } from "@/components/PageShell";
import { ArrowRightIcon } from "@/components/icons";
import { authOptions } from "@/lib/auth";
import { getGroupSummaries } from "@/lib/groupSummaries";
import CreateGroupButton from "../dashboard/CreateGroupButton";
import FocusCreateButton from "./FocusCreateButton";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const groups = await getGroupSummaries(session.user.email);

  return (
    <PageShell>
      <BackLink href="/dashboard">Back to dashboard</BackLink>

      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="tk-eyebrow">
            <span className="h-px w-6 bg-accent" />
            All groups
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Your groups
          </h1>
        </div>
        <div className="hidden sm:block">
          <FocusCreateButton />
        </div>
      </header>

      <section className="tk-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Create a new group</h2>
        <CreateGroupButton variant="compact" />
      </section>

      {groups.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="group tk-card flex items-center gap-4 p-4 transition-colors hover:border-accent/40 hover:bg-surface-2 sm:px-5"
              >
                <GroupIcon size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-ink">{group.name}</p>
                  <p className="text-sm text-muted">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-white/6 text-lg text-ink/80 transition-colors group-hover:bg-accent-strong group-hover:text-white">
                  <ArrowRightIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-surface/40 p-8 text-center">
          <p className="text-sm text-muted">No groups yet. Create one above to get started.</p>
        </div>
      )}
    </PageShell>
  );
}
