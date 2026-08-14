import { Skeleton, SkeletonGroup } from './Skeleton';
import type { MovieProposal } from '../types/groups';

/** Layout only — shared so the real card and its skeleton occupy identical space. */
const CARD = 'flex gap-md bg-surface-container rounded-[20px] p-md border border-outline-variant/20';

interface Props {
  proposal: MovieProposal;
  canDelete: boolean;
  onDelete: (proposalId: number) => void;
}

export default function NominationCard({ proposal, canDelete, onDelete }: Props) {
  const initial = (proposal.proposed_by_username ?? '?').charAt(0).toUpperCase();

  return (
    <div className={CARD}>
      {proposal.poster_url ? (
        <img
          src={proposal.poster_url}
          alt={proposal.title}
          className="w-[120px] h-[180px] rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-[120px] h-[180px] rounded-xl bg-surface-container-high flex-shrink-0" />
      )}

      <div className="flex flex-col flex-1 min-w-0 gap-xs">
        <p className="text-headline-sm text-on-surface">{proposal.title}</p>

        {proposal.runtime_minutes && (
          <p className="text-label-sm text-on-surface-variant">{proposal.runtime_minutes} min</p>
        )}

        {proposal.overview && (
          <p className="text-body-sm text-on-surface-variant line-clamp-3">{proposal.overview}</p>
        )}

        <div className="flex items-center gap-xs mt-auto">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            {initial}
          </div>
          <span className="text-label-sm text-on-surface-variant">{proposal.proposed_by_username}</span>
        </div>
      </div>

      {canDelete && (
        <button
          onClick={() => onDelete(proposal.id)}
          aria-label="Remove nomination"
          className="self-start p-xs rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
        </button>
      )}
    </div>
  );
}

/**
 * Mirrors the card above and owns its own sweep, clipped to the card's corners.
 *
 * The delete button is absent — it is gated on ownership of the proposal, which is part
 * of what is being fetched. It is self-start aligned next to a 180px poster, so its
 * absence costs no height.
 */
export function NominationCardSkeleton() {
  return (
    <SkeletonGroup label="Loading nomination" className={CARD}>
      {/* Poster — the block that dictates the card's 228px height */}
      <Skeleton variant="rect" className="w-[120px] h-[180px] rounded-xl flex-shrink-0" />

      <div className="flex flex-col flex-1 min-w-0 gap-xs">
        {/* Title — text-headline-sm (27px) */}
        <Skeleton className="h-7 w-2/3" />
        {/* Runtime — text-label-sm (17px), the text variant's h-4 default */}
        <Skeleton className="w-20" />
        {/* Overview — line-clamp-3 in the real card, so three lines is the ceiling */}
        <Skeleton lines={3} />

        <div className="flex items-center gap-xs mt-auto">
          <Skeleton variant="circle" className="w-6" />
          <Skeleton className="w-24" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
