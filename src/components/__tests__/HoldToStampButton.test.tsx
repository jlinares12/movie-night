import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HoldToStampButton from '../HoldToStampButton';

/*
 * Written before the component (docs/plans/voting-ui.md §4 and §Tests), the same
 * tests-first order #209 used. Until `HoldToStampButton.tsx` lands this suite fails
 * on `Cannot find module '../HoldToStampButton'` — see the "Expected red" note in
 * docs/plans/voting-frontend-tests.md, which applies here verbatim.
 *
 * The contract under test:
 *
 *   interface Props {
 *     onCommit: () => void;
 *     label: string;          // visible text, and the accessible name
 *     requireHold?: boolean;  // default true — a FIRST cast holds; a change is a plain tap
 *     holdMs?: number;        // default HOLD_MS (600)
 *     disabled?: boolean;
 *   }
 *
 * The branch is on `PointerEvent.pointerType`, never on the `lg` breakpoint: a
 * touchscreen laptop, an iPad in landscape and a phone in landscape all classify
 * wrongly by width. Two rows of that table are accessibility floors rather than
 * polish — keyboard activation and reduced motion must never require a hold — so
 * they get tests of their own below.
 *
 * Two environment stubs, both because jsdom has no implementation and an unguarded
 * call would throw rather than fail an assertion:
 *   - `window.matchMedia`, read for `prefers-reduced-motion`.
 *   - `Element.prototype.setPointerCapture` / `releasePointerCapture`.
 * The component should still call them optionally (`el.setPointerCapture?.(id)`),
 * so a browser without pointer capture degrades to a working hold rather than a
 * broken button.
 */

const HOLD_MS = 600;

let reducedMotion = false;

const setupMatchMedia = () => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: reducedMotion && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

// `advanceTimers` is required whenever user-event and fake timers share a test:
// without it user-event's own internal delays never resolve and every interaction
// hangs until the test times out.
const setupUser = () =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const button = () => screen.getByRole('button', { name: /cast your vote/i });

beforeEach(() => {
  jest.useFakeTimers();
  reducedMotion = false;
  setupMatchMedia();
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
  Object.defineProperty(window.navigator, 'vibrate', {
    value: jest.fn(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('HoldToStampButton', () => {
  test('holdToStamp_withMousePointer_commitsOnClick', async () => {
    // Arrange — a mouse button held for 600ms reads as broken, not as ceremony:
    // people click and release by reflex.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act
    await user.click(button());

    // Assert — committed without any timer having been advanced
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_withTouchPointer_commitsAfterHoldDuration', async () => {
    // Arrange
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act — press and hold, one millisecond short of the threshold
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(HOLD_MS - 1);

    // Assert — nothing yet
    expect(onCommit).not.toHaveBeenCalled();

    // Act — cross the threshold
    jest.advanceTimersByTime(1);

    // Assert
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_withTouchPointerReleasedEarly_doesNotCommit', async () => {
    // Arrange
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act — lift at half the hold, then let the rest of the window elapse
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(HOLD_MS / 2);
    await user.pointer({ keys: '[/TouchA]', target: button() });
    jest.advanceTimersByTime(HOLD_MS);

    // Assert — an abandoned hold is a cancellation, and the click that a touch
    // release synthesises must not slip past it either
    expect(onCommit).not.toHaveBeenCalled();
  });

  test('holdToStamp_withTouchPointer_doesNotDoubleCommitOnSyntheticClick', async () => {
    // Arrange — the click-after-touch guard. A touch release synthesises a click,
    // so a component that commits on both the timer and onClick fires twice, and
    // the second fire lands as a *duplicate cast* against a live endpoint.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act — a full hold, then the release that follows it
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(HOLD_MS);
    await user.pointer({ keys: '[/TouchA]', target: button() });

    // Assert
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_withEnterKey_commitsImmediately', async () => {
    // Arrange — press-and-hold is hard or impossible with several motor
    // impairments, so there is always a no-hold path. Non-negotiable.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act — a keyboard activation reports no pointer type, so it shares the
    // mouse's onClick path
    button().focus();
    await user.keyboard('{Enter}');

    // Assert — no timer was advanced
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_withSpaceKey_commitsImmediately', async () => {
    // Arrange — Space is the other native activation key, and the one the wall's
    // radios use, so a member arrives at this button already pressing it.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act
    button().focus();
    await user.keyboard(' ');

    // Assert
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_withReducedMotion_commitsOnReleaseWithoutHold', async () => {
    // Arrange — reduced motion removes the hold as well as the ring, because
    // without the fill there is no way to perceive hold progress.
    reducedMotion = true;
    setupMatchMedia();
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} />);

    // Act — a 50ms tap, nowhere near the hold threshold
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(50);
    await user.pointer({ keys: '[/TouchA]', target: button() });

    // Assert
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_whenHoldNotRequired_commitsOnTouchTap', async () => {
    // Arrange — changing a vote is a plain tap on every input. The full hold is
    // reserved for the first cast so that it stays distinct.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} requireHold={false} />);

    // Act
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(50);
    await user.pointer({ keys: '[/TouchA]', target: button() });

    // Assert — exactly once: the no-hold path must not double-fire either
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('holdToStamp_whenDisabled_neverCommits', async () => {
    // Arrange — `disabled` covers the in-flight window (castingId !== null),
    // which is the one place a second commit would duplicate a request.
    const user = setupUser();
    const onCommit = jest.fn();
    render(<HoldToStampButton label="Cast your vote" onCommit={onCommit} disabled />);

    // Act — both paths
    await user.click(button());
    await user.pointer({ keys: '[TouchA>]', target: button() });
    jest.advanceTimersByTime(HOLD_MS * 2);

    // Assert
    expect(onCommit).not.toHaveBeenCalled();
  });

  test('holdToStamp_rendersA44pxMinimumTouchTarget', () => {
    // Arrange / Act — WCAG 2.5.8, and this is the control the whole interaction
    // funnels through
    render(<HoldToStampButton label="Cast your vote" onCommit={jest.fn()} />);

    // Assert
    expect(button()).toHaveClass('min-h-11');
  });
});
