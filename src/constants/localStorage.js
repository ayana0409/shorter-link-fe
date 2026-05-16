export const setItemWithExpiry = (key, value, ttl) => {
    const now = new Date()

    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
}

export const setTokenWithExpiry = (value, ttl) => {
    const now = new Date()

    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem('token', JSON.stringify(item))
}

export const getTokenWithExpiry = () => {
    const itemStr = localStorage.getItem('token')

    if (!itemStr) {
        return null
    }

    const item = JSON.parse(itemStr)
    const now = Date.now()

    const tokenExpiry = decodeJWT(item.value)

    if (!tokenExpiry || now > tokenExpiry) {
        localStorage.removeItem('token')
        return null
    }

    return item.value
}

/**
 * Clear access token from localStorage.
 * Refresh token is stored in HttpOnly cookie — cleared by backend on logout.
 */
export const removeToken = () => {
    localStorage.removeItem('token')
}

export const getTokenPayload = () => {
    const token = getTokenWithExpiry()
    if (!token) {
        return null
    }

    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) {
            return null
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
        return JSON.parse(atob(padded))
    } catch (error) {
        return null
    }
}

/**
 * Decode a JWT and return the expiry timestamp (ms), or null if invalid
 */
export const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) return null
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
        const payload = JSON.parse(atob(padded))
        return payload.exp ? payload.exp * 1000 : null
    } catch {
        return null
    }
}

export const getTokenRole = () => {
    const payload = getTokenPayload()
    return payload?.role || null
}

