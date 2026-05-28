export type UserRole = 'owner' | 'admin' | 'member';
export type SessionStatus = 'open' | 'voting' | 'decided' | 'closed';

export interface GroupSummary {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  created_by_id: number | null;
  created_at: string;
  member_count: number;
  your_role: UserRole;
}

export interface GroupMember {
  id: number;
  user_id: number;
  group_id: number;
  role: UserRole;
  joined_at: string;
  username: string | null;
}

export interface Session {
  id: number;
  group_id: number;
  created_by_id: number | null;
  scheduled_for: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface GroupDetail {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  created_by_id: number | null;
  created_at: string;
  your_role: UserRole;
  members: GroupMember[];
  sessions: Session[];
}

export interface MovieProposal {
  id: number;
  session_id: number;
  proposed_by_id: number;
  proposed_by_username: string | null;
  title: string;
  tmdb_id: number | null;
  poster_url: string | null;
  overview: string | null;
  runtime_minutes: number | null;
  proposed_at: string;
}
