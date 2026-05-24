import { useState, useEffect } from 'react';
import api from '../utils/api';

interface BackendUser {
  id: number;
  user_id: string;
  username: string;
  created_at: string;
}

let cached: BackendUser | null = null;

export function useCurrentUser() {
  const [user, setUser] = useState<BackendUser | null>(cached);

  useEffect(() => {
    if (cached) return;
    api.get<BackendUser>('/api/auth/me').then((res) => {
      cached = res.data;
      setUser(res.data);
    });
  }, []);

  return user;
}
