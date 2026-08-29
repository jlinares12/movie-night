import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSessionVoting } from '../hooks/useSessionVoting';
import BallotBox from './BallotBox';
import BallotPosterWall, { BallotPosterWallSkeleton } from './BallotPosterWall';
import type { BallotEntry } from './BallotPoster';
import type { MovieProposal, SessionStatus } from '../types/groups';

const PULSE_MS = 2400;

/*
 * The session machine is one-directional: open → voting → decided → closed, the same
 * order `STATUS_ORDER` enforces in `api/app/routes/sessions.py`. Positions in it are
 * what make "the tally is fresher than the page" a decidable claim rather than just a
 * difference — see `onStatusChange` below.
 */
const STATUS_ORDER: SessionStatus[] = ['open', 'voting', 'decided', 'closed'];

/*
 * A plain `div`, deliberately not a `section`. The hero is the only `<section>` on
 * `SessionPage`, and `e2e/specs/sessions.spec.ts` scopes its status-badge assertion with
 * `locator('section')` on exactly that basis — a second one here resolves that locator to
 * two elements and fails the spec under Playwright's strict mode. A `<section>` carries no
 * landmark semantics without an accessible name anyway, so nothing is lost; the box's own
 * `<aside>` is where this subtree's landmark lives.
 */
const PANEL = 'flex flex-col gap-md';

interface Props {
  groupId: number;
  sessionId: number;
  /** `SessionPage`'s own copy. The tally's `session_status` outranks it — see below. */
  status: SessionStatus;
  /** Already fetched by `SessionPage`; joined here rather than fetched again. */
  proposals: MovieProposal[];
  onStatusChange?: (status: SessionStatus) => void;
}

/**
 * The member-facing voting experience: a poster wall for browsing, a ballot box for
 * committing, and a stage-then-commit interaction between the two.
 *
 * Owns `staged` and nothing else — every other value here is derived from the hook or
 * from the props, so there is exactly one place a vote can come from.
 *
 * ── Secrecy ──
 * `GET /votes/tally` returns real `vote_count` values during `voting` and we
 * deliberately do not render them. A running score visibly steers the last voters in a
 * small group, and it is partially deanonymising on its own — in a three-member group,
 * voting for A and seeing A at one vote tells you the other two did not. Not publishing
 * is the cheapest and most complete mitigation. What *is* published is
 * `total_votes` / `eligible_voters`: the one social signal that helps, naming nobody.
 * Role does not unlock any of this, which is why this component has no idea who is
 * asking.
 *
 * ── Refresh policy ──
 * Focus-refetch, no polling. `/events` is still a stub, and with counts hidden the only
 * things that go stale during `voting` are the participation line and the session
 * status — neither worth a timer, and neither worth a request against a backgrounded
 * tab. When SSE lands it replaces the focus listener and nothing else.
 *
 * ── The mid-vote race ──
 * An owner can advance the session to `decided` while a member is deciding, and with no
 * SSE the client learns of it only when its `PUT` comes back 409. So *any* failed cast
 * un-stages and refetches both endpoints — refetching on every error rather than on a
 * matched message avoids string-matching backend copy, and covers `404 proposal not
 * found` (someone deleted the nomination mid-vote) down the same path. Afterwards the
 * tally's `session_status` is fresher than the `status` this was handed, so it flows
 * back up through `onStatusChange` and the page's hero badge stays in step.
 */
export default function VotingPanel({ groupId, sessionId, status, proposals, onStatusChange }: Props) {
  const { myVote, tally, loading, error, castingId, castVote, refetch } = useSessionVoting(groupId, sessionId);

  const [staged, setStaged] = useState<number | null>(null);
  const [castInterrupted, setCastInterrupted] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [voteVerb, setVoteVerb] = useState<'cast' | 'changed'>('cast');

  const wallRef = useRef<HTMLDivElement>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastError = useRef('');
  const prevVoteId = useRef<number | null>(null);
  const prevStatus = useRef(status);

  const tallyStatus = tally?.session_status ?? null;
  // The tally is authoritative: after a refetch it can be a phase ahead of the copy
  // `SessionPage` is holding, and a stale badge beside a corrected panel is worse than
  // no badge at all.
  const phase = tallyStatus ?? status;
  const votable = phase === 'voting';
  const revealed = !votable;

  const myVoteId = myVote?.proposal_id ?? null;

  /*
   * `results` carries only proposal_id/title/poster_url/vote_count/voters, so the
   * proposer comes from the proposals the page already has. This is a *left* join: the
   * tally decides which posters exist, the proposals only decorate them. A nomination
   * with no match still renders, just without a name.
   *
   * Order is inherited, never re-derived — `results` arrives pre-sorted `vote_count`
   * DESC then `proposal_id` ASC, and that guarantee is what stops a tie reshuffling
   * under someone between refetches.
   */
  const entries: BallotEntry[] = useMemo(() => {
    const byId = new Map(proposals.map((p) => [p.id, p]));
    return (tally?.results ?? []).map((r) => ({
      proposalId: r.proposal_id,
      title: r.title,
      posterUrl: r.poster_url,
      proposedByUsername: byId.get(r.proposal_id)?.proposed_by_username ?? null,
      voteCount: r.vote_count,
      voters: r.voters,
    }));
  }, [tally, proposals]);

  // Staging the movie you already voted for is a no-op that resolves to CAST — the
  // "never mind, I'll keep it" the state table calls for, with no separate control. It
  // is also what clears the staging after a successful cast, since the hook writes the
  // new `myVote` before this next renders.
  const effectiveStaged = staged !== null && staged !== myVoteId ? staged : null;
  const checkedId = effectiveStaged ?? myVoteId;

  const stagedEntry = entries.find((e) => e.proposalId === effectiveStaged) ?? null;
  const votedEntry  = entries.find((e) => e.proposalId === myVoteId) ?? null;

  // Focus-refetch. `refetch` has empty deps precisely so it can sit here without
  // re-arming the listener on every render.
  useEffect(() => {
    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, [refetch]);

  /*
   * Sync upward, but only *forward*.
   *
   * The tally can legitimately be ahead of the copy `SessionPage` holds — that is the
   * whole mid-vote race: the client learns the owner advanced only when its PUT comes
   * back 409 and the refetch that follows brings a later status than the page has.
   *
   * It can never legitimately be behind. When an owner advances the session from this
   * very page, `SessionPage` has the new status immediately while this tally is still
   * the one fetched a phase ago, and a bare `!==` reads that staleness as news and
   * pushes it back up — dragging the page from `decided` back to `voting`, which is a
   * transition the backend does not even allow. Comparing positions rather than
   * equality is what keeps a stale read from overwriting a fresh one.
   */
  useEffect(() => {
    if (!tallyStatus) return;
    if (STATUS_ORDER.indexOf(tallyStatus) > STATUS_ORDER.indexOf(status)) onStatusChange?.(tallyStatus);
  }, [tallyStatus, status, onStatusChange]);

  /*
   * The other half of that: when the page's status moves, this tally is the stale one
   * and has to catch up, or the panel would keep hiding counts through `decided` until
   * something else happened to refetch. Skipped on mount — the initial fetch is already
   * in flight, and a second one would be the request the focus-refetch policy exists to
   * avoid.
   */
  useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;
    refetch();
  }, [status, refetch]);

  // A failed cast un-stamps and refetches, exactly once per distinct error: a refetch
  // that itself failed would otherwise re-arm this and spin.
  useEffect(() => {
    if (!error) { lastError.current = ''; return; }
    if (error === lastError.current) return;
    lastError.current = error;
    setStaged(null);
    setCastInterrupted(true);
    refetch();
  }, [error, refetch]);

  /*
   * Watches the recorded vote itself, for two things that both key off it changing:
   * the live region's verb, and retiring `castInterrupted`. A vote that lands means
   * whatever failed earlier has been recovered from, so a later, ordinary close must
   * not still be explained as "voting closed while you were deciding".
   */
  useEffect(() => {
    if (myVoteId === null) { prevVoteId.current = null; return; }
    if (prevVoteId.current !== myVoteId) {
      setVoteVerb(prevVoteId.current === null ? 'cast' : 'changed');
      setCastInterrupted(false);
    }
    prevVoteId.current = myVoteId;
  }, [myVoteId]);

  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  const handleCommit = useCallback(() => {
    if (effectiveStaged === null) return;
    castVote(effectiveStaged);
  }, [castVote, effectiveStaged]);

  /*
   * Navigation and explanation, never gating. Nothing is locked — the wall is live
   * before and after a vote — but the box is fixed on mobile and may be covering the
   * wall, and on either platform the member may have scrolled well past it.
   */
  const handlePickAnother = useCallback(() => {
    wallRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    setPulsing(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_MS);
  }, []);

  if (loading) {
    return (
      <div className={PANEL}>
        <BallotPosterWallSkeleton count={proposals.length || 3} />
      </div>
    );
  }

  const announcement = stagedEntry
    ? `Selected ${stagedEntry.title}. Not yet cast.`
    : votedEntry
      ? `Vote ${voteVerb === 'changed' ? 'changed to' : 'cast for'} ${votedEntry.title}.`
      : votable ? 'Your ballot is empty.' : 'Voting has closed.';

  // Handled well, the mid-vote advance is a decent moment. Handled badly it is a
  // stamped poster sitting next to a red error string with no vote recorded.
  const notice = castInterrupted && !votable
    ? 'Voting closed while you were deciding — here are the results.'
    : undefined;

  return (
    <div className={PANEL}>
      <BallotBox
        votedEntry={votedEntry}
        stagedEntry={stagedEntry}
        totalVotes={tally?.total_votes ?? 0}
        eligibleVoters={tally?.eligible_voters ?? 0}
        votable={votable}
        committing={castingId !== null}
        announcement={announcement}
        notice={notice}
        error={error}
        onCommit={handleCommit}
        onCancel={() => setStaged(null)}
        onPickAnother={handlePickAnother}
      />

      <div ref={wallRef}>
        {entries.length === 0 ? (
          <div className="border-2 border-dashed border-outline-variant/40 rounded-[24px] p-lg flex min-h-[200px] flex-col items-center justify-center gap-sm text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '48px' }}>
              how_to_vote
            </span>
            <p className="type-headline-sm text-on-surface-variant">Nothing on the ballot</p>
            <p className="type-body-md text-on-surface-variant/70">This session reached voting with no nominations.</p>
          </div>
        ) : (
          <BallotPosterWall
            entries={entries}
            checkedId={checkedId}
            myVoteId={myVoteId}
            revealed={revealed}
            interactive={votable}
            pulsing={pulsing}
            onSelect={setStaged}
          />
        )}
      </div>
    </div>
  );
}
