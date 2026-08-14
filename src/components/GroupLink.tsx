import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/apiError";
import OutlinedButton from "./buttons/OutlinedButton";
import DangerButton from "./buttons/DangerButton";
import { Skeleton, SkeletonGroup } from "./Skeleton";
import { removeMember } from "../services/groups";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { GroupSummary, UserRole } from "../types/groups";

interface Props {
  group: GroupSummary;
  onLeave: () => void;
}

/**
 * Layout only — the real card and its skeleton must occupy identical space, so these
 * classes are shared rather than duplicated. Hover and cursor affordances stay on the
 * real card; nothing about a skeleton is interactive.
 */
const CARD =
  'col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low rounded-[24px] p-md ' +
  'border border-outline-variant/20';

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
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not leave group.');
    }
  };

  return (
    <div
      onClick={() => navigate(`/group/${group.id}`)}
      className={`${CARD} movie-card-glow group cursor-pointer`}
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
        <DangerButton icon="logout" label="Leave" onClick={handleLeave} />
      </div>
    </div>
  );
}

/**
 * Mirrors the card above, region for region. It is its own `SkeletonGroup`, so the sweep is
 * clipped to this card's rounded corners and the card reads as one object catching light
 * rather than as six blocks pulsing out of step. Self-contained — drop it anywhere a
 * `GroupLink` would go.
 *
 * The role badge is deliberately absent: it is absolutely positioned over the hero, so it
 * costs no layout, and a same-toned pill over a same-toned block would be invisible anyway.
 */
export function GroupLinkSkeleton() {
  return (
    <SkeletonGroup label="Loading group" className={CARD}>
      {/* Hero — the one measurement that must be exact; it dominates the card's height. */}
      <Skeleton variant="rect" className="h-48 mb-md rounded-xl" />

      {/* Group name — h-8 ≈ type-headline-md (1.5rem × 1.3 = 31.2px) */}
      <Skeleton className="h-8 w-2/3 mb-1" />

      {/* Member count — 18px icon + type-label-md (0.875rem × 1.4 = 19.6px) */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="circle" className="w-[18px]" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* Status box — p-sm ×2 + label + mb-1 + value ≈ 70px. The left accent keeps the
          silhouette; border-box means it costs no height. */}
      <Skeleton
        variant="rect"
        className="h-[70px] rounded-lg mb-6 border-outline-variant"
      />

      {/* Actions — py-3 ×2 + type-label-md + border ≈ 44px */}
      <div className="flex items-center gap-2">
        <Skeleton variant="rect" className="h-11 w-40 rounded-xl" />
        <Skeleton variant="rect" className="h-11 w-28 rounded-xl" />
      </div>
    </SkeletonGroup>
  );
}
