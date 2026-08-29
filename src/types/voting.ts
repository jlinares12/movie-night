import type { SessionStatus } from './groups';

/** The PUT /votes response — a vote that exists. */
export interface Vote {
  id: number;
  proposal_id: number;
  user_id: number;
  session_id: number;
  voted_at: string;
}

/**
 * The GET /votes/me response. The route never 404s — a caller who hasn't voted
 * gets a 200 with null id/proposal_id/voted_at, so the nulls are a state rather
 * than an error. `Vote` is structurally assignable to this, which is what lets
 * useSessionVoting hold both responses in one field.
 */
export interface MyVote {
  id: number | null;
  proposal_id: number | null;
  user_id: number;
  session_id: number;
  voted_at: string | null;
}

export interface TallyVoter {
  user_id: number;
  username: string | null;
}

export interface TallyResult {
  proposal_id: number;
  title: string;
  poster_url: string | null;
  vote_count: number;
  /** null while identities are hidden; [] means revealed-but-nobody-voted-for-it. */
  voters: TallyVoter[] | null;
}

export interface VoteTally {
  session_status: SessionStatus;
  total_votes: number;
  eligible_voters: number;
  identities_revealed: boolean;
  /** Pre-sorted vote_count DESC then proposal_id ASC, and includes zero-vote
   *  nominations. Both are backend guarantees — inherit them, don't re-derive. */
  results: TallyResult[];
}
