import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    // Redux Toolkit includes redux-thunk by default
    // Serializability check disabled for non-serializable values in actions if needed
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: true,
        }),
    devTools: process.env.NODE_ENV !== "production",
});

export { store };
export default store;
