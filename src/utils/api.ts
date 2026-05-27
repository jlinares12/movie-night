import axios from 'axios';

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

api.interceptors.request.use(config => {
    window.dispatchEvent(new CustomEvent('loading:start'));
    return config;
});

const settle = () => {
    window.dispatchEvent(new CustomEvent('loading:end'));
};

api.interceptors.response.use(
    res => { settle(); return res; },
    err => { settle(); return Promise.reject(err); }
);

export default api;
