import { useState } from "react";
import { removeMember, updateMemberRole } from "../services/groups";
import type { GroupMember, UserRole } from "../types/groups";

const ROLE_BADGE: Record<UserRole, { label: string; color: string; border: string }> = {
  owner:  { label: 'Owner',  color: 'text-primary',            border: 'border-2 border-primary' },
  admin:  { label: 'Admin',  color: 'text-secondary',          border: 'border-2 border-on-secondary-container' },
  member: { label: 'Member', color: 'text-on-surface-variant', border: '' },
};

interface Props {
  groupId: number;
  members: GroupMember[];
  your_role: UserRole;
  currentUserId: number;
  onMembersChanged: (updated: GroupMember[]) => void;
}

export default function MemberList({ groupId, members, your_role, currentUserId, onMembersChanged }: Props) {
  const [error, setError] = useState('');

  const handleRemove = async (target: GroupMember) => {
    const isSelf = target.user_id === currentUserId;
    const label = isSelf ? 'Leave group?' : `Remove ${target.username ?? 'this member'}?`;
    if (!confirm(label)) return;
    setError('');
    try {
      await removeMember(groupId, target.user_id);
      onMembersChanged(members.filter((m) => m.user_id !== target.user_id));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Action failed.');
    }
  };

  const handleRoleChange = async (target: GroupMember, newRole: 'admin' | 'member') => {
    setError('');
    try {
      await updateMemberRole(groupId, target.user_id, newRole);
      onMembersChanged(members.map((m) => m.user_id === target.user_id ? { ...m, role: newRole } : m));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not update role.');
    }
  };

  const canRemove = (target: GroupMember): boolean => {
    if (target.user_id === currentUserId) return true;
    if (your_role === 'owner') return true;
    if (your_role === 'admin' && target.role === 'member') return true;
    return false;
  };

  const initial = (m: GroupMember) => (m.username ?? '?')[0].toUpperCase();

  return (
    <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant cinematic-glow h-full">
      <div className="flex items-center justify-between mb-lg">
        <h3 className="type-headline-sm text-on-surface">Active Members</h3>
        <span className="type-label-sm text-on-surface-variant">{members.length} total</span>
      </div>

      {error && <p className="type-label-sm text-error mb-sm">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        {members.map((m) => {
          const badge = ROLE_BADGE[m.role];
          const isSelf = m.user_id === currentUserId;
          return (
            <div
              key={m.id}
              className="flex items-center gap-md p-sm bg-surface-container rounded-lg border border-transparent neon-border-hover transition-all"
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 ${badge.border}`}>
                <span className="type-label-md text-on-surface">{initial(m)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="type-label-md text-on-surface truncate">
                  {m.username ?? `User #${m.user_id}`}
                  {isSelf && <span className="text-on-surface-variant ml-1">(you)</span>}
                </p>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              {/* Actions */}
              {(your_role === 'owner' && !isSelf) && (
                <div className="flex gap-1">
                  {m.role === 'member' && (
                    <button
                      onClick={() => handleRoleChange(m, 'admin')}
                      title="Promote to admin"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-highest transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
                    </button>
                  )}
                  {m.role === 'admin' && (
                    <button
                      onClick={() => handleRoleChange(m, 'member')}
                      title="Demote to member"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_downward</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(m)}
                    title="Remove member"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_remove</span>
                  </button>
                </div>
              )}
              {(your_role === 'admin' && m.role === 'member' && !isSelf) && (
                <button
                  onClick={() => handleRemove(m)}
                  title="Remove member"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_remove</span>
                </button>
              )}
              {isSelf && (
                <button
                  onClick={() => handleRemove(m)}
                  title="Leave group"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
