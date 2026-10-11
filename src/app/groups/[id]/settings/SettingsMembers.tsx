"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CrownIcon, MoreVerticalIcon, PlusIcon, UsersIcon } from "@/components/icons";
import AddMemberForm from "../AddMemberForm";

interface Member {
  id: number;
  name: string;
  email: string;
  image: string | null;
}

export default function SettingsMembers({
  groupId,
  members,
  creatorId,
  currentUserId,
  canAdd,
}: {
  groupId: number;
  members: Member[];
  creatorId: number;
  currentUserId: number | null;
  canAdd: boolean;
}) {
  const router = useRouter();
  const isCreator = currentUserId === creatorId;

  const [isAdding, setIsAdding] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Close the row menu on outside click / Escape
  useEffect(() => {
    if (menuFor === null) return;

    function onPointerDown(event: MouseEvent) {
      if (listRef.current && !listRef.current.contains(event.target as Node)) setMenuFor(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuFor(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuFor]);

  async function removeMember() {
    if (!toRemove) return;

    setIsRemoving(true);
    setRemoveError("");

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${toRemove.id}`, {
        method: "DELETE",
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setRemoveError(data.error ?? "Could not remove this person.");
        return;
      }

      setToRemove(null);
      router.refresh();
    } catch {
      setRemoveError("Could not remove this person. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <section className="tk-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-xl font-semibold text-ink">
          <UsersIcon className="text-2xl text-accent" />
          Members ({members.length})
        </h2>

        {canAdd && !isAdding ? (
          <button
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:border-accent/50 hover:text-ink"
            type="button"
            onClick={() => setIsAdding(true)}
          >
            <PlusIcon className="text-base" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add member</span>
          </button>
        ) : null}
      </div>

      {canAdd && isAdding ? (
        <div className="mt-4">
          <AddMemberForm groupId={groupId} onDone={() => setIsAdding(false)} />
        </div>
      ) : null}

      {/* Scrolls on its own so a long member list never pushes "Leave group" away */}
      <ul
        aria-label="Group members"
        className="mt-4 flex max-h-[22rem] flex-col gap-2 overflow-y-auto overscroll-contain pr-1"
        ref={listRef}
      >
        {members.map((member) => {
          const isOwner = member.id === creatorId;
          const isYou = member.id === currentUserId;
          const canRemove = isCreator && !isOwner && !isYou;

          return (
            <li
              className="relative flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-3 sm:gap-4 sm:px-4"
              key={member.id}
            >
              <Avatar name={member.name} seed={member.email} image={member.image} size={46} />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-1.5 text-[0.95rem] font-semibold text-ink">
                  <span className="truncate">{member.name}</span>
                  {isOwner ? <CrownIcon aria-label="Group creator" className="text-[#f0b429]" /> : null}
                  {isYou ? <span className="text-sm font-normal text-muted">(You)</span> : null}
                </p>
                <p className="truncate text-xs text-muted sm:text-sm">{member.email}</p>
              </div>

              <span className={`text-sm font-medium ${isOwner ? "text-accent" : "text-muted"}`}>
                {isOwner ? "Owner" : "Member"}
              </span>

              {/* Keeps role labels aligned whether or not a menu button is shown */}
              {isCreator ? (
                <span className="flex w-8 justify-center">
                  {canRemove ? (
                    <button
                      aria-expanded={menuFor === member.id}
                      aria-haspopup="menu"
                      aria-label={`Options for ${member.name}`}
                      className="flex size-8 items-center justify-center rounded-lg text-lg text-ink/70 transition-colors hover:bg-white/8 hover:text-ink"
                      type="button"
                      onClick={() => setMenuFor((cur) => (cur === member.id ? null : member.id))}
                    >
                      <MoreVerticalIcon />
                    </button>
                  ) : null}
                </span>
              ) : null}

              {menuFor === member.id ? (
                <div
                  className="absolute right-12 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-white/10 bg-surface-2 p-1 shadow-xl shadow-black/40"
                  role="menu"
                >
                  <button
                    className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-neg transition-colors hover:bg-neg/10"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMenuFor(null);
                      setRemoveError("");
                      setToRemove(member);
                    }}
                  >
                    Remove person
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {toRemove ? (
        <ConfirmDialog
          title="Remove person"
          message={`Are you sure you want to remove ${toRemove.name} from the group?`}
          error={removeError}
          busy={isRemoving}
          onYes={removeMember}
          onNo={() => {
            if (!isRemoving) setToRemove(null);
          }}
        />
      ) : null}
    </section>
  );
}
