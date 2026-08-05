import { render, screen, act } from '@testing-library/react';
import { LoadingProvider } from '../../context/LoadingContext';

// LoadingProvider renders the real GlobalLoadingBar as its default indicator,
// so driving the window events exercises the actual wiring.
const startLoading = () =>
  act(() => { window.dispatchEvent(new CustomEvent('loading:start')); });
const endLoading = () =>
  act(() => { window.dispatchEvent(new CustomEvent('loading:end')); });

describe('GlobalLoadingBar', () => {
  describe('track', () => {
    test('is always mounted', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('loading-bar-track')).toBeInTheDocument();
    });

    test('clips the sweep so its off-screen travel is not visible', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('loading-bar-track')).toHaveClass('overflow-hidden');
    });

    test('is transparent when idle so no static line is painted', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('loading-bar-track')).toHaveClass('opacity-0');
    });

    test('becomes opaque while loading', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      startLoading();

      // Assert
      expect(screen.getByTestId('loading-bar-track')).toHaveClass('opacity-100');
    });

    test('sits above the sidebar', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByTestId('loading-bar-track')).toHaveClass('z-loading-bar');
    });
  });

  describe('sweep', () => {
    test('is absent when idle', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.queryByTestId('loading-bar-sweep')).not.toBeInTheDocument();
    });

    test('renders while loading', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      startLoading();

      // Assert
      expect(screen.getByTestId('loading-bar-sweep')).toBeInTheDocument();
    });

    test('is a moving gradient sliver, not a full-width fill', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      startLoading();

      // Assert
      expect(screen.getByTestId('loading-bar-sweep')).toHaveClass(
        'w-1/3',
        'bg-gradient-to-r',
        'animate-shimmer',
      );
    });

    test('degrades to a static full-width bar under reduced motion', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      startLoading();

      // Assert
      expect(screen.getByTestId('loading-bar-sweep')).toHaveClass(
        'motion-reduce:w-full',
        'motion-reduce:bg-none',
        'motion-reduce:bg-primary',
      );
    });

    test('unmounts once loading settles, stopping the animation', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);
      startLoading();

      // Act
      endLoading();

      // Assert
      expect(screen.queryByTestId('loading-bar-sweep')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('exposes aria-busy while loading', () => {
      // Arrange
      render(<LoadingProvider>content</LoadingProvider>);

      // Act
      startLoading();

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
    });

    test('exposes aria-busy=false when idle', () => {
      // Arrange + Act
      render(<LoadingProvider>content</LoadingProvider>);

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'false');
    });
  });
});
