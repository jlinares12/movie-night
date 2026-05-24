import { useNavigate } from "react-router-dom";
import OutlinedButton from "./buttons/OutlinedButton";
import { removeMember } from "../services/groups";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { GroupSummary, UserRole } from "../types/groups";

interface Props {
  group: GroupSummary;
  onLeave: () => void;
}

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  owner:  { label: 'Owner',  className: 'bg-primary text-on-primary' },
  admin:  { label: 'Admin',  className: 'bg-secondary-container text-on-secondary-container' },
  member: { label: 'Member', className: 'bg-surface-variant text-on-surface-variant' },
};

const roleStatus: Record<UserRole, { borderColor: string; labelColor: string; label: string }> = {
  owner:  { borderColor: 'border-primary',   labelColor: 'text-primary',            label: 'Invite Code' },
  admin:  { borderColor: 'border-secondary', labelColor: 'text-secondary',          label: 'Invite Code' },
  member: { borderColor: 'border-outline',   labelColor: 'text-on-surface-variant', label: 'Member Since' },
};

export default function GroupLink({ group, onLeave }: Props) {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const formattedDate = new Date(group.created_at).toLocaleDateString();
  const badge = roleBadge[group.your_role];
  const status = roleStatus[group.your_role];

  const handleLeave = async () => {
    if (!currentUser) return;
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await removeMember(group.id, currentUser.id);
      onLeave();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Could not leave group.';
      alert(msg);
    }
  };

  return (
    <div
      onClick={() => navigate(`/group/${group.id}`)}
      className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low rounded-[24px] p-md border border-outline-variant/20 movie-card-glow group cursor-pointer"
    >
      {/* Hero */}
      <div className="relative h-48 mb-md rounded-xl overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface/10 group-hover:scale-110 transition-transform duration-500 select-none" style={{ fontSize: '80px' }}>movie</span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
        <span className={`absolute top-4 right-4 ${badge.className} type-label-sm px-3 py-1 rounded-full`}>
          {badge.label}
        </span>
      </div>

      {/* Group name */}
      <h3 className="type-headline-md mb-1">{group.name}</h3>

      {/* Member count */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>group</span>
        <span className="type-label-md">
          {group.member_count} {group.member_count === 1 ? 'Member' : 'Members'}
        </span>
      </div>

      {/* Status box */}
      <div className={`p-sm bg-surface-variant/30 rounded-lg mb-6 border-l-2 ${status.borderColor}`}>
        <p className={`type-label-sm ${status.labelColor} uppercase tracking-wider mb-1`}>{status.label}</p>
        <p className="type-body-md">
          {group.your_role === 'member' ? formattedDate : group.invite_code}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <OutlinedButton label="Nominate Movie" isDisabled />
        <button
          onClick={handleLeave}
          title="Leave group"
          className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl type-label-sm text-error/50 hover:text-error hover:bg-error/10 transition-all duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
          Leave
        </button>
      </div>
    </div>
  );
}
