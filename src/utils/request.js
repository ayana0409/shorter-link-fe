import axios from "axios";
import { getTokenWithExpiry, removeToken } from "../constants/localStorage";
import { MSG } from "../constants/messages";

const getToken = () => {
    return getTokenWithExpiry();
};

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const request = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
})

request.interceptors.request.use(
    config => {
        const token = getToken();
        if (!config.headers) {
            config.headers = {};
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }
        return config;
    },
    error => Promise.reject(error)
);

request.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            const status = error.response.status;
            const rawMessage = error.response.data?.error?.message || error.response.data?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(' ')
                : String(rawMessage || '');

            if (status === 429) {
                // Rate limited — calculate retry time from Retry-After header (seconds) or default 60s
                const retryAfter = error.response.headers?.['retry-after'];
                const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
                const waitMinutes = Math.ceil(waitSeconds / 60);
                error.isRateLimited = true;
                error.rateLimitMessage = `Hệ thống đang bận, vui lòng thử lại sau ${waitMinutes} phút.`;
                return Promise.reject(error);
            }

            if (status === 403 && /khóa|locked|bị khóa/i.test(message)) {
                removeToken();
                window.location.href = '/locked';
            }
            if (status === 401) {
                removeToken();
            }
        }
        return Promise.reject(error);
    }
);

const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizePath = (path) => {
    if (typeof path !== 'string') {
        return path;
    }
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `/${path}`;
};

export const remove = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.delete(normalizePath(path), { ...options, headers });
    return response.data;
};

export const get = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.get(normalizePath(path), { ...options, headers });

    return response.data;
};

export const post = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.post(normalizePath(path), data, { ...options, headers });
    return response.data;
};

export const put = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.put(normalizePath(path), data, { ...options, headers });
    return response.data;
};

export const patch = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.patch(normalizePath(path), data, { ...options, headers });
    return response.data;
};

export default request