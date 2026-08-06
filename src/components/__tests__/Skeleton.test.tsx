import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonGroup } from '../Skeleton';

describe('Skeleton', () => {
  describe('shape', () => {
    test('defaults to the text variant', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('h-4', 'rounded');
    });

    test('renders a square-cornered block for the rect variant', () => {
      // Arrange + Act
      render(<Skeleton variant="rect" />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md');
    });

    test('leaves the rect variant unsized so the caller owns its dimensions', () => {
      // Arrange + Act
      render(<Skeleton variant="rect" />);

      // Assert
      expect(screen.getByTestId('skeleton')).not.toHaveClass('h-4');
    });

    test('renders a round block for the circle variant', () => {
      // Arrange + Act
      render(<Skeleton variant="circle" />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full', 'aspect-square');
    });

    test('carries the flat surface tint', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-surface-container-high');
    });

    test('applies a passed className alongside its base classes', () => {
      // Arrange + Act
      render(<Skeleton variant="rect" className="h-48 w-24" />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass(
        'h-48',
        'w-24',
        'bg-surface-container-high',
      );
    });
  });

  describe('text lines', () => {
    test('renders a single block with no line wrapper by default', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.queryAllByTestId('skeleton-line')).toHaveLength(0);
    });

    test('renders one block per line', () => {
      // Arrange + Act
      render(<Skeleton lines={3} />);

      // Assert
      expect(screen.getAllByTestId('skeleton-line')).toHaveLength(3);
    });

    test('shortens the last line to suggest a ragged paragraph edge', () => {
      // Arrange + Act
      render(<Skeleton lines={3} />);

      // Assert
      const lines = screen.getAllByTestId('skeleton-line');
      expect(lines[lines.length - 1]).toHaveClass('w-3/5');
    });

    test('leaves every line before the last at full width', () => {
      // Arrange + Act
      render(<Skeleton lines={3} />);

      // Assert
      const lines = screen.getAllByTestId('skeleton-line');
      expect(lines[0]).not.toHaveClass('w-3/5');
    });

    test('does not shorten a single-line skeleton', () => {
      // Arrange + Act
      render(<Skeleton lines={1} />);

      // Assert
      expect(screen.getByTestId('skeleton')).not.toHaveClass('w-3/5');
    });

    test('ignores lines for non-text variants', () => {
      // Arrange + Act
      render(<Skeleton variant="rect" lines={3} />);

      // Assert
      expect(screen.queryAllByTestId('skeleton-line')).toHaveLength(0);
    });
  });

  describe('standalone', () => {
    test('owns a sweep when rendered outside a group', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.getByTestId('skeleton-sweep')).toBeInTheDocument();
    });

    test('clips its own sweep so the off-block travel is not visible', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('relative', 'overflow-hidden');
    });
  });

  describe('accessibility', () => {
    test('is hidden from assistive tech', () => {
      // Arrange + Act
      render(<Skeleton />);

      // Assert
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

describe('SkeletonGroup', () => {
  test('renders its children', () => {
    // Arrange + Act
    render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );

    // Assert
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('renders exactly one sweep no matter how many skeletons it contains', () => {
    // Arrange + Act
    render(
      <SkeletonGroup>
        <Skeleton />
        <Skeleton variant="rect" className="h-48" />
        <Skeleton lines={3} />
      </SkeletonGroup>,
    );

    // Assert — the whole region catches one pass of light, not four
    expect(screen.getAllByTestId('skeleton-sweep')).toHaveLength(1);
  });

  test('renders its skeletons flat, without their own positioning context', () => {
    // Arrange + Act
    render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );

    // Assert
    expect(screen.getByTestId('skeleton')).not.toHaveClass('relative');
  });

  test('clips the sweep so its off-screen travel is not visible', () => {
    // Arrange + Act
    render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );

    // Assert
    expect(screen.getByTestId('skeleton-group')).toHaveClass('relative', 'overflow-hidden');
  });

  test('applies a passed className on top of its sweep classes', () => {
    // Arrange + Act
    render(
      <SkeletonGroup className="rounded-[24px] p-md">
        <Skeleton />
      </SkeletonGroup>,
    );

    // Assert
    expect(screen.getByTestId('skeleton-group')).toHaveClass(
      'rounded-[24px]',
      'p-md',
      'overflow-hidden',
    );
  });

  describe('accessibility', () => {
    test('announces the region once rather than once per block', () => {
      // Arrange + Act
      render(
        <SkeletonGroup>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </SkeletonGroup>,
      );

      // Assert
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    test('carries a default label', () => {
      // Arrange + Act
      render(
        <SkeletonGroup>
          <Skeleton />
        </SkeletonGroup>,
      );

      // Assert
      expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    });

    test('uses a custom label when given', () => {
      // Arrange + Act
      render(
        <SkeletonGroup label="Loading your groups">
          <Skeleton />
        </SkeletonGroup>,
      );

      // Assert
      expect(screen.getByRole('status')).toHaveTextContent('Loading your groups');
    });

    test('keeps the label out of the visual layout', () => {
      // Arrange + Act
      render(
        <SkeletonGroup>
          <Skeleton />
        </SkeletonGroup>,
      );

      // Assert
      expect(screen.getByText('Loading…')).toHaveClass('sr-only');
    });
  });
});

describe('sweep', () => {
  test('is a moving gradient sliver sized to the shimmer keyframe travel', () => {
    // Arrange + Act
    render(<Skeleton />);

    // Assert — `w-1/3` is what makes translateX(-100% → 300%) an edge-to-edge pass
    expect(screen.getByTestId('skeleton-sweep')).toHaveClass(
      'w-1/3',
      'bg-gradient-to-r',
      'animate-shimmer-slow',
    );
  });

  test('is hidden under reduced motion rather than frozen mid-block', () => {
    // Arrange + Act
    render(<Skeleton />);

    // Assert — the Tailwind plugin only sets `animation: none`, which would park
    // the gradient over the block; hiding it leaves the flat tint instead.
    expect(screen.getByTestId('skeleton-sweep')).toHaveClass('motion-reduce:hidden');
  });

  test('does not intercept pointer events', () => {
    // Arrange + Act
    render(<Skeleton />);

    // Assert
    expect(screen.getByTestId('skeleton-sweep')).toHaveClass('pointer-events-none');
  });
});
