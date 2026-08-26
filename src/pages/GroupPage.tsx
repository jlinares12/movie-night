import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGroup, deleteGroup } from "../services/groups";
import { ApiError } from "../services/apiError";
import { useGroupEvents } from "../hooks/useGroupEvents";
import { useCurrentUser } from "../hooks/useCurrentUser";
import InviteCodePanel, { InviteCodePanelSkeleton } from "../components/InviteCodePanel";
import MemberList, { MemberListSkeleton } from "../components/MemberList";
import SessionList, { SessionListSkeleton } from "../components/SessionList";
import DangerButton from "../components/buttons/DangerButton";
import { Skeleton, SkeletonGroup } from "../components/Skeleton";
import type { GroupDetail, GroupMember, Session, SessionStatus, UserRole } from "../types/groups";

/** Layout only — shared so the real bento grid and its skeleton place panels identically. */
const HEADER = 'pb-lg';
const GRID = 'grid grid-cols-1 lg:grid-cols-12 gap-gutter';

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const groupId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    getGroup(groupId)
      .then((res) => { setGroup(res.data); setLoading(false); })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 403) setError('You are not a member of this group.');
          else if (err.status === 404) setError('Group not found.');
          else setError(err.message);
        } else {
          setError('Failed to load group.');
        }
        setLoading(false);
      });
  }, [groupId]);

  useGroupEvents(groupId ?? 0, {
    onMemberJoined: (data) => {
      if (!group) return;
      const newMember: GroupMember = {
        id: Date.now(),
        user_id: data.user_id,
        group_id: group.id,
        role: data.role as UserRole,
        joined_at: data.joined_at,
        username: data.username,
      };
      setGroup((g) => g ? { ...g, members: [...g.members, newMember] } : g);
    },
    onMemberLeft: (data) => {
      setGroup((g) => g ? { ...g, members: g.members.filter((m) => m.user_id !== data.user_id) } : g);
    },
    onMemberRoleChanged: (data) => {
      setGroup((g) => g ? {
        ...g,
        members: g.members.map((m) => m.user_id === data.user_id ? { ...m, role: data.new_role as UserRole } : m),
      } : g);
    },
    onSessionCreated: (data) => {
      setGroup((g) => g ? { ...g, sessions: [data, ...g.sessions] } : g);
    },
    onSessionUpdated: (data) => {
      setGroup((g) => g ? {
        ...g,
        sessions: g.sessions.map((s) =>
          s.id === data.session_id
            ? { ...s, status: data.status as SessionStatus, scheduled_for: data.scheduled_for }
            : s
        ),
      } : g);
    },
    onSessionDeleted: (data) => {
      setGroup((g) => g ? { ...g, sessions: g.sessions.filter((s) => s.id !== data.session_id) } : g);
    },
    onInviteCodeChanged: (data) => {
      setGroup((g) => g ? { ...g, invite_code: data.invite_code } : g);
    },
    onGroupUpdated: (data) => {
      setGroup((g) => g ? { ...g, ...data } : g);
    },
    onGroupDeleted: () => {
      navigate('/');
    },
  });

  if (!id) {
    return (
      <div className="text-on-surface-variant type-body-md">
        Select a group from the sidebar.
      </div>
    );
  }

  // Swapped out on load, never hidden — a `SkeletonGroup`'s `role="status"` lives for as
  // long as it is mounted, and a live region asserting "Loading…" over settled content is
  // worse than no announcement at all.
  if (loading) return <GroupPageSkeleton />;

  if (error || !group) {
    return <div className="type-body-md text-error">{error || 'Unknown error.'}</div>;
  }

  const canDelete = group.your_role === 'owner';

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${group.name}" and all its sessions?`)) return;
    try {
      await deleteGroup(group.id);
      navigate('/');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete group.');
    }
  };

  return (
    <div>
      {/* Header */}
      <header className={`${HEADER} flex flex-col md:flex-row justify-between items-start md:items-end gap-md`}>
        <div>
          {/*
           * `overflow-wrap: anywhere`, not `break-words`: only `anywhere` affects intrinsic
           * sizing, and this <h2> is a shrink-to-fit flex item whose min-content width is
           * what sets this column. A single unbroken group name would otherwise blow the
           * gutter at 375px on its own. Same idiom as `InviteCodePanel`'s code span.
           */}
          <h2 className="type-display-lg-mobile lg:type-display-lg text-primary leading-none mb-sm [overflow-wrap:anywhere]">{group.name}</h2>
          {group.description && (
            <p className="type-body-lg text-on-surface-variant max-w-2xl">{group.description}</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary type-label-sm uppercase tracking-widest capitalize">
              {group.your_role}
            </span>
            <span className="text-on-surface-variant type-label-sm">• {group.members.length} Members</span>
          </div>
        </div>
        {canDelete && (
          <DangerButton icon="delete" label="Delete Group" onClick={handleDelete} />
        )}
      </header>

      {/* Bento grid */}
      <div className={GRID}>
        <div className="lg:col-span-4">
          <InviteCodePanel
            groupId={group.id}
            invite_code={group.invite_code}
            your_role={group.your_role}
            onCodeChanged={(code) => setGroup((g) => g ? { ...g, invite_code: code } : g)}
          />
        </div>

        <div className="lg:col-span-8">
          {currentUser && (
            <MemberList
              groupId={group.id}
              members={group.members}
              your_role={group.your_role}
              currentUserId={currentUser.id}
              onMembersChanged={(updated) => setGroup((g) => g ? { ...g, members: updated } : g)}
            />
          )}
        </div>

        <div className="lg:col-span-12">
          <SessionList
            groupId={group.id}
            sessions={group.sessions}
            your_role={group.your_role}
            onSessionCreated={(s: Session) =>
              setGroup((g) => g ? { ...g, sessions: [s, ...g.sessions] } : g)
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * First paint of the route. The three panels each mimic a component and therefore own
 * their own group and sweep — the same rule `GroupLinkSkeleton` follows — so this is a
 * plain layout wrapper, not a group. Only the header, which has no component of its own,
 * is grouped here.
 *
 * Consequence worth knowing: four sibling `role="status"` regions announce at once on
 * this route. That is the accepted cost of self-contained skeletons; the alternative is
 * one group around the whole page, which would make a bare `<MemberListSkeleton />`
 * silently sweep-less.
 *
 * Role-gated controls (Delete Group, the regenerate icon, New Session) are omitted
 * throughout — `your_role` is precisely what the in-flight request is fetching, and a
 * skeleton that guesses a permission is wrong half the time.
 */
export function GroupPageSkeleton() {
  return (
    <div>
      <SkeletonGroup label="Loading group" className={HEADER}>
        {/* Group name — `leading-none` makes the line box exactly the font size, so this
            is 48px at lg and 32px below it, not 38px. */}
        <Skeleton className="h-8 lg:h-12 w-72 max-w-full mb-sm" />

        {/* Description — optional on the real header, but included: most groups have one,
            and under-sizing every group that does is the worse of the two errors. */}
        <Skeleton className="h-7 w-[28rem] max-w-full" />

        <div className="mt-4 flex items-center gap-2">
          {/* Role pill — px-3 py-1 ×2 + type-label-sm ≈ 25px */}
          <Skeleton variant="rect" className="h-6 w-24 rounded-full" />
          <Skeleton className="w-28" />
        </div>
      </SkeletonGroup>

      <div className={GRID}>
        <div className="lg:col-span-4"><InviteCodePanelSkeleton /></div>
        <div className="lg:col-span-8"><MemberListSkeleton /></div>
        <div className="lg:col-span-12"><SessionListSkeleton /></div>
      </div>
    </div>
  );
}
