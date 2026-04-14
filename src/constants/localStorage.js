
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

export const getTokenPayload = () => {
    const token = getTokenWithExpiry()
    if (!token) {
        return null
    }

    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch (error) {
        return null
    }
}

export const getTokenRole = () => {
    const payload = getTokenPayload()
    return payload?.role || null
}

export const removeToken = () => {
    localStorage.removeItem('token');
}

const decodeJWT = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.exp ? payload.exp * 1000 : null
    } catch (error) {
        return null
    }
}