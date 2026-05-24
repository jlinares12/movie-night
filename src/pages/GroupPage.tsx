import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getGroup, deleteGroup } from "../services/groups";
import { useGroupEvents } from "../hooks/useGroupEvents";
import { useCurrentUser } from "../hooks/useCurrentUser";
import InviteCodePanel from "../components/InviteCodePanel";
import MemberList from "../components/MemberList";
import SessionList from "../components/SessionList";
import WarningButton from "../components/buttons/DangerButton";
import type { GroupDetail, GroupMember, Session, SessionStatus } from "../types/groups";

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
        const status = err?.response?.status;
        if (status === 403) setError('You are not a member of this group.');
        else if (status === 404) setError('Group not found.');
        else setError('Failed to load group.');
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
        role: data.role as any,
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
        members: g.members.map((m) => m.user_id === data.user_id ? { ...m, role: data.new_role as any } : m),
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
      <div className="p-8 text-[var(--member-color)]">
        Select a group from the sidebar.
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-[var(--member-color)]">Loading…</div>;
  }

  if (error || !group) {
    return <div className="p-8 text-red-400">{error || 'Unknown error.'}</div>;
  }

  const canDelete = group.your_role === 'owner';

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${group.name}" and all its sessions?`)) return;
    try {
      await deleteGroup(group.id);
      navigate('/');
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Could not delete group.');
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--primary-color)]">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-[var(--member-color)] mt-1">{group.description}</p>
          )}
          <p className="text-xs text-[var(--member-color)] mt-1 capitalize">Your role: {group.your_role}</p>
        </div>
        {canDelete && (
          <WarningButton label="Delete Group" onClick={handleDelete} />
        )}
      </div>

      <InviteCodePanel
        groupId={group.id}
        invite_code={group.invite_code}
        your_role={group.your_role}
        onCodeChanged={(code) => setGroup((g) => g ? { ...g, invite_code: code } : g)}
      />

      {currentUser && (
        <MemberList
          groupId={group.id}
          members={group.members}
          your_role={group.your_role}
          currentUserId={currentUser.id}
          onMembersChanged={(updated) => setGroup((g) => g ? { ...g, members: updated } : g)}
        />
      )}

      <SessionList
        groupId={group.id}
        sessions={group.sessions}
        your_role={group.your_role}
        onSessionCreated={(s: Session) =>
          setGroup((g) => g ? { ...g, sessions: [s, ...g.sessions] } : g)
        }
      />
    </div>
  );
}
