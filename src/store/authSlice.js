import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    accessToken: null,
    user: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { access_token, user } = action.payload;
            state.accessToken = access_token;
            state.user = user;
            state.isAuthenticated = true;
        },
        updateAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        logout: () => initialState,
    },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;

// Selectors
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
