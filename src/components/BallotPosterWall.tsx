import { useRef } from 'react';
import BallotPoster, { BallotPosterSkeleton, type BallotEntry } from './BallotPoster';

/**
 * Shared so the wall and its skeleton lay out identically. Three across at `lg` is what
 * the main column's 8-of-12 tracks fit comfortably at a 2:3 aspect; two across below it
 * keeps posters comparable at a glance, which is the whole point of a wall rather than
 * a list.
 */
const WALL = 'grid grid-cols-2 lg:grid-cols-3 gap-sm lg:gap-md';

interface Props {
  entries: BallotEntry[];
  /** The effective selection — `staged ?? myVote.proposal_id`. */
  checkedId: number | null;
  /** Server truth, which is what the stamp follows. */
  myVoteId: number | null;
  revealed: boolean;
  interactive: boolean;
  /** Briefly ringed when the ballot box's "pick another" link points here. */
  pulsing?: boolean;
  onSelect: (proposalId: number) => void;
}

/**
 * The poster wall: a `radiogroup` of nominations during `voting`, a results grid after.
 *
 * The wall is *always live* while the session is in `voting` — before your vote and
 * after it. There is no mode, no unlock step and no dead tap that would need a "why did
 * nothing happen" explanation, because tapping stages rather than casts and a stray tap
 * therefore costs nothing.
 *
 * `entries` is rendered in the order it arrives. `results` is pre-sorted by the backend
 * (`vote_count` DESC, then `proposal_id` ASC) and includes zero-vote nominations; both
 * are inherited guarantees, and the ordering one is what stops a tie reshuffling under
 * someone between refetches. Do not sort, filter or reshape here.
 */
export default function BallotPosterWall({
  entries, checkedId, myVoteId, revealed, interactive, pulsing = false, onSelect,
}: Props) {
  const tiles = useRef<(HTMLElement | null)[]>([]);

  /*
   * `results[0]` is the leader by the backend's ordering, but ordering alone does not
   * make it a winner: on a tie the sort falls back to `proposal_id` ASC, so the lowest
   * id would be crowned for reasons that have nothing to do with the vote. Nothing here
   * breaks a tie — the session owner does, by advancing the session — so a tie crowns
   * nobody and the counts speak for themselves.
   */
  const outrightLeader =
    entries.length > 0 &&
    entries[0].voteCount > 0 &&
    (entries.length === 1 || entries[0].voteCount > entries[1].voteCount);

  // Roving tabindex, per native radio semantics: one stop for the whole group, and the
  // arrows move within it. Falls back to the first tile so a group with nothing selected
  // is still reachable by Tab.
  const activeIndex = Math.max(0, entries.findIndex((e) => e.proposalId === checkedId));

  // Arrow keys move *and* select, which is what a native radio group does; Space and
  // Enter are the button's own activation and need no handling here.
  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = (index + step + entries.length) % entries.length;
    tiles.current[next]?.focus();
    onSelect(entries[next].proposalId);
  };

  const grid = (
    <div className={`${WALL} rounded-[24px] ${pulsing ? 'ballot-wall-pulse' : ''}`}>
      {entries.map((entry, i) => (
        <BallotPoster
          key={entry.proposalId}
          ref={(el) => { tiles.current[i] = el; }}
          entry={entry}
          checked={entry.proposalId === checkedId}
          isMyVote={entry.proposalId === myVoteId}
          hasVoted={myVoteId !== null}
          revealed={revealed}
          winner={revealed && i === 0 && outrightLeader}
          maxVotes={entries[0]?.voteCount ?? 0}
          interactive={interactive}
          tabIndex={interactive ? (i === activeIndex ? 0 : -1) : undefined}
          onSelect={() => onSelect(entry.proposalId)}
          onKeyDown={handleKeyDown(i)}
        />
      ))}
    </div>
  );

  if (!interactive) return grid;

  return (
    <div role="radiogroup" aria-label="Nominations — pick one to vote for">
      {grid}
    </div>
  );
}

/** First paint of the wall, behind `useSessionVoting`'s single `loading` flag. */
export function BallotPosterWallSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={WALL}>
      {Array.from({ length: count }, (_, i) => <BallotPosterSkeleton key={i} />)}
    </div>
  );
}
