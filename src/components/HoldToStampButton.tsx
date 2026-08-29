import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** The touch/pen hold, in milliseconds. Exported so tests and callers share one number. */
export const HOLD_MS = 600;

/*
 * Read at event time rather than latched into state on mount: someone can flip the OS
 * setting mid-session, and a stale latch would leave them holding a button whose ring
 * no longer fills. `matchMedia` is optional-called because jsdom does not implement it.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

interface Props {
  onCommit: () => void;
  /** Visible text, and the accessible name. */
  label: string;
  /** A first cast holds; a change is a plain tap on every input. */
  requireHold?: boolean;
  holdMs?: number;
  disabled?: boolean;
  /** Forwarded to the <button>, so callers can name the control for e2e. */
  testId?: string;
}

/**
 * The commit control, and the entire pointer-type branch behind it.
 *
 * The branch is on `PointerEvent.pointerType`, never on the `lg` breakpoint — `lg` is
 * this app's *layout* breakpoint and has never been a proxy for how someone is pointing
 * at the screen. A touchscreen laptop at 1440px, an iPad in landscape and a phone in
 * landscape all classify wrongly by width; `pointerType` rides on the event itself, is
 * correct on hybrid devices, and adapts if someone picks up a stylus mid-session.
 *
 *   touch / pen  → hold `holdMs`, ring fills, vibrate on completion
 *   mouse        → plain click (a mouse held for 600ms reads as broken, not as ceremony)
 *   keyboard     → immediate, no hold, ever
 *   reduced motion → immediate on release; without the fill there is no way to perceive
 *                    hold progress, so the hold goes with the animation
 *
 * The last two rows are accessibility floors rather than polish: press-and-hold is hard
 * or impossible with several motor impairments, so there is always a no-hold path.
 *
 * Isolated from the ballot around it because the click-after-touch guard below is the
 * highest-defect-risk code in this feature — a component that commits on both the timer
 * and the synthetic click casts twice against a live endpoint.
 */
export default function HoldToStampButton({
  onCommit,
  label,
  requireHold = true,
  holdMs = HOLD_MS,
  disabled = false,
  testId,
}: Props) {
  // Written on every pointerdown and cleared on keydown, so `onClick` can tell a mouse
  // click (commit) from the click a touch release synthesises (already resolved).
  const lastPointerType = useRef('');
  const holding = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filling, setFilling] = useState(false);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // An unmount mid-hold (the session advancing out of `voting`, say) must not land a
  // cast against a component that is gone.
  useEffect(() => clearTimer, [clearTimer]);

  const cancelHold = useCallback(() => {
    clearTimer();
    holding.current = false;
    setFilling(false);
  }, [clearTimer]);

  const commit = useCallback(() => {
    if (disabled) return;
    onCommit();
  }, [disabled, onCommit]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    lastPointerType.current = e.pointerType;
    if (disabled) return;
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

    // Optional-called so a browser without pointer capture degrades to a working hold
    // rather than a broken button.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holding.current = true;

    // No-hold path: the commit happens on release, in handlePointerUp.
    if (!requireHold || prefersReducedMotion()) return;

    setFilling(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      holding.current = false;
      // The fill deliberately stays at 100% here rather than snapping back: it has
      // just reached the far edge, and leaving it full is what carries the moment
      // through to the stamp (and through the in-flight window, where the button is
      // disabled and never sees a pointerup). `cancelHold` resets it on release.
      navigator.vibrate?.(10);
      commit();
    }, holdMs);
  };

  const handlePointerUp = () => {
    const type = lastPointerType.current;
    if (type !== 'touch' && type !== 'pen') return;

    const wasHolding = holding.current;
    const noHold = !requireHold || prefersReducedMotion();
    cancelHold();

    // A completed hold has already committed and cleared `holding`, so this is either
    // the no-hold tap (commit) or an abandoned hold (cancel).
    if (wasHolding && noHold) commit();
  };

  const handleClick = () => {
    // A keyboard activation synthesises a click carrying no pointer type, so mouse and
    // keyboard share this path. Touch is suppressed here because it has already
    // committed — or deliberately not committed — above.
    const type = lastPointerType.current;
    if (type === 'touch' || type === 'pen') return;
    commit();
  };

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onClick={handleClick}
      onKeyDown={() => { lastPointerType.current = ''; }}
      /*
       * `touch-none` stops the hold from being read as the start of a scroll, which
       * would cancel it on the first pixel of finger drift. `min-h-11`/`min-w-11` is
       * the WCAG 2.5.8 floor, and this is the control the whole interaction funnels
       * through.
       */
      className="
        relative isolate overflow-hidden select-none touch-none
        inline-flex min-h-11 min-w-11 items-center justify-center gap-xs
        rounded-xl px-md py-sm type-label-md
        bg-primary text-on-primary font-bold
        transition-all hover:brightness-110 active:scale-95
        disabled:opacity-50 disabled:pointer-events-none neon-glow
      "
    >
      {/*
       * The ring fill, as a left-anchored wipe. Its duration *is* `holdMs`, so the bar
       * and the timer cannot drift apart; the snap back on release is deliberately much
       * quicker than the fill so an abandoned hold reads as abandoned.
       */}
      <span
        aria-hidden="true"
        style={{ transitionDuration: filling ? `${holdMs}ms` : '160ms' }}
        className={`absolute inset-0 origin-left bg-on-primary/25 transition-transform ease-linear ${
          filling ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
      <span className="relative flex items-center gap-xs">
        {/*
         * Boxed to exactly the glyph's size. Material Symbols renders its ligature as
         * literal text until the font loads — "how_to_vote" is eleven characters wide,
         * which is enough to wrap this button and the cancel beside it onto two rows.
         * That matters here more than anywhere else in the app: `SessionPage` reserves
         * a fixed height for this box below `lg`, so anything inside it that reflows on
         * font load reflows the whole page under the member's finger.
         */}
        <span
          aria-hidden="true"
          className="material-symbols-outlined inline-block w-[18px] shrink-0 overflow-hidden leading-none"
          style={{ fontSize: '18px' }}
        >
          how_to_vote
        </span>
        {label}
      </span>
    </button>
  );
}
