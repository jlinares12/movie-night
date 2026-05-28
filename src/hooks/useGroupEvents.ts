import { useEffect } from 'react';
import type { Session } from '../types/groups';

export interface SSEHandlers {
  onMemberJoined?: (data: { user_id: number; username: string; role: string; joined_at: string }) => void;
  onMemberLeft?: (data: { user_id: number }) => void;
  onMemberRoleChanged?: (data: { user_id: number; new_role: string }) => void;
  onSessionCreated?: (data: Session) => void;
  onSessionUpdated?: (data: { session_id: number; status: string; scheduled_for: string | null }) => void;
  onSessionDeleted?: (data: { session_id: number }) => void;
  onInviteCodeChanged?: (data: { invite_code: string }) => void;
  onGroupUpdated?: (data: { name: string; description: string | null }) => void;
  onGroupDeleted?: () => void;
}

export function useGroupEvents(groupId: number, handlers: SSEHandlers) {
  useEffect(() => {
    const es = new EventSource(`/api/groups/${groupId}/events`, { withCredentials: true });

    const register = <T>(event: string, cb?: (data: T) => void) => {
      if (!cb) return;
      es.addEventListener(event, (e: MessageEvent) => {
        try {
          cb(JSON.parse(e.data));
        } catch {
          // malformed event data — ignore
        }
      });
    };

    register('member_joined',       handlers.onMemberJoined);
    register('member_left',         handlers.onMemberLeft);
    register('member_role_changed', handlers.onMemberRoleChanged);
    register('session_created',     handlers.onSessionCreated);
    register('session_updated',     handlers.onSessionUpdated);
    register('session_deleted',     handlers.onSessionDeleted);
    register('invite_code_changed', handlers.onInviteCodeChanged);
    register('group_updated',       handlers.onGroupUpdated);
    if (handlers.onGroupDeleted) {
      es.addEventListener('group_deleted', () => handlers.onGroupDeleted!());
    }

    return () => es.close();
  }, [groupId, handlers]);
}
