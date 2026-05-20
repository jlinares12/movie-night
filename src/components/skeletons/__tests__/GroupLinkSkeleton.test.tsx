import { render } from '@testing-library/react';
import GroupLinkSkeleton from '../GroupLinkSkeleton';

describe('GroupLinkSkeleton', () => {
  test('renders without crashing', () => {
    // Arrange & Act
    const { container } = render(<GroupLinkSkeleton />);

    // Assert
    expect(container).toBeInTheDocument();
  });
});
