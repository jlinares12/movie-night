import type { MovieProposal } from '../types/groups';

interface Props {
  proposal: MovieProposal;
  canDelete: boolean;
  onDelete: (proposalId: number) => void;
}

export default function NominationCard({ proposal, canDelete, onDelete }: Props) {
  const initial = (proposal.proposed_by_username ?? '?').charAt(0).toUpperCase();

  return (
    <div className="flex gap-md bg-surface-container rounded-[20px] p-md border border-outline-variant/20">
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
