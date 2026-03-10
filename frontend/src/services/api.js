import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('slx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-logout on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('slx_token');
            localStorage.removeItem('slx_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const register = (email, password) =>
    api.post('/api/auth/register', { email, password });

export const login = (email, password) =>
    api.post('/api/auth/login', { email, password });

export const getProfile = () => api.get('/api/auth/profile');

// ── URLs ────────────────────────────────────────────────────────────────────
export const shortenUrl = (data) => api.post('/api/url/shorten', data);
export const getUserUrls = (page = 1, limit = 20) =>
    api.get(`/api/url/user?page=${page}&limit=${limit}`);
export const editUrl = (id, data) => api.put(`/api/url/edit/${id}`, data);
export const deleteUrl = (id) => api.delete(`/api/url/${id}`);
export const bulkShorten = (urls) => api.post('/api/url/bulk', { urls });

// ── Analytics ────────────────────────────────────────────────────────────────
export const getSummary = () => api.get('/api/analytics/summary');
export const getLinkAnalytics = (shortCode, days = 30) =>
    api.get(`/api/analytics/${shortCode}?days=${days}`);

export default api;
