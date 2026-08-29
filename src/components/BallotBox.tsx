import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import HoldToStampButton from './HoldToStampButton';
import type { BallotEntry } from './BallotPoster';

/*
 * ── Reserved space ────────────────────────────────────────────────────────────
 *
 * Below `lg` the box is pinned above `MobileNavBar`, which is itself `fixed`, 56px
 * tall and sitting `1rem + env(safe-area-inset-bottom)` off the bottom. `MainLayout`
 * already pays for the nav bar with `pb-32`; this is what the *box* costs on top.
 *
 * The height is **measured, not derived**. Rendered at 375px against titles long enough
 * to wrap every line that can wrap, the box comes out at 74px collapsed, 181px expanded
 * in `CAST`, and 203px in `STAGED_CHANGE` — the tallest state, and the one that expands
 * itself. 208 is that number with a few pixels of slack.
 *
 * Deriving it from the class list gave 208 as well, but only by coincidence: that
 * arithmetic missed the two commit buttons wrapping onto a second row at this width,
 * which alone put the real box at 262px. Re-measure after any change to the box's
 * contents rather than adjusting the sum.
 *
 * The whole `voting` phase reserves the expanded height, expanded or not: if the padding
 * changed when the box expanded, the wall would reflow underneath someone at the exact
 * moment they are staging a choice, and the poster they just tapped could jump out from
 * under their finger.
 *
 * Exported so the box and `SessionPage`'s padding read one number and cannot drift.
 */
export const BALLOT_BOX_MAX_HEIGHT = 208;
const NAV_BAR_HEIGHT = 56;
const NAV_BAR_GAP = 12;

export const BALLOT_BOX_BOTTOM =
  `calc(1rem + ${NAV_BAR_HEIGHT}px + ${NAV_BAR_GAP}px + env(safe-area-inset-bottom, 0px))`;
export const BALLOT_BOX_RESERVE = `${BALLOT_BOX_MAX_HEIGHT + NAV_BAR_GAP}px`;

interface Props {
  /** The slip already seated in the box — server truth. */
  votedEntry: BallotEntry | null;
  /** The slip hovering above it. Never equal to `votedEntry`; the panel resolves that. */
  stagedEntry: BallotEntry | null;
  totalVotes: number;
  eligibleVoters: number;
  /** False once the session leaves `voting`: the box becomes a read-only receipt. */
  votable: boolean;
  /** In flight — `castingId !== null` on the hook. */
  committing: boolean;
  /** What the live region should say right now. Owned by the panel, which knows why. */
  announcement: string;
  /** Shown instead of the raw error when the session closed mid-decision. */
  notice?: string;
  error?: string;
  onCommit: () => void;
  onCancel: () => void;
  /** Scrolls the wall into view and pulses it. It unlocks nothing — nothing is locked. */
  onPickAnother: () => void;
}

/**
 * The ballot box: a sticky card above the wall on desktop, a bar pinned above the mobile
 * nav bar below `lg`.
 *
 * One DOM tree serves both, and the collapse is CSS-only below `lg` — a second copy for
 * mobile would put every string on the page twice, which is a real bug for a screen
 * reader long before it is a failing assertion.
 *
 * The header always carries the current truth, including the participation line, so a
 * collapsed box is never an empty one. What collapses is the *detail*: the staged slip,
 * the commit control and the "pick another" link.
 *
 * Five states, from `myVote.proposal_id` (server) and `staged` (local):
 *
 *   —/—   EMPTY          empty slot, "pick a movie"
 *   —/X   STAGED_FIRST   X hovering, "Cast your vote" (hold on touch)
 *   A/—   CAST           A seated and stamped, "Changed your mind? Pick another"
 *   A/A   CAST           identical: staging your current pick is a no-op, resolved above
 *   A/B   STAGED_CHANGE  A lifting out, B hovering, "Change your vote to B?" (tap)
 */
export default function BallotBox({
  votedEntry, stagedEntry, totalVotes, eligibleVoters, votable, committing,
  announcement, notice, error, onCommit, onCancel, onPickAnother,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  // Keyed on the id rather than the object so a refetch that rebuilds an identical entry
  // does not re-open a box the member just collapsed.
  const stagedId = stagedEntry?.proposalId ?? null;

  // Auto-expand on a staged slip: the confirm control is the only way forward from
  // there, and a collapsed box would hide it behind a chevron nobody has reason to press.
  useEffect(() => {
    if (stagedId !== null) setCollapsed(false);
  }, [stagedId]);

  // Escape cancels a staged selection — the third way out, alongside the cancel control
  // and tapping the poster already voted for.
  useEffect(() => {
    if (!stagedEntry) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stagedEntry, onCancel]);

  const detailHidden = collapsed && !stagedEntry;

  return (
    <aside
      data-testid="ballot-box"
      aria-label="Your ballot"
      style={{ '--ballot-bottom': BALLOT_BOX_BOTTOM } as CSSProperties}
      /*
       * `fixed` below `lg`, `sticky` above it. The bottom offset is handed in as a custom
       * property rather than a plain inline `bottom`, because an inline style would beat
       * `lg:bottom-auto` and strand the desktop box at the foot of the page.
       *
       * `z-sidebar` (50) makes it peer furniture to `MobileNavBar`, and keeps it below
       * `MobileMenu`'s `z-modal` (70) so the sheet still covers it.
       */
      className="
        glass-panel fixed inset-x-margin-mobile bottom-[var(--ballot-bottom)] z-sidebar
        lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-6 lg:z-auto
        rounded-[24px] border border-primary/25 p-sm lg:p-md
        shadow-[0_8px_32px_-12px_rgb(0_0_0/0.8)]
      "
    >
      {/* ── Header: the current truth at a glance, collapsed or not ── */}
      <div className="flex items-center gap-sm">
        <Slot entry={votedEntry} stamped={!!votedEntry} />

        <div className="min-w-0 flex-1">
          <p className="type-label-md text-on-surface truncate">
            {votedEntry
              ? <>Your vote: <span className="text-primary">{votedEntry.title}</span></>
              : votable ? 'Your ballot is empty' : 'You did not vote'}
          </p>
          <p className="type-label-sm text-on-surface-variant">
            {totalVotes} of {eligibleVoters} have voted
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!detailHidden}
          aria-label={detailHidden ? 'Show ballot details' : 'Hide ballot details'}
          className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-on-surface-variant hover:text-primary transition-colors"
        >
          <span aria-hidden="true" className={`material-symbols-outlined transition-transform ${detailHidden ? '' : 'rotate-180'}`}>
            expand_less
          </span>
        </button>
      </div>

      {/*
       * Detail. Hidden by CSS rather than unmounted, so the collapse cannot change what
       * exists — only what is shown — and `lg` never sees a collapsed state at all.
       */}
      <div className={`${detailHidden ? 'hidden lg:block' : 'block'} mt-sm border-t border-outline-variant/25 pt-sm`}>
        {stagedEntry ? (
          <div className="flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <Slot entry={stagedEntry} hovering />
              {/* Clamped for the same reason the header title is truncated: this box is
                  furniture at a fixed reserved height, and a long title left to wrap
                  freely is what pushes it past that. */}
              <p className="type-label-md text-on-surface min-w-0 flex-1 line-clamp-2">
                {votedEntry
                  ? <>Change your vote to <span className="text-primary">{stagedEntry.title}</span>?</>
                  : <>Ready to cast for <span className="text-primary">{stagedEntry.title}</span></>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-xs">
              <HoldToStampButton
                testId="ballot-commit"
                label={committing ? 'Casting…' : votedEntry ? 'Change vote' : 'Cast your vote'}
                /* The full hold is reserved for a first cast, so that it stays distinct.
                   Changing your mind is a plain tap on every input. */
                requireHold={!votedEntry}
                disabled={committing}
                onCommit={onCommit}
              />
              {/* `px-sm`, not `px-md`: at 375px the box is 311px wide inside its padding,
                  and two `px-md` buttons measure ~318px — just enough to wrap the cancel
                  onto its own row and add 56px to a box whose height the page has to
                  reserve. `flex-wrap` above stays as the safety valve for longer copy. */}
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex min-h-11 items-center rounded-xl px-sm type-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {votedEntry ? 'Keep my vote' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : votable ? (
          <div className="flex flex-wrap items-center justify-between gap-xs">
            <p className="type-label-sm text-on-surface-variant">
              {votedEntry
                ? 'Your vote is in. It can still be changed until voting closes.'
                : 'Pick a movie from the wall, then confirm it here.'}
            </p>
            {votedEntry && (
              <button
                type="button"
                onClick={onPickAnother}
                className="inline-flex min-h-11 items-center gap-xs rounded-xl px-sm type-label-md text-primary hover:brightness-110 transition-all"
              >
                <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
                Changed your mind? Pick another
              </button>
            )}
          </div>
        ) : (
          <p className="type-label-sm text-on-surface-variant">
            {notice ?? 'Voting has closed. The results are on the wall.'}
          </p>
        )}

        {error && !notice && (
          <p role="alert" className="mt-xs type-label-sm text-error">{error}</p>
        )}
      </div>

      {/*
       * The box's own transitions are otherwise silent to a screen reader, because
       * staging moves focus nowhere. `role="status"` carries polite live semantics
       * implicitly and stays queryable by role.
       */}
      <p role="status" className="sr-only">{announcement}</p>
    </aside>
  );
}

/**
 * A slip in the box — the seated vote, or the one hovering above it. Deliberately small:
 * the box is furniture that must never grow past the height `SessionPage` has reserved.
 */
function Slot({ entry, stamped = false, hovering = false }: { entry: BallotEntry | null; stamped?: boolean; hovering?: boolean }) {
  const frame = `relative h-12 w-8 shrink-0 overflow-hidden rounded-md border ${
    hovering ? 'border-primary ballot-slip-in' : stamped ? 'border-primary/60' : 'border-dashed border-outline-variant/50'
  }`;

  if (!entry) {
    return (
      <span aria-hidden="true" className={`${frame} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>how_to_vote</span>
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={frame}>
      {entry.posterUrl
        ? <img src={entry.posterUrl} alt="" className="h-full w-full object-cover" />
        : <span className="flex h-full w-full items-center justify-center bg-surface-container-high" />}
    </span>
  );
}
