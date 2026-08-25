import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    accessToken: null,
    refreshToken: null,
    idToken: null,
    user: null,
    isAuthenticated: false,
    isSso: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { access_token, accessToken, refreshToken, idToken, user, isSso } = action.payload;
            state.accessToken = accessToken || access_token;
            if (refreshToken !== undefined) state.refreshToken = refreshToken;
            if (idToken !== undefined) state.idToken = idToken;
            state.user = user;
            state.isAuthenticated = Boolean(state.accessToken);
            state.isSso = Boolean(isSso || user?.isSso);
        },
        setAuth: (state, action) => {
            const { user, accessToken, refreshToken, idToken, isSso } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken || null;
            state.idToken = idToken || null;
            state.isAuthenticated = Boolean(accessToken);
            state.isSso = Boolean(isSso ?? true);
        },
        updateAccessToken: (state, action) => {
            state.accessToken = action.payload;
            state.isAuthenticated = Boolean(action.payload);
        },
        setTokens: (state, action) => {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            if (refreshToken) state.refreshToken = refreshToken;
            state.isAuthenticated = Boolean(accessToken);
        },
        logout: () => initialState,
    },
});

export const { setCredentials, setAuth, updateAccessToken, setTokens, logout } = authSlice.actions;

// Selectors
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsSso = (state) => state.auth.isSso;

export default authSlice.reducer;

