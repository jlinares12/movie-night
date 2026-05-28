import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import SessionList from '../SessionList';
import { createSession } from '../../services/groups';
import type { Session } from '../../types/groups';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }));
jest.mock('../../services/groups');

const mockNavigate = jest.fn();
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>;

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 1,
  group_id: 5,
  created_by_id: 1,
  scheduled_for: null,
  status: 'open',
  created_at: '2024-03-01T00:00:00Z',
  ...overrides,
});

describe('SessionList', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockNavigate.mockClear();
  });
  afterEach(() => jest.clearAllMocks());

  test('shows "No sessions yet" when the list is empty', () => {
    // Arrange / Act
    render(
      <SessionList groupId={5} sessions={[]} your_role="member" onSessionCreated={jest.fn()} />
    );

    // Assert
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });

  test('renders the status badge for each session', () => {
    // Arrange
    const sessions = [
      makeSession({ id: 1, status: 'open' }),
      makeSession({ id: 2, status: 'voting' }),
    ];

    // Act
    render(
      <SessionList groupId={5} sessions={sessions} your_role="owner" onSessionCreated={jest.fn()} />
    );

    // Assert
    expect(screen.getByText(/^open$/i)).toBeInTheDocument();
    expect(screen.getByText(/voting/i)).toBeInTheDocument();
  });

  test('clicking a session row navigates to the session detail page', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SessionList
        groupId={5}
        sessions={[makeSession({ id: 10 })]}
        your_role="owner"
        onSessionCreated={jest.fn()}
      />
    );

    // Act
    await user.click(screen.getByText(/^open$/i));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/group/5/session/10');
  });

  test('"New Session" button is visible to owner', () => {
    // Arrange / Act
    render(
      <SessionList groupId={5} sessions={[]} your_role="owner" onSessionCreated={jest.fn()} />
    );

    // Assert
    expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
  });

  test('"New Session" button is visible to admin', () => {
    // Arrange / Act
    render(
      <SessionList groupId={5} sessions={[]} your_role="admin" onSessionCreated={jest.fn()} />
    );

    // Assert
    expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
  });

  test('"New Session" button is NOT visible to a plain member', () => {
    // Arrange / Act
    render(
      <SessionList groupId={5} sessions={[]} your_role="member" onSessionCreated={jest.fn()} />
    );

    // Assert
    expect(screen.queryByRole('button', { name: /new session/i })).not.toBeInTheDocument();
  });

  test('clicking "New Session" shows the create form', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SessionList groupId={5} sessions={[]} your_role="owner" onSessionCreated={jest.fn()} />
    );

    // Act
    await user.click(screen.getByRole('button', { name: /new session/i }));

    // Assert
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('submitting the create form calls createSession and notifies the parent', async () => {
    // Arrange
    const user = userEvent.setup();
    const newSession = makeSession({ id: 99 });
    const onSessionCreated = jest.fn();
    mockCreateSession.mockResolvedValue({ data: newSession } as unknown as Awaited<ReturnType<typeof createSession>>);
    render(
      <SessionList groupId={5} sessions={[]} your_role="owner" onSessionCreated={onSessionCreated} />
    );

    // Act
    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockCreateSession).toHaveBeenCalledWith(5, undefined);
    expect(onSessionCreated).toHaveBeenCalledWith(newSession);
  });

  test('Cancel button hides the create form', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SessionList groupId={5} sessions={[]} your_role="owner" onSessionCreated={jest.fn()} />
    );

    // Act
    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
  });
});
