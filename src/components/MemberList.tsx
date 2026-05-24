import { useState } from "react";
import WarningButton from "./buttons/DangerButton";
import FilledButton from "./buttons/FilledButton";
import { removeMember, updateMemberRole } from "../services/groups";
import type { GroupMember, UserRole } from "../types/groups";

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'text-yellow-400',
  admin: 'text-blue-400',
  member: 'text-[var(--member-color)]',
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
      onMembersChanged(
        members.map((m) => m.user_id === target.user_id ? { ...m, role: newRole } : m)
      );
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not update role.');
    }
  };

  const canRemove = (target: GroupMember): boolean => {
    const isSelf = target.user_id === currentUserId;
    if (isSelf) return true;
    if (your_role === 'owner') return true;
    if (your_role === 'admin' && target.role === 'member') return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-headline-sm text-[var(--primary-color)]">Members</h3>
      {error && <p className="type-label-md text-red-400">{error}</p>}
      <ul className="divide-y divide-[var(--primary-gray)]">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-3">
            <div>
              <span className="type-body-md text-[var(--text-color)]">
                {m.username ?? `User #${m.user_id}`}
              </span>
              {m.user_id === currentUserId && (
                <span className="type-label-sm text-[var(--member-color)] ml-2">(you)</span>
              )}
              <span className={`ml-3 type-label-sm font-semibold capitalize ${ROLE_COLORS[m.role]}`}>
                {m.role}
              </span>
            </div>
            <div className="flex gap-2">
              {your_role === 'owner' && m.user_id !== currentUserId && m.role === 'member' && (
                <FilledButton label="Make Admin" onClick={() => handleRoleChange(m, 'admin')} />
              )}
              {your_role === 'owner' && m.user_id !== currentUserId && m.role === 'admin' && (
                <FilledButton label="Demote" onClick={() => handleRoleChange(m, 'member')} />
              )}
              {canRemove(m) && (
                <WarningButton
                  label={m.user_id === currentUserId ? 'Leave' : 'Remove'}
                  onClick={() => handleRemove(m)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
