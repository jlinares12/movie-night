import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteCodePanel from '../InviteCodePanel';
import { regenerateInvite } from '../../services/groups';

jest.mock('../../services/groups');
const mockRegenerate = regenerateInvite as jest.MockedFunction<typeof regenerateInvite>;

// userEvent.setup() replaces navigator.clipboard with its own stub via
// Object.defineProperty (attachClipboardStubToView). Any beforeAll mock is
// overwritten before the component runs. Spy on navigator.clipboard.writeText
// *after* setup() so we're watching the stub the component actually calls.

describe('InviteCodePanel', () => {
  afterEach(() => jest.clearAllMocks());

  test('displays the invite code', () => {
    // Arrange / Act
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="owner" onCodeChanged={jest.fn()} />
    );

    // Assert
    expect(screen.getByText('aB3xYz')).toBeInTheDocument();
  });

  test('Copy button calls navigator.clipboard.writeText with the invite code', async () => {
    // Arrange
    const user = userEvent.setup();
    // Spy after setup() so we intercept the stub userEvent installed, not our own mock
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="owner" onCodeChanged={jest.fn()} />
    );

    // Act
    await user.click(screen.getByRole('button', { name: /copy code/i }));

    // Assert
    expect(writeTextSpy).toHaveBeenCalledWith('aB3xYz');
  });

  test('Copy button label changes to "Copied!" after clicking', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="owner" onCodeChanged={jest.fn()} />
    );

    // Act
    await user.click(screen.getByRole('button', { name: /copy code/i }));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
  });

  test('Regenerate button is visible to owner', () => {
    // Arrange / Act
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="owner" onCodeChanged={jest.fn()} />
    );

    // Assert
    expect(screen.getByTitle('Regenerate code')).toBeInTheDocument();
  });

  test('Regenerate button is visible to admin', () => {
    // Arrange / Act
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="admin" onCodeChanged={jest.fn()} />
    );

    // Assert
    expect(screen.getByTitle('Regenerate code')).toBeInTheDocument();
  });

  test('Regenerate button is NOT visible to a plain member', () => {
    // Arrange / Act
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="member" onCodeChanged={jest.fn()} />
    );

    // Assert
    expect(screen.queryByTitle('Regenerate code')).not.toBeInTheDocument();
  });

  test('clicking Regenerate calls regenerateInvite and notifies the parent with the new code', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(true);
    const onCodeChanged = jest.fn();
    mockRegenerate.mockResolvedValue({ data: { invite_code: 'newCode' } } as unknown as Awaited<ReturnType<typeof regenerateInvite>>);
    render(
      <InviteCodePanel groupId={3} invite_code="aB3xYz" your_role="owner" onCodeChanged={onCodeChanged} />
    );

    // Act
    await user.click(screen.getByTitle('Regenerate code'));
    await act(async () => { await Promise.resolve(); });

    // Assert
    expect(mockRegenerate).toHaveBeenCalledWith(3);
    expect(onCodeChanged).toHaveBeenCalledWith('newCode');
  });

  test('clicking Regenerate does nothing when user cancels the confirmation', async () => {
    // Arrange
    const user = userEvent.setup();
    global.confirm = jest.fn().mockReturnValue(false);
    render(
      <InviteCodePanel groupId={1} invite_code="aB3xYz" your_role="owner" onCodeChanged={jest.fn()} />
    );

    // Act
    await user.click(screen.getByTitle('Regenerate code'));

    // Assert
    expect(mockRegenerate).not.toHaveBeenCalled();
  });
});
