import { mapQuickBiteRoleToLocalRole } from "./roles";

export const setItemWithExpiry = (key, value, ttl) => {
    const now = new Date();

    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
};

export const setTokenWithExpiry = (value, ttl) => {
    const now = new Date();

    const item = {
        value: value,
        expiry: ttl ? now.getTime() + ttl : null,
    };
    localStorage.setItem("token", JSON.stringify(item));
};

export const getTokenWithExpiry = () => {
    const itemStr = localStorage.getItem("token");

    if (!itemStr) {
        return null;
    }

    try {
        const item = JSON.parse(itemStr);
        const now = Date.now();

        // If expiry is stored, check it
        if (item.expiry && now > item.expiry) {
            localStorage.removeItem("token");
            return null;
        }

        // Check decoded JWT expiry
        const tokenExpiry = decodeJWT(item.value);
        if (tokenExpiry && now > tokenExpiry) {
            localStorage.removeItem("token");
            return null;
        }

        return item.value;
    } catch {
        return null;
    }
};

export const setRefreshToken = (token) => {
    if (token) {
        localStorage.setItem("refresh_token", token);
    } else {
        localStorage.removeItem("refresh_token");
    }
};

export const getRefreshToken = () => {
    return localStorage.getItem("refresh_token");
};

export const setIsSso = (isSso) => {
    localStorage.setItem("is_sso", isSso ? "true" : "false");
};

export const getIsSso = () => {
    return localStorage.getItem("is_sso") === "true";
};

/**
 * Clear all auth data from localStorage.
 */
export const removeToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("is_sso");
    localStorage.removeItem("id_token");
};

export const getTokenPayload = () => {
    const token = getTokenWithExpiry();
    if (!token) {
        return null;
    }

    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) {
            return null;
        }

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );
        return JSON.parse(atob(padded));
    } catch (error) {
        return null;
    }
};

/**
 * Decode a JWT and return the expiry timestamp (ms), or null if invalid
 */
export const decodeJWT = (token) => {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );
        const payload = JSON.parse(atob(padded));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
};

export const getTokenRole = () => {
    const payload = getTokenPayload();
    if (!payload) return null;
    const rawRole =
        payload.role ||
        payload.roles ||
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    if (rawRole) {
        return mapQuickBiteRoleToLocalRole(rawRole);
    }
    return null;
};


