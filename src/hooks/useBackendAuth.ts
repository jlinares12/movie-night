import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export function useBackendAuth() {
    const { isSignedIn, getToken } = useAuth();
    const [sessionReady, setSessionReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isSignedIn) {
            setSessionReady(false);
            return;
        }
        (async () => {
            try {
                const token = await getToken();
                await api.post('/api/auth/session', { token });
                setSessionReady(true);
            } catch (err) {
                console.error('Backend session creation failed:', err);
                navigate('/login');
            }
        })();
    }, [isSignedIn, getToken, navigate]);

    return { sessionReady };
}
