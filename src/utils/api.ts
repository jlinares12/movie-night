import axios from 'axios';
import { loadingSetterRef } from '../context/LoadingContext';

const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
    res => res,
    err => {
        if (
            err.response?.status === 401 &&
            !err.config?.url?.includes('/api/auth/session')
        ) {
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

let pendingCount = 0;

api.interceptors.request.use(config => {
    if (++pendingCount === 1) loadingSetterRef.current?.(true);
    return config;
});

const settle = () => {
    if (--pendingCount === 0) loadingSetterRef.current?.(false);
};

api.interceptors.response.use(
    res => { settle(); return res; },
    err => { settle(); return Promise.reject(err); }
);

export default api;
