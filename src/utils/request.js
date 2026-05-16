import axios from "axios";
import {
    getTokenWithExpiry,
    removeToken,
    getRefreshToken,
    setTokenWithExpiry,
    setRefreshToken,
    decodeJWT,
    getTokenPayload,
} from "../constants/localStorage";

// ─── Configuration ──────────────────────────────────────────
const REFRESH_THRESHOLD_MS = Number(process.env.REACT_APP_REFRESH_THRESHOLD_MS) || 6 * 60 * 1000; // Refresh if < 6 min remaining
const PROACTIVE_REFRESH_INTERVAL_MS = Number(process.env.REACT_APP_PROACTIVE_REFRESH_INTERVAL_MS) || 2 * 60 * 1000; // Check every 2 minutes

console.log("[Refresh Config] REFRESH_THRESHOLD_MS:", REFRESH_THRESHOLD_MS, "=", REFRESH_THRESHOLD_MS / 60000, "min");
console.log("[Refresh Config] PROACTIVE_REFRESH_INTERVAL_MS:", PROACTIVE_REFRESH_INTERVAL_MS, "=", PROACTIVE_REFRESH_INTERVAL_MS / 1000, "sec");

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ─── Refresh token state ────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
    refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
};

// ─── Core refresh function ──────────────────────────────────
const performRefresh = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    console.log("Attempting token refresh with refresh token:", refreshToken);

    const payload = getTokenPayload();
    const username = payload?.username;
    if (!username) {
        return null;
    }
    try {
        const response = await axios.post(
            `${apiBaseUrl}/auth/refresh`,
            {
                refresh_token: refreshToken,
                username: username,
            },
            { withCredentials: true },
        );

        const {
            access_token,
            expires_in,
            refresh_token: newRefreshToken,
        } = response.data;

        setTokenWithExpiry(access_token, expires_in * 1000);
        setRefreshToken(newRefreshToken);

        return access_token;
    } catch {
        removeToken();
        return null;
    }
};

const refreshAccessToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
                resolve(newToken);
            });
        });
    }

    isRefreshing = true;
    try {
        const newToken = await performRefresh();
        onTokenRefreshed(newToken);
        return newToken;
    } finally {
        isRefreshing = false;
    }
};

// ─── Proactive refresh timer ────────────────────────────────
const checkAndRefreshToken = async () => {
    const token = getTokenWithExpiry();

    // No valid token — try to refresh (user might have closed and reopened)
    if (!token) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return;

        const newToken = await refreshAccessToken();
        if (!newToken) {
            window.location.href = "/login";
        }
        return;
    }

    // Check remaining time
    const expiry = decodeJWT(token);
    if (!expiry) return;

    console.log("Token expiry at:", new Date(expiry), "Current time:", new Date());

    const remaining = expiry - Date.now();
    if (remaining < REFRESH_THRESHOLD_MS) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            window.location.href = "/login";
        }
    }
};

// Start the proactive refresh interval (every 2 minutes)
let proactiveTimer = null;
export const startProactiveRefresh = () => {
    if (proactiveTimer) return;
    proactiveTimer = setInterval(checkAndRefreshToken, PROACTIVE_REFRESH_INTERVAL_MS);
};

export const stopProactiveRefresh = () => {
    if (proactiveTimer) {
        clearInterval(proactiveTimer);
        proactiveTimer = null;
    }
};

// Start immediately
startProactiveRefresh();

// ─── Axios instance ─────────────────────────────────────────
const getToken = () => getTokenWithExpiry();

const request = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

// ─── Request interceptor ────────────────────────────────────
request.interceptors.request.use(
    (config) => {
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
    (error) => Promise.reject(error),
);

// ─── Response interceptor (reactive refresh on 401) ─────────
request.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            const status = error.response.status;
            const rawMessage =
                error.response.data?.error?.message || error.response.data?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(" ")
                : String(rawMessage || "");

            if (status === 429) {
                const retryAfter = error.response.headers?.["retry-after"];
                const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
                const waitMinutes = Math.ceil(waitSeconds / 60);
                error.isRateLimited = true;
                error.rateLimitMessage = `Hệ thống đang bận, vui lòng thử lại sau ${waitMinutes} phút.`;
                return Promise.reject(error);
            }

            if (status === 403 && /khóa|locked|bị khóa/i.test(message)) {
                removeToken();
                window.location.href = "/locked";
                return Promise.reject(error);
            }

            if (status === 401) {
                // Try to refresh the token
                const newToken = await refreshAccessToken();

                if (newToken) {
                    // Retry the original request with the new token
                    const originalRequest = error.config;
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    return request(originalRequest);
                } else {
                    // Refresh failed — session expired
                    removeToken();
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    },
);

// ─── Helper functions ───────────────────────────────────────
const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizePath = (path) => {
    if (typeof path !== "string") {
        return path;
    }
    if (
        path.startsWith("/") ||
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }
    return `/${path}`;
};

// ─── HTTP method exports ────────────────────────────────────
export const remove = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.delete(normalizePath(path), {
        ...options,
        headers,
    });
    return response.data;
};

export const get = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.get(normalizePath(path), {
        ...options,
        headers,
    });
    return response.data;
};

export const post = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.post(normalizePath(path), data, {
        ...options,
        headers,
    });
    return response.data;
};

export const put = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.put(normalizePath(path), data, {
        ...options,
        headers,
    });
    return response.data;
};

export const patch = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.patch(normalizePath(path), data, {
        ...options,
        headers,
    });
    return response.data;
};

export default request;