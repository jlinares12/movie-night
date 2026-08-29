import { forwardRef } from 'react';
import { Skeleton, SkeletonGroup } from './Skeleton';
import type { TallyVoter } from '../types/voting';

/**
 * One nomination as the wall sees it: the tally entry, plus the proposer recovered by
 * `VotingPanel`'s join against the proposals `SessionPage` already fetched.
 *
 * `voteCount` and `voters` are carried even while they are hidden — the panel decides
 * whether they render, and it decides once, so there is no second place to forget.
 */
export interface BallotEntry {
  proposalId: number;
  title: string;
  posterUrl: string | null;
  proposedByUsername: string | null;
  voteCount: number;
  voters: TallyVoter[] | null;
}

/**
 * Layout only — shared so the real tile and its skeleton occupy identical space, the
 * `CARD`/`POSTER` precedent from `NominationCard`. 2:3 is the poster aspect every
 * artwork source in this app hands back, so the grid never jitters on a missing image.
 */
const TILE   = 'group relative flex flex-col gap-xs text-left';
const POSTER = 'relative w-full aspect-[2/3] rounded-[20px] overflow-hidden border transition-all';

interface Props {
  entry: BallotEntry;
  /** The *effective* selection — `staged ?? myVote.proposal_id`. */
  checked: boolean;
  /** Server truth: this is the tile the stamp belongs on. */
  isMyVote: boolean;
  /** Whether the member has voted at all, which is what flips the action label. */
  hasVoted: boolean;
  /** Counts and identities are published only once the session leaves `voting`. */
  revealed: boolean;
  /** Results state: the outright leader. A tie crowns nobody — see `BallotPosterWall`. */
  winner?: boolean;
  /** Highest count in the tally, for the bar's scale. Never rendered as a number. */
  maxVotes?: number;
  interactive: boolean;
  tabIndex?: number;
  onSelect?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
}

/**
 * A single poster on the wall.
 *
 * During `voting` it is a `role="radio"` — the whole interaction is structurally a radio
 * group plus a submit button, and building it as one is what makes it legible to a
 * screen reader (and to Playwright) without inventing anything. Once the session leaves
 * `voting` nothing is selectable any more, so the role goes with the interactivity
 * rather than lingering as a lie.
 *
 * Tapping never casts — it stages. That is what makes a stray tap free, which is in turn
 * why the wall needs no locked state before or after a vote.
 */
const BallotPoster = forwardRef<HTMLElement, Props>(function BallotPoster(
  { entry, checked, isMyVote, hasVoted, revealed, winner = false, maxVotes = 0, interactive, tabIndex, onSelect, onKeyDown },
  ref,
) {
  const initial = (entry.proposedByUsername ?? '?').charAt(0).toUpperCase();
  const share = maxVotes > 0 ? Math.round((entry.voteCount / maxVotes) * 100) : 0;

  /*
   * "Selected" rather than "Switch to this" once a tile is staged: the label describes
   * what the tile *is* now, and repeating the invitation on a tile you have already
   * picked reads as though the tap did not register.
   */
  const actionLabel = isMyVote ? 'Your pick' : checked ? 'Selected' : hasVoted ? 'Switch to this' : 'Vote';

  /*
   * Where the emphasis goes flips with the phase, which is the whole difference between
   * a ballot and a result. While voting, the highlight follows *your* selection — that
   * is the only thing on screen you control. Once the counts are published it follows
   * the winner instead: your own pick is already marked by the stamp, and leaving the
   * bright treatment on it would make every member's results page crown a different
   * movie.
   */
  const emphasised = interactive ? checked : winner;

  const posterFrame = [
    POSTER,
    emphasised
      ? 'border-primary shadow-[0_0_28px_-6px_rgb(var(--color-primary)/0.55)]'
      : 'border-outline-variant/20 group-hover:border-primary/40',
    winner ? 'lg:scale-[1.03]' : '',
  ].join(' ');

  const body = (
    <>
      <div className={posterFrame}>
        {entry.posterUrl ? (
          <img src={entry.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
            <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '40px' }}>
              movie
            </span>
          </div>
        )}

        {/* Dim the artwork behind the labels so a bright poster cannot swallow them. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/95 to-transparent" />

        {isMyVote && (
          <span
            aria-hidden="true"
            className="
              absolute right-sm top-sm ballot-stamp-in
              rounded-full border-2 border-primary bg-background/80 px-sm py-xs
              type-label-sm text-primary font-bold tracking-widest
            "
          >
            VOTED
          </span>
        )}

        {/* The action label sits on the artwork, so the tile needs no second row of
            chrome and the grid stays a grid of posters. */}
        <span
          className={`absolute inset-x-sm bottom-sm inline-flex items-center justify-center gap-xs rounded-full px-sm py-xs type-label-sm ${
            emphasised ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high/90 text-on-surface'
          }`}
        >
          {interactive && (
            <span aria-hidden="true" className="material-symbols-outlined w-[14px] shrink-0 overflow-hidden leading-none" style={{ fontSize: '14px' }}>
              {checked ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          )}
          {/* `winner` before `isMyVote`: when the movie you voted for wins, the win is
              the news, and the stamp on the artwork already says it was your pick. */}
          {interactive ? actionLabel : winner ? 'Winner' : isMyVote ? 'Your pick' : 'Nominated'}
        </span>
      </div>

      <span className="type-label-md text-on-surface line-clamp-2">{entry.title}</span>

      <span className="flex items-center gap-xs">
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          {initial}
        </span>
        <span className="type-label-sm text-on-surface-variant">{entry.proposedByUsername ?? 'Unknown'}</span>
      </span>

      {/*
       * Counts and identities exist on the tally during `voting` too — not rendering
       * them is the mitigation, so this is the one gate and it lives here.
       */}
      {revealed && (
        <span className="flex flex-col gap-xs">
          <span aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <span
              className={`block h-full rounded-full ${winner ? 'bg-primary' : 'bg-primary/40'}`}
              style={{ width: `${share}%` }}
            />
          </span>
          <span data-testid="vote-count" className="type-label-sm text-on-surface">
            {entry.voteCount} {entry.voteCount === 1 ? 'vote' : 'votes'}
          </span>
          {entry.voters && entry.voters.length > 0 && (
            <span className="flex flex-wrap gap-xs">
              {entry.voters.map((v) => (
                <span
                  key={v.user_id}
                  data-testid="ballot-voter"
                  className="rounded-full bg-surface-container-high px-sm py-xs type-label-sm text-on-surface-variant"
                >
                  {v.username ?? 'Someone'}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </>
  );

  if (!interactive) {
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={TILE}>
        {body}
      </div>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`${TILE} rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      {body}
    </button>
  );
});

export default BallotPoster;

/**
 * Mirrors the tile above and owns its own sweep. The action label and the stamp are
 * absent: both are gated on the vote being fetched, and both sit *on* the poster, so
 * their absence costs no height.
 */
export function BallotPosterSkeleton() {
  return (
    <SkeletonGroup label="Loading nomination" className={TILE}>
      <Skeleton variant="rect" className="w-full aspect-[2/3] rounded-[20px]" />
      {/* Title — type-label-md (20px) */}
      <Skeleton className="h-5 w-3/4" />
      <div className="flex items-center gap-xs">
        <Skeleton variant="circle" className="w-5" />
        <Skeleton className="w-20" />
      </div>
    </SkeletonGroup>
  );
}
