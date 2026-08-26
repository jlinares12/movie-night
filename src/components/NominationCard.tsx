import { Skeleton, SkeletonGroup } from './Skeleton';
import type { MovieProposal } from '../types/groups';

/** Layout only — shared so the real card and its skeleton occupy identical space. */
const CARD = 'flex gap-md bg-surface-container rounded-[20px] p-md border border-outline-variant/20';

/**
 * Shared for the same reason `CARD` is — the poster is what dictates the card's height, so
 * the card and its skeleton cannot be allowed to drift apart.
 *
 * 120px left roughly 99px for the title and overview at 375px (335 content box − 48 card
 * padding − 120 poster − 24 gap − 44 delete button), so it steps down below `sm`.
 */
const POSTER = 'w-[80px] h-[120px] sm:w-[120px] sm:h-[180px] rounded-xl flex-shrink-0';

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
          className={`${POSTER} object-cover`}
        />
      ) : (
        <div className={`${POSTER} bg-surface-container-high`} />
      )}

      <div className="flex flex-col flex-1 min-w-0 gap-xs">
        <p className="type-headline-sm text-on-surface">{proposal.title}</p>

        {proposal.runtime_minutes && (
          <p className="type-label-sm text-on-surface-variant">{proposal.runtime_minutes} min</p>
        )}

        {/*
         * `body-md`, not something smaller, because that is what this line has always
         * rendered at. It used to carry a `body-sm` step that exists in no scale, so
         * Tailwind emitted nothing for it and the `<p>` fell through to the base rule in
         * `index.css` — Inter 1rem/1.6/400, i.e. exactly `body-md`. Naming the step it
         * already had keeps the skeleton's `h-4` lines below honest too.
         */}
        {proposal.overview && (
          <p className="type-body-md text-on-surface-variant line-clamp-3">{proposal.overview}</p>
        )}

        <div className="flex items-center gap-xs mt-auto">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            {initial}
          </div>
          <span className="type-label-sm text-on-surface-variant">{proposal.proposed_by_username}</span>
        </div>
      </div>

      {canDelete && (
        <button
          onClick={() => onDelete(proposal.id)}
          aria-label="Remove nomination"
          className="self-start inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
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
      {/* Poster — the block that dictates the card's height */}
      <Skeleton variant="rect" className={POSTER} />

      <div className="flex flex-col flex-1 min-w-0 gap-xs">
        {/* Title — type-headline-sm (27px) */}
        <Skeleton className="h-7 w-2/3" />
        {/* Runtime — type-label-sm (17px), the text variant's h-4 default */}
        <Skeleton className="w-20" />
        {/* Overview — type-body-md, the text variant's h-4 default; line-clamp-3 in the
            real card, so three lines is the ceiling */}
        <Skeleton lines={3} />

        <div className="flex items-center gap-xs mt-auto">
          <Skeleton variant="circle" className="w-6" />
          <Skeleton className="w-24" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
