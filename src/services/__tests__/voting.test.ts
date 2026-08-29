import api from '../../utils/api';
import * as votingService from '../voting';
import { castVote, getMyVote, getTally } from '../voting';
import type { MyVote, Vote, VoteTally } from '../../types/voting';

// put: api.put is used nowhere else in the frontend — without it here the
// failure is "not a function" rather than a missing-mock message.
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

const makeVote = (overrides: Partial<Vote> = {}): Vote => ({
  id: 7,
  proposal_id: 12,
  user_id: 4,
  session_id: 10,
  voted_at: '2026-08-26T18:04:11+00:00',
  ...overrides,
});

const makeTally = (overrides: Partial<VoteTally> = {}): VoteTally => ({
  session_status: 'voting',
  total_votes: 3,
  eligible_voters: 5,
  identities_revealed: false,
  results: [
    { proposal_id: 12, title: 'Inception', poster_url: '/poster.jpg', vote_count: 2, voters: null },
  ],
  ...overrides,
});

describe('Voting service functions', () => {
  afterEach(() => jest.clearAllMocks());

  test('castVote_withProposalId_callsApiPutWithCorrectPathAndBody', async () => {
    // Arrange
    jest.mocked(api.put).mockResolvedValue({ data: makeVote() });

    // Act
    await castVote(1, 10, 42);

    // Assert
    expect(api.put).toHaveBeenCalledWith('/api/groups/1/sessions/10/votes', { proposal_id: 42 });
  });

  test('castVote_withProposalId_returnsApiResponseUnchanged', async () => {
    // Arrange
    const response = { data: makeVote({ proposal_id: 42 }) };
    jest.mocked(api.put).mockResolvedValue(response);

    // Act
    const result = await castVote(1, 10, 42);

    // Assert
    expect(result).toBe(response);
  });

  test('getMyVote_withGroupAndSession_callsApiGetWithCorrectPath', async () => {
    // Arrange
    jest.mocked(api.get).mockResolvedValue({ data: makeVote() });

    // Act
    await getMyVote(1, 10);

    // Assert
    expect(api.get).toHaveBeenCalledWith('/api/groups/1/sessions/10/votes/me');
  });

  test('getMyVote_whenCallerHasNotVoted_returnsNullFieldedResponseUnchanged', async () => {
    // Arrange
    // The route never 404s here — "you haven't voted yet" arrives as a 200 with
    // null id/proposal_id/voted_at, and the service must pass it straight through.
    const placeholder: MyVote = {
      id: null, proposal_id: null, user_id: 4, session_id: 10, voted_at: null,
    };
    const response = { data: placeholder };
    jest.mocked(api.get).mockResolvedValue(response);

    // Act
    const result = await getMyVote(1, 10);

    // Assert
    expect(result).toBe(response);
    expect(result.data.proposal_id).toBeNull();
  });

  test('getTally_withGroupAndSession_callsApiGetWithCorrectPath', async () => {
    // Arrange
    jest.mocked(api.get).mockResolvedValue({ data: makeTally() });

    // Act
    await getTally(1, 10);

    // Assert
    expect(api.get).toHaveBeenCalledWith('/api/groups/1/sessions/10/votes/tally');
  });

  test('getTally_withTallyResponse_returnsApiResponseUnchanged', async () => {
    // Arrange
    const response = { data: makeTally() };
    jest.mocked(api.get).mockResolvedValue(response);

    // Act
    const result = await getTally(1, 10);

    // Assert
    expect(result).toBe(response);
  });

  test('voteResponse_isAssignableToMyVote', () => {
    // Arrange
    const vote = makeVote();

    // Act
    // Compile-time assertion: this is what lets useSessionVoting hold the PUT
    // response and the /me response in a single myVote field. ts-jest fails the
    // suite if the two interfaces ever drift apart.
    const asMyVote: MyVote = vote;

    // Assert
    expect(asMyVote.proposal_id).toBe(12);
  });

  test('votingService_exposesNoDeleteVote', () => {
    // Arrange / Act
    // There is deliberately no DELETE route — votes are mutable but never
    // removable, so the service must not grow a deleteVote "for symmetry".
    const exported = votingService as Record<string, unknown>;

    // Assert
    expect(exported.deleteVote).toBeUndefined();
  });
});
