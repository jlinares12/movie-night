import { render, screen, act } from '@testing-library/react';
import { LoadingProvider, useLoading, useSkeletonRegion } from '../LoadingContext';

jest.mock('../../components/GlobalLoadingBar', () => ({
  GlobalLoadingBar: () => <div data-testid="mock-loading-bar" />,
}));

function LoadingConsumer() {
  const loading = useLoading();
  return <div data-testid="consumer" data-loading={String(loading)} />;
}

/** Stand-in for a `SkeletonGroup`, which is the only real caller of the hook. */
function Region() {
  useSkeletonRegion();
  return <div data-testid="region" />;
}

const start = () => act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });
const end   = () => act(() => { window.dispatchEvent(new CustomEvent('loading:end')); });
const sentinel = () => screen.getByTestId('global-loading');

describe('LoadingProvider', () => {
  afterEach(() => jest.clearAllMocks());

  describe('sentinel div', () => {
    test('is always in the DOM', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('global-loading')).toBeInTheDocument();
    });

    test('data-loading starts as "false"', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('global-loading')).toHaveAttribute('data-loading', 'false');
    });

    test('data-loading updates to "true" when loading begins', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });

      // Assert
      expect(screen.getByTestId('global-loading')).toHaveAttribute('data-loading', 'true');
    });

    test('data-loading returns to "false" when loading clears', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);
      act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });

      // Act
      act(() => { window.dispatchEvent(new CustomEvent('loading:end')); });

      // Assert
      expect(screen.getByTestId('global-loading')).toHaveAttribute('data-loading', 'false');
    });
  });

  describe('indicator={null}', () => {
    test('sentinel div is still present', () => {
      // Arrange + Act
      render(<LoadingProvider indicator={null}>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('global-loading')).toBeInTheDocument();
    });

    test('data-loading still toggles correctly', () => {
      // Arrange
      render(<LoadingProvider indicator={null}>content</LoadingProvider>);

      // Act
      act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });

      // Assert
      expect(screen.getByTestId('global-loading')).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('indicator rendering', () => {
    test('renders GlobalLoadingBar by default', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('mock-loading-bar')).toBeInTheDocument();
    });

    test('renders a custom indicator when provided', () => {
      // Arrange + Act
      render(
        <LoadingProvider indicator={<div data-testid="custom-indicator" />}>
          content
        </LoadingProvider>
      );

      // Assert
      expect(screen.getByTestId('custom-indicator')).toBeInTheDocument();
    });
  });

  describe('useLoading', () => {
    test('returns false initially', () => {
      // Arrange + Act
      render(<LoadingProvider><LoadingConsumer /></LoadingProvider>);

      // Assert
      expect(screen.getByTestId('consumer')).toHaveAttribute('data-loading', 'false');
    });

    test('returns true when loading state is set', () => {
      // Arrange
      render(<LoadingProvider><LoadingConsumer /></LoadingProvider>);

      // Act
      act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });

      // Assert
      expect(screen.getByTestId('consumer')).toHaveAttribute('data-loading', 'true');
    });
  });

  // ── Division of labor: a skeleton region suppresses the bar ────────────────
  describe('skeleton-region suppression', () => {
    test('bar runs for a request no region is representing', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      start();

      // Assert — the mutation case: nothing on screen owns this wait
      expect(sentinel()).toHaveAttribute('data-bar', 'true');
    });

    test('bar stays hidden for a request a region is representing', () => {
      // Arrange
      render(<LoadingProvider><Region /></LoadingProvider>);

      // Act
      start();

      // Assert — the whole point of step 6: skeleton on screen, no double indication
      expect(sentinel()).toHaveAttribute('data-bar', 'false');
    });

    test('data-loading still reports the raw request count while suppressed', () => {
      // Arrange
      render(<LoadingProvider><Region /></LoadingProvider>);

      // Act
      start();

      // Assert — suppression hides the bar, it does not pretend the network is idle.
      // The e2e suite's ~40 "wait for settled" barriers depend on this staying honest.
      expect(sentinel()).toHaveAttribute('data-loading', 'true');
    });

    test('bar appears once the region unmounts with the request still in flight', () => {
      // Arrange
      const { rerender } = render(<LoadingProvider><Region /></LoadingProvider>);
      start();

      // Act — e.g. a skeleton swapped out while a background refetch continues
      rerender(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(sentinel()).toHaveAttribute('data-bar', 'true');
    });

    test('one region is enough to suppress; both must leave to restore', () => {
      // Arrange — GroupPage mounts four sibling regions, so this must count, not toggle
      const { rerender } = render(
        <LoadingProvider><Region /><Region /></LoadingProvider>
      );
      start();

      // Act — only one unmounts
      rerender(<LoadingProvider><Region /></LoadingProvider>);

      // Assert
      expect(sentinel()).toHaveAttribute('data-bar', 'false');

      // Act — the last one leaves
      rerender(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(sentinel()).toHaveAttribute('data-bar', 'true');
    });

    test('a region mounted with no request in flight leaves the bar alone', () => {
      // Arrange + Act
      render(<LoadingProvider><Region /></LoadingProvider>);

      // Assert — suppression gates an active bar, it does not invert one
      expect(sentinel()).toHaveAttribute('data-bar', 'false');
      expect(sentinel()).toHaveAttribute('data-loading', 'false');
    });

    test('useLoading reports the suppressed value, so the bar itself hides', () => {
      // Arrange
      render(<LoadingProvider><Region /><LoadingConsumer /></LoadingProvider>);

      // Act
      start();

      // Assert — GlobalLoadingBar reads this, so suppression reaches the real bar
      expect(screen.getByTestId('consumer')).toHaveAttribute('data-loading', 'false');
    });

    test('settles cleanly when the request ends before the region unmounts', () => {
      // Arrange
      render(<LoadingProvider><Region /></LoadingProvider>);
      start();

      // Act — axios fires loading:end before the `.then` flips `loading` to false,
      // so pending hits 0 first; the bar must not flash on the way out
      end();

      // Assert
      expect(sentinel()).toHaveAttribute('data-bar', 'false');
      expect(sentinel()).toHaveAttribute('data-loading', 'false');
    });
  });
});
