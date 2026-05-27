import { render, screen, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from '../LoadingContext';

jest.mock('../../components/GlobalLoadingBar', () => ({
  GlobalLoadingBar: () => <div data-testid="mock-loading-bar" />,
}));

function LoadingConsumer() {
  const loading = useLoading();
  return <div data-testid="consumer" data-loading={String(loading)} />;
}

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
});
