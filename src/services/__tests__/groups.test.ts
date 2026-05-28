import api from '../../utils/api';
import { listProposals, createProposal, deleteProposal } from '../groups';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

describe('Proposal service functions', () => {
  afterEach(() => jest.clearAllMocks());

  test('listProposals_callsApiGet_withCorrectGroupAndSessionPath', async () => {
    // Arrange
    jest.mocked(api.get).mockResolvedValue({ data: [] });

    // Act
    await listProposals(1, 10);

    // Assert
    expect(api.get).toHaveBeenCalledWith('/api/groups/1/sessions/10/proposals');
  });

  test('createProposal_callsApiPost_withCorrectPathAndBody', async () => {
    // Arrange
    const body = { tmdb_id: 123, title: 'Inception', poster_url: '/poster.jpg' };
    jest.mocked(api.post).mockResolvedValue({ data: {} });

    // Act
    await createProposal(1, 10, body);

    // Assert
    expect(api.post).toHaveBeenCalledWith('/api/groups/1/sessions/10/proposals', body);
  });

  test('deleteProposal_callsApiDelete_withCorrectPath', async () => {
    // Arrange
    jest.mocked(api.delete).mockResolvedValue({});

    // Act
    await deleteProposal(1, 10, 42);

    // Assert
    expect(api.delete).toHaveBeenCalledWith('/api/groups/1/sessions/10/proposals/42');
  });
});
