import axios from "axios";
import {
    getTokenWithExpiry,
    removeToken,
    decodeJWT,
    getTokenPayload,
    setTokenWithExpiry,
} from "../constants/localStorage";
import store from "../store";
import { updateAccessToken, logout as logoutAction } from "../store/authSlice";

// ─── Configuration ──────────────────────────────────────────
const REFRESH_THRESHOLD_MS =
    Number(process.env.REACT_APP_REFRESH_THRESHOLD_MS) || 6 * 60 * 1000;
const PROACTIVE_REFRESH_INTERVAL_MS =
    Number(process.env.REACT_APP_PROACTIVE_REFRESH_INTERVAL_MS) || 2 * 60 * 1000;

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ─── Multi-tab sync ─────────────────────────────────────────
const CHANNEL_NAME = "auth_channel";
let broadcastChannel = null;

try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
} catch {
    // BroadcastChannel not supported
}

const broadcastAuthChange = (type, payload) => {
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
};

export const initMultiTabSync = () => {
    if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
            const { type, payload } = event.data;
            switch (type) {
                case "LOGOUT":
                    store.dispatch(logoutAction());
                    break;
                case "TOKEN_REFRESHED":
                    if (payload?.access_token) {
                        store.dispatch(updateAccessToken(payload.access_token));
                    }
                    break;
                default:
                    break;
            }
        };
    }

    window.addEventListener("storage", (event) => {
        if (event.key === "auth_logout" && event.newValue) {
            store.dispatch(logoutAction());
            localStorage.removeItem("auth_logout");
        }
        if (event.key === "auth_token_refreshed" && event.newValue) {
            try {
                const data = JSON.parse(event.newValue);
                if (data?.access_token) {
                    store.dispatch(updateAccessToken(data.access_token));
                }
            } catch {
                // ignore
            }
            localStorage.removeItem("auth_token_refreshed");
        }
    });
};

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

// ─── Get access token from Redux ────────────────────────────
const getAccessToken = () => {
    return store.getState().auth.accessToken;
};

// ─── Core refresh function ──────────────────────────────────
const performRefresh = async () => {
    const payload = getTokenPayload();
    const username = payload?.username;
    if (!username) {
        return null;
    }

    try {
        // Refresh token is sent automatically via HttpOnly cookie
        const response = await axios.post(
            `${apiBaseUrl}/auth/refresh`,
            { username },
            { withCredentials: true },
        );

        const { access_token, expires_in } = response.data;

        // Update Redux store
        store.dispatch(updateAccessToken(access_token));

        // Keep localStorage in sync for backward compatibility
        setTokenWithExpiry(access_token, expires_in * 1000);

        // Broadcast to other tabs
        broadcastAuthChange("TOKEN_REFRESHED", { access_token });
        try {
            localStorage.setItem(
                "auth_token_refreshed",
                JSON.stringify({ access_token, timestamp: Date.now() }),
            );
        } catch {
            // ignore
        }

        return access_token;
    } catch {
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
    const token = getAccessToken() || getTokenWithExpiry();

    if (!token) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            window.location.href = "/login";
        }
        return;
    }

    const expiry = decodeJWT(token);
    if (!expiry) return;

    const remaining = expiry - Date.now();
    if (remaining < REFRESH_THRESHOLD_MS) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            window.location.href = "/login";
        }
    }
};

// ─── Page Visibility API — refresh immediately when tab regains focus ───
let lastVisibilityCheck = 0;
const VISIBILITY_CHECK_DEBOUNCE_MS = 5000; // Prevent rapid re-checks

const handleVisibilityChange = () => {
    // Only run when tab becomes visible
    if (document.visibilityState !== "visible") return;

    // Debounce: avoid checking too frequently
    const now = Date.now();
    if (now - lastVisibilityCheck < VISIBILITY_CHECK_DEBOUNCE_MS) return;
    lastVisibilityCheck = now;

    // Check token immediately when tab becomes visible
    const token = getAccessToken() || getTokenWithExpiry();

    // No token at all — try to refresh from cookie
    if (!token) {
        refreshAccessToken().then((newToken) => {
            if (!newToken) {
                // Only redirect if we're on a protected page
                const publicPaths = ["/login", "/register", "/forgot-password", "/"];
                if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
                    window.location.href = "/login";
                }
            }
        });
        return;
    }

    // Token exists — check if it's expired or about to expire
    const expiry = decodeJWT(token);
    if (!expiry) return;

    const remaining = expiry - Date.now();

    // Token already expired or about to expire — refresh immediately
    if (remaining < REFRESH_THRESHOLD_MS) {
        refreshAccessToken().then((newToken) => {
            if (!newToken) {
                const publicPaths = ["/login", "/register", "/forgot-password", "/"];
                if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
                    window.location.href = "/login";
                }
            }
        });
    }
};

// ─── Visibility change listener setup ───────────────────────
export const initVisibilityRefresh = () => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
};

export const cleanupVisibilityRefresh = () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
};

// ─── Timer management (using setTimeout to avoid throttle) ──
let proactiveTimer = null;
let isProactiveRefreshRunning = false;

const scheduleNextCheck = () => {
    if (!isProactiveRefreshRunning) return;
    proactiveTimer = setTimeout(async () => {
        try {
            await checkAndRefreshToken();
        } finally {
            // Schedule next check regardless of success/failure
            scheduleNextCheck();
        }
    }, PROACTIVE_REFRESH_INTERVAL_MS);
};

export const startProactiveRefresh = () => {
    if (isProactiveRefreshRunning) return;
    isProactiveRefreshRunning = true;
    scheduleNextCheck();
};

export const stopProactiveRefresh = () => {
    isProactiveRefreshRunning = false;
    if (proactiveTimer) {
        clearTimeout(proactiveTimer);
        proactiveTimer = null;
    }
};

// Start both mechanisms
startProactiveRefresh();
initVisibilityRefresh();

// ─── Axios instance ─────────────────────────────────────────
const getToken = () => getAccessToken() || getTokenWithExpiry();

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
                store.dispatch(logoutAction());
                removeToken();
                broadcastAuthChange("LOGOUT");
                try {
                    localStorage.setItem("auth_logout", String(Date.now()));
                } catch {
                    // ignore
                }
                window.location.href = "/locked";
                return Promise.reject(error);
            }

            if (status === 401) {
                // Don't intercept auth endpoints — let the caller handle the error
                const requestUrl = error.config?.url || "";
                if (
                    requestUrl.includes("/auth/login") ||
                    requestUrl.includes("/auth/refresh") ||
                    requestUrl.includes("/auth/logout")
                ) {
                    return Promise.reject(error);
                }

                const newToken = await refreshAccessToken();

                if (newToken) {
                    const originalRequest = error.config;
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    return request(originalRequest);
                } else {
                    store.dispatch(logoutAction());
                    removeToken();
                    broadcastAuthChange("LOGOUT");
                    try {
                        localStorage.setItem("auth_logout", String(Date.now()));
                    } catch {
                        // ignore
                    }
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
