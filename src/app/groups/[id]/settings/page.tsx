import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { GroupIcon } from "@/components/CategoryIcon";
import PageShell, { BackLink } from "@/components/PageShell";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DeleteGroupButton from "./DeleteGroupButton";
import GroupNameCard from "./GroupNameCard";
import GroupPermissions from "./GroupPermissions";
import LeaveGroupButton from "./LeaveGroupButton";
import SettingsMembers from "./SettingsMembers";

interface Group extends RowDataPacket {
  id: number;
  name: string;
  created_by: number;
  allow_member_rename: number;
  allow_member_add: number;
}

interface GroupMember extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  image: string | null;
}

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;
  const groupId = Number(id);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    notFound();
  }

  // Only members can see a group's settings
  const [groups] = await db.query<Group[]>(
    `
      SELECT user_groups.id, user_groups.name, user_groups.created_by,
        user_groups.allow_member_rename, user_groups.allow_member_add
      FROM user_groups
      INNER JOIN group_members ON group_members.group_id = user_groups.id
      INNER JOIN users AS viewer ON viewer.id = group_members.user_id
      WHERE user_groups.id = ? AND viewer.email = ?
      LIMIT 1
    `,
    [groupId, session.user.email],
  );

  const group = groups[0];

  if (!group) {
    notFound();
  }

  const [members] = await db.query<GroupMember[]>(
    `
      SELECT users.id, users.name, users.email, users.image
      FROM group_members
      INNER JOIN users ON users.id = group_members.user_id
      WHERE group_members.group_id = ?
      ORDER BY (users.id = ?) DESC, users.name
    `,
    [groupId, group.created_by],
  );

  const me = members.find((m) => m.email === session.user!.email);
  const isCreator = me?.id === group.created_by;
  const allowRename = Boolean(group.allow_member_rename);
  const allowAdd = Boolean(group.allow_member_add);

  // Who becomes leader if the current leader leaves (oldest account first)
  const successor = members
    .filter((m) => m.id !== group.created_by)
    .sort((a, b) => a.id - b.id)[0];

  return (
    <PageShell>
      <BackLink href={`/groups/${group.id}`}>Back to group</BackLink>

      <header className="flex items-center gap-4 sm:gap-5">
        <GroupIcon size={72} />
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Group settings
          </h1>
          <p className="mt-1 truncate text-lg text-muted">{group.name}</p>
        </div>
      </header>

      <GroupNameCard groupId={group.id} name={group.name} canEdit={isCreator || allowRename} />

      {isCreator ? (
        <GroupPermissions
          groupId={group.id}
          allowMemberRename={allowRename}
          allowMemberAdd={allowAdd}
        />
      ) : null}

      <SettingsMembers
        groupId={group.id}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          image: m.image,
        }))}
        creatorId={group.created_by}
        currentUserId={me?.id ?? null}
        canAdd={isCreator || allowAdd}
      />

      {me ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <LeaveGroupButton
            groupId={group.id}
            groupName={group.name}
            userId={me.id}
            note={
              isCreator
                ? successor
                  ? `You're the group leader. ${successor.name} will become the new leader when you leave.`
                  : "You're the only member, so leaving will delete the group and its expenses."
                : undefined
            }
          />
          <DeleteGroupButton
            groupId={group.id}
            groupName={group.name}
            disabled={!isCreator}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
