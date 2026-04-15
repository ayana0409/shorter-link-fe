import axios from "axios";
import { getTokenWithExpiry } from "../constants/localStorage";

const getToken = () => {
    return getTokenWithExpiry();
};

const request = axios.create({
    baseURL: 'http://localhost:3001/',
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
            if (status === 401 || status === 403) {
                console.log(status);

                //window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const remove = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.delete(path, { ...options, headers });
    return response.data;
};

export const get = async (path, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.get(path, { ...options, headers });

    return response.data;
};

export const post = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.post(path, data, { ...options, headers });
    return response.data;
};

export const put = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.put(path, data, { ...options, headers });
    return response.data;
};

export const patch = async (path, data = {}, options = {}) => {
    const headers = {
        ...buildAuthHeaders(),
        ...options.headers,
    };
    const response = await request.patch(path, data, { ...options, headers });
    return response.data;
};

export default request