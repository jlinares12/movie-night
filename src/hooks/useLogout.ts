import { useCallback } from 'react';
import { useClerk } from '@clerk/clerk-react';
import api from '../utils/api';

/**
 * Tears down both halves of the dual-layer auth: the Flask session cookie first,
 * then the Clerk session. Order matters — the DELETE needs the cookie to still
 * be attached, and `signOut` navigates away.
 */
export function useLogout() {
  const { signOut } = useClerk();

  return useCallback(async () => {
    await api.delete('/api/auth/session');
    signOut({ redirectUrl: '/login' });
  }, [signOut]);
}
